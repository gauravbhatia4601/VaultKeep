import { NextRequest, NextResponse } from 'next/server';
import { createFolderSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import Folder from '@/models/Folder';
import connectDB from '@/lib/mongodb';
import { ZodError } from 'zod';

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response if not authenticated
    }

    const userId = authResult.userId;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createFolderSchema.parse(body);

    // Connect to database
    await connectDB();

    // Check if folder name already exists for this user
    const existingFolder = await Folder.findOne({
      userId,
      folderName: validatedData.folderName,
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 }
      );
    }

    // Create new folder (password will be hashed by pre-save hook)
    const folder = new Folder({
      userId,
      folderName: validatedData.folderName,
      passwordHash: validatedData.password, // Will be hashed by pre-save hook
      description: validatedData.description,
      documentCount: 0,
      totalSize: 0,
    });

    await folder.save();

    return NextResponse.json(
      {
        message: 'Folder created successfully',
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          createdAt: folder.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Folder creation error:', error);

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

    // Handle duplicate key error from MongoDB
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 }
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'An error occurred while creating the folder' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while creating the folder' },
      { status: 500 }
    );
  }
}

// GET /api/folders - List all folders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response if not authenticated
    }

    const userId = authResult.userId;

    // Connect to database
    await connectDB();

    // Fetch all folders for the user, sorted by creation date (newest first)
    const folders = await Folder.find({ userId })
      .select('-passwordHash') // Exclude password hash
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        folders: folders.map((folder) => ({
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          lastAccessedAt: folder.lastAccessedAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Fetch folders error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching folders' },
      { status: 500 }
    );
  }
}
