import { NextRequest, NextResponse } from 'next/server';
import { createFolderSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import Folder from '@/models/Folder';
import connectDB from '@/lib/mongodb';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

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

    // Initialize folder path, level, and parentId
    let folderPath = `/${validatedData.folderName}`;
    let folderLevel = 0;
    let parentFolder = null;

    // If parentId is provided, verify it and calculate path/level
    if (validatedData.parentId) {
      parentFolder = await Folder.findOne({
        _id: validatedData.parentId,
        userId,
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found or access denied' },
          { status: 404 }
        );
      }

      // Check nesting depth limit
      if (parentFolder.level >= 5) {
        return NextResponse.json(
          { error: 'Maximum nesting depth (5 levels) reached' },
          { status: 400 }
        );
      }

      // Subfolders inherit parent's path and level
      folderPath = `${parentFolder.path}/${validatedData.folderName}`;
      folderLevel = parentFolder.level + 1;

      // Subfolders cannot have their own PIN (they inherit parent's protection)
      if (validatedData.pin && validatedData.pin.length > 0) {
        return NextResponse.json(
          { error: 'Subfolders cannot have their own PIN. They inherit parent folder protection.' },
          { status: 400 }
        );
      }
    }

    // Check if folder name already exists within the same parent
    const existingFolder = await Folder.findOne({
      userId,
      folderName: validatedData.folderName,
      parentId: validatedData.parentId || null,
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    // Create new folder (PIN will be hashed by pre-save hook if provided)
    const folderData: {
      userId: string;
      folderName: string;
      passwordHash?: string;
      description?: string;
      parentId?: string;
      path: string;
      level: number;
      documentCount: number;
      totalSize: number;
    } = {
      userId,
      folderName: validatedData.folderName,
      description: validatedData.description,
      path: folderPath,
      level: folderLevel,
      documentCount: 0,
      totalSize: 0,
    };

    // Add parentId if this is a subfolder
    if (validatedData.parentId) {
      folderData.parentId = validatedData.parentId;
    }

    // Only set passwordHash if PIN is provided (root folders only)
    if (!validatedData.parentId && validatedData.pin && validatedData.pin.length > 0) {
      folderData.passwordHash = validatedData.pin; // Will be hashed by pre-save hook
    }

    const folder = new Folder(folderData);

    await folder.save();

    return NextResponse.json(
      {
        message: 'Folder created successfully',
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          parentId: folder.parentId,
          path: folder.path,
          level: folder.level,
          documentCount: folder.documentCount,
          totalSize: folder.totalSize,
          isProtected: !!folder.passwordHash,  // Indicate if folder is protected
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

// GET /api/folders - List folders for the authenticated user
// Query params: ?parentId=<folderId> to get subfolders, or no param to get root folders
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response if not authenticated
    }

    const userId = authResult.userId;

    // Get parentId from query params
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    // Connect to database
    await connectDB();

    // Build query: if parentId is provided, fetch subfolders; otherwise fetch root folders
    const query: { userId: string; parentId?: string | null } = { userId };
    
    if (parentId) {
      query.parentId = parentId;
    } else {
      // Fetch only root folders (parentId is null or doesn't exist)
      query.parentId = null;
    }

    // Fetch folders for the user, sorted by creation date (newest first)
    const folders = await Folder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get subfolder counts for each folder
    let subfolderCountMap = new Map<string, number>();
    
    if (folders.length > 0) {
      // Get all folder IDs as ObjectIds and strings
      const folderIds = folders.map(f => f._id);
      const folderIdStrings = folders.map(f => f._id.toString());
      
      // Run aggregation to count subfolders
      const subfolderCounts = await Folder.aggregate([
        { 
          $match: { 
            parentId: { $in: folderIds },
            userId: new mongoose.Types.ObjectId(userId)
          } 
        },
        { 
          $group: { 
            _id: '$parentId', 
            count: { $sum: 1 } 
          } 
        }
      ]);

      // Create a map from string IDs to counts
      subfolderCounts.forEach(({ _id, count }) => {
        if (_id) {
          // Use toString() for consistency
          const parentIdStr = _id.toString();
          subfolderCountMap.set(parentIdStr, count);
        }
      });
    }
    
    // Log the mapping for debugging
    console.log(`Mapped ${subfolderCountMap.size} parent folders to subfolder counts`);

    return NextResponse.json(
      {
        folders: folders.map((folder) => ({
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          parentId: folder.parentId,
          path: folder.path,
          level: folder.level,
          documentCount: folder.documentCount,
          subfolderCount: subfolderCountMap.get(folder._id.toString()) || 0, // Add subfolder count
          totalSize: folder.totalSize,
          isProtected: !!folder.passwordHash,  // Include protection status
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
