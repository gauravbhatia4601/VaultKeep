import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { verifyFolderAccessToken } from '@/lib/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import { z, ZodError } from 'zod';
import { downloadFromR2, deleteFromR2 } from '@/lib/r2Storage';

// GET /api/folders/[id]/documents/[docId] - Download document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;
    const { id: folderId, docId } = await params;

    // Verify folder access token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Folder access token required' },
        { status: 401 }
      );
    }

    const tokenVerification = verifyFolderAccessToken(token, folderId);
    if (!tokenVerification.valid || tokenVerification.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired folder access token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Get document
    const document = await Document.findOne({ _id: docId, folderId });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Download file from R2
    try {
      const fileBuffer = await downloadFromR2(document.storagePath);

      // Update last accessed time
      document.lastAccessedAt = new Date();
      await document.save();

      // Return file
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': document.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.originalName)}"`,
          'Content-Length': document.size.toString(),
        },
      });
    } catch (fileError) {
      console.error('R2 download error:', fileError);
      return NextResponse.json(
        { error: 'File not found or could not be downloaded from R2' },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'An error occurred while downloading the document' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id]/documents/[docId] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;
    const { id: folderId, docId } = await params;

    // Verify folder access token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Folder access token required' },
        { status: 401 }
      );
    }

    const tokenVerification = verifyFolderAccessToken(token, folderId);
    if (!tokenVerification.valid || tokenVerification.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired folder access token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Get document
    const document = await Document.findOne({ _id: docId, folderId });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from R2
    try {
      await deleteFromR2(document.storagePath);
    } catch (fileError) {
      console.error('R2 deletion error:', fileError);
      // Continue with database deletion even if file doesn't exist in R2
    }

    // Update folder stats
    folder.documentCount = Math.max(0, folder.documentCount - 1);
    folder.totalSize = Math.max(0, folder.totalSize - document.size);
    await folder.save();

    // Delete document from database
    await Document.deleteOne({ _id: docId });

    return NextResponse.json(
      {
        message: 'Document deleted successfully',
        deletedSize: document.size,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the document' },
      { status: 500 }
    );
  }
}

// PATCH /api/folders/[id]/documents/[docId] - Rename document
const renameDocumentSchema = z.object({
  originalName: z.string().min(1, 'Document name is required').max(255),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;
    const { id: folderId, docId } = await params;

    // Verify folder access token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Folder access token required' },
        { status: 401 }
      );
    }

    const tokenVerification = verifyFolderAccessToken(token, folderId);
    if (!tokenVerification.valid || tokenVerification.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired folder access token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = renameDocumentSchema.parse(body);

    // Connect to database
    await connectDB();

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Get document
    const document = await Document.findOne({ _id: docId, folderId });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document name
    document.originalName = validatedData.originalName;
    await document.save();

    return NextResponse.json(
      {
        message: 'Document renamed successfully',
        document: {
          id: document._id,
          originalName: document.originalName,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
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

    console.error('Document rename error:', error);
    return NextResponse.json(
      { error: 'An error occurred while renaming the document' },
      { status: 500 }
    );
  }
}
