import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { verifyFolderAccessToken } from '@/lib/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { validateFileType, validateFileSize, sanitizeFilename } from '@/lib/validation';

// GET /api/folders/[id]/documents - List all documents in folder
export async function GET(
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

    // Get all documents in folder
    const documents = await Document.find({ folderId })
      .sort({ uploadedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          createdAt: folder.createdAt,
        },
        documents: documents.map((doc) => ({
          id: doc._id,
          fileName: doc.fileName,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
          lastAccessedAt: doc.lastAccessedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching documents' },
      { status: 500 }
    );
  }
}

// POST /api/folders/[id]/documents - Upload document to folder
export async function POST(
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('accessToken') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Folder access token required' },
        { status: 401 }
      );
    }

    // Verify folder access token
    const tokenVerification = verifyFolderAccessToken(token, folderId);
    if (!tokenVerification.valid || tokenVerification.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired folder access token' },
        { status: 401 }
      );
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: PDF, PNG, JPEG, TXT, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const sanitizedOriginalName = sanitizeFilename(file.name);

    // Save file to uploads directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Create document record
    const document = new Document({
      folderId,
      userId,
      fileName: uniqueFileName,
      originalName: sanitizedOriginalName,
      mimeType: file.type,
      size: file.size,
      storagePath: uniqueFileName,
      checksum,
    });

    await document.save();

    // Update folder stats
    folder.documentCount += 1;
    folder.totalSize += file.size;
    await folder.save();

    return NextResponse.json(
      {
        message: 'Document uploaded successfully',
        document: {
          id: document._id,
          fileName: document.fileName,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          uploadedAt: document.uploadedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the document' },
      { status: 500 }
    );
  }
}
