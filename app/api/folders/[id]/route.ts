import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import Folder from '@/models/Folder';
import Document from '@/models/Document';
import connectDB from '@/lib/mongodb';
import { ZodError, z } from 'zod';
import { deleteFromR2 } from '@/lib/r2Storage';

// Helper function to recursively get all descendant folder IDs
async function getAllDescendantFolderIds(folderId: string): Promise<string[]> {
  const descendants: string[] = [];
  
  // Find direct children
  const children = await Folder.find({ parentId: folderId }).lean();
  
  for (const child of children) {
    descendants.push(child._id.toString());
    // Recursively find descendants of this child
    const childDescendants = await getAllDescendantFolderIds(child._id.toString());
    descendants.push(...childDescendants);
  }
  
  return descendants;
}

// DELETE /api/folders/[id] - Delete a folder, all its subfolders, and all documents
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

    // Get all descendant folder IDs (recursive)
    const descendantFolderIds = await getAllDescendantFolderIds(folderId);
    
    // Include the current folder in the list
    const allFolderIds = [folderId, ...descendantFolderIds];
    
    console.log(`Deleting folder ${folderId} and ${descendantFolderIds.length} subfolders`);

    // Find all documents in this folder and all subfolders
    const documents = await Document.find({ 
      folderId: { $in: allFolderIds } 
    });

    // Delete all document files from R2
    let deletedCount = 0;
    const deletionErrors: string[] = [];

    for (const doc of documents) {
      try {
        await deleteFromR2(doc.storagePath);
        deletedCount++;
        console.log(`Successfully deleted from R2: ${doc.storagePath}`);
      } catch (error) {
        // Log error but continue deletion
        console.error(`Failed to delete file from R2: ${doc.storagePath}`, error);
        deletionErrors.push(doc.originalName);
      }
    }

    // Delete all documents from database (even if some R2 deletions failed)
    await Document.deleteMany({ folderId: { $in: allFolderIds } });

    // Delete all subfolders and the folder itself
    await Folder.deleteMany({ _id: { $in: allFolderIds } });

    return NextResponse.json(
      {
        message: 'Folder and all its contents deleted successfully',
        deletedFolders: allFolderIds.length,
        deletedDocuments: documents.length,
        deletedFromR2: deletedCount,
        errors: deletionErrors.length > 0 ? deletionErrors : undefined,
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
          parentId: folder.parentId,
          path: folder.path,
          level: folder.level,
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

// Helper function to update paths of all descendant folders when parent is renamed
async function updateDescendantPaths(folderId: string, newParentPath: string) {
  const children = await Folder.find({ parentId: folderId });
  
  for (const child of children) {
    const oldPath = child.path;
    // Update child's path
    child.path = `${newParentPath}/${child.folderName}`;
    await child.save();
    
    console.log(`Updated path: ${oldPath} -> ${child.path}`);
    
    // Recursively update this child's descendants
    await updateDescendantPaths((child._id as string).toString(), child.path);
  }
}

// PATCH /api/folders/[id] - Update folder details
const updateFolderSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required').max(100).optional(),
  description: z.string().max(500).optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits').optional(),
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

    // Check if new folder name already exists within the same parent (if updating name)
    if (validatedData.folderName && validatedData.folderName !== folder.folderName) {
      const existingFolder = await Folder.findOne({
        userId,
        folderName: validatedData.folderName,
        parentId: folder.parentId || null,
        _id: { $ne: folderId },
      });

      if (existingFolder) {
        return NextResponse.json(
          { error: 'A folder with this name already exists in this location' },
          { status: 409 }
        );
      }
    }

    // Update folder fields
    const oldFolderName = folder.folderName;
    if (validatedData.folderName) {
      folder.folderName = validatedData.folderName;
      
      // Update path if folder name changed
      if (folder.parentId) {
        // Get parent's path
        const parent = await Folder.findById(folder.parentId);
        if (parent) {
          folder.path = `${parent.path}/${validatedData.folderName}`;
        }
      } else {
        // Root folder
        folder.path = `/${validatedData.folderName}`;
      }
    }
    
    if (validatedData.description !== undefined) {
      folder.description = validatedData.description;
    }
    
    // Only allow PIN updates on root folders
    if (validatedData.pin) {
      if (folder.parentId) {
        return NextResponse.json(
          { error: 'Cannot update PIN for subfolders. They inherit parent folder protection.' },
          { status: 400 }
        );
      }
      folder.passwordHash = validatedData.pin; // Will be hashed by pre-save hook
    }

    await folder.save();

    // If folder name changed, update all descendant folder paths
    if (validatedData.folderName && validatedData.folderName !== oldFolderName) {
      await updateDescendantPaths(folderId, folder.path);
    }

    return NextResponse.json(
      {
        message: 'Folder updated successfully',
        folder: {
          id: folder._id,
          folderName: folder.folderName,
          description: folder.description,
          parentId: folder.parentId,
          path: folder.path,
          level: folder.level,
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
