import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { verifyFolderAccessToken } from '@/lib/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';

// POST /api/folders/[id]/documents/[docId]/share - Generate share link
export async function POST(
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

    // Generate or reuse share token
    let shareToken = document.shareToken;
    if (!shareToken || (document.shareExpiresAt && document.shareExpiresAt < new Date())) {
      // Generate new token (URL-safe)
      shareToken = crypto.randomBytes(32).toString('base64url');

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      document.shareToken = shareToken;
      document.shareExpiresAt = expiresAt;
      await document.save();
    }

    // Generate shareable URL dynamically based on request
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json(
      {
        message: 'Share link generated successfully',
        shareUrl,
        shareToken,
        expiresAt: document.shareExpiresAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Share link generation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the share link' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id]/documents/[docId]/share - Revoke share link
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

    // Revoke share token
    document.shareToken = undefined;
    document.shareExpiresAt = undefined;
    await document.save();

    return NextResponse.json(
      {
        message: 'Share link revoked successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Share link revoke error:', error);
    return NextResponse.json(
      { error: 'An error occurred while revoking the share link' },
      { status: 500 }
    );
  }
}
