import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { downloadFromR2 } from '@/lib/r2Storage';

// GET /api/share/[token]/download - Download shared document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await connectDB();

    // Find document by share token
    const document = await Document.findOne({ shareToken: token });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or link invalid' },
        { status: 404 }
      );
    }

    // Check if share link has expired
    if (document.shareExpiresAt && document.shareExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
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
    console.error('Shared document download error:', error);
    return NextResponse.json(
      { error: 'An error occurred while downloading the document' },
      { status: 500 }
    );
  }
}
