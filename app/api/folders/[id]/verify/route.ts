import { NextRequest, NextResponse } from 'next/server';
import { verifyFolderPasswordSchema } from '@/lib/validation';
import { requireAuth, generateFolderAccessToken } from '@/middleware/auth';
import Folder from '@/models/Folder';
import connectDB from '@/lib/mongodb';
import { ZodError } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/middleware/rateLimit';

// POST /api/folders/[id]/verify - Verify folder password and return access token
export async function POST(
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

    // Rate limiting: 3 attempts per 5 minutes
    const rateLimitKey = `folder-verify:${userId}:${folderId}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.folderPassword);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = verifyFolderPasswordSchema.parse({
      folderId,
      password: body.password,
    });

    // Connect to database
    await connectDB();

    // Find folder and verify it belongs to the user
    const folder = await Folder.findOne({
      _id: validatedData.folderId,
      userId,
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Compare password
    const isPasswordValid = await folder.comparePassword(validatedData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Update last accessed time
    folder.lastAccessedAt = new Date();
    await folder.save();

    // Generate JWT access token for this folder (valid for 1 hour)
    const accessToken = generateFolderAccessToken(
      userId,
      folderId
    );

    return NextResponse.json(
      {
        message: 'Folder access granted',
        accessToken,
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
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

    console.error('Folder password verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying folder password' },
      { status: 500 }
    );
  }
}
