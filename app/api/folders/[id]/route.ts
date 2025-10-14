import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import { ZodError, z } from 'zod';

// DELETE /api/folders/[id] - Delete a folder and all its documents
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response if not authenticated
    }

    const userId = authResult.userId;

    // Await params as per Next.js 15 requirements
    const { id: folderId } = await params;

    // Connect to database
    await connectDB();

    // Find folder and verify it belongs to the user
    const folder = await Folder.findOne({
      _id: folderId,
      userId,
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Find all documents in this folder
    const documents = await Document.find({ folderId });

    // Delete all document files from storage
    const uploadDir = path.join(process.cwd(), 'uploads');

    for (const doc of documents) {
      try {
        const filePath = path.join(uploadDir, doc.storagePath);
        await fs.unlink(filePath);
      } catch (error) {
        // Log error but continue deletion
        console.error(`Failed to delete file: ${doc.storagePath}`, error);
      }
    }

    // Delete all documents from database
    await Document.deleteMany({ folderId });

    // Delete the folder
    await Folder.deleteOne({ _id: folderId });

    return NextResponse.json(
      {
        message: 'Folder and all its contents deleted successfully',
        deletedDocuments: documents.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Folder deletion error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the folder' },
      { status: 500 }
    );
  }
}

// GET /api/folders/[id] - Get folder details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response if not authenticated
    }

    const userId = authResult.userId;

    // Await params as per Next.js 15 requirements
    const { id: folderId } = await params;

    // Connect to database
    await connectDB();

    // Find folder and verify it belongs to the user
    const folder = await Folder.findOne({
      _id: folderId,
      userId,
    }).select('-passwordHash');

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          lastAccessedAt: folder.lastAccessedAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Fetch folder error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the folder' },
      { status: 500 }
    );
  }
}

// PATCH /api/folders/[id] - Update folder details
const updateFolderSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required').max(100).optional(),
  description: z.string().max(500).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;
    const { id: folderId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateFolderSchema.parse(body);

    // Connect to database
    await connectDB();

    // Find folder and verify ownership
    const folder = await Folder.findOne({ _id: folderId, userId });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check if new folder name already exists for this user (if updating name)
    if (validatedData.folderName && validatedData.folderName !== folder.folderName) {
      const existingFolder = await Folder.findOne({
        userId,
        folderName: validatedData.folderName,
        _id: { $ne: folderId },
      });

      if (existingFolder) {
        return NextResponse.json(
          { error: 'A folder with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update folder fields
    if (validatedData.folderName) {
      folder.folderName = validatedData.folderName;
    }
    if (validatedData.description !== undefined) {
      folder.description = validatedData.description;
    }
    if (validatedData.password) {
      folder.passwordHash = validatedData.password; // Will be hashed by pre-save hook
    }

    await folder.save();

    return NextResponse.json(
      {
        message: 'Folder updated successfully',
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          updatedAt: folder.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Update folder error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating the folder' },
      { status: 500 }
    );
  }
}
