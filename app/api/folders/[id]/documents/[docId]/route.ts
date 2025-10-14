import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { verifyFolderAccessToken } from '@/lib/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

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

    // Read file from storage
    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, document.storagePath);

    try {
      const fileBuffer = await readFile(filePath);

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
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'File not found or could not be read' },
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

    // Delete file from storage
    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, document.storagePath);

    try {
      await unlink(filePath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Continue with database deletion even if file doesn't exist
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
