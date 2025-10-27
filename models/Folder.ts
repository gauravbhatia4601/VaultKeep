import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IFolder extends Document {
  userId: Types.ObjectId;
  folderName: string;
  passwordHash?: string;  // Optional - folder can be unprotected
  description?: string;
  parentId?: Types.ObjectId;  // Reference to parent folder (null for root folders)
  path: string;  // Full path (e.g., "/Folder1/Folder2")
  level: number;  // Nesting depth (0 = root, 1 = first level, etc.)
  createdAt: Date;
  updatedAt: Date;
  documentCount: number;
  totalSize: number;
  lastAccessedAt?: Date;
  isProtected: boolean;  // Helper field to check if folder has password
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const FolderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    folderName: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      minlength: [1, 'Folder name must be at least 1 character'],
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    passwordHash: {
      type: String,
      required: false,  // Optional - allows unprotected folders
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      required: false,  // null for root folders
      index: true,
    },
    path: {
      type: String,
      required: false,  // Make it optional for backward compatibility with existing folders
      trim: true,
      default: function() {
        // Auto-generate path for existing folders without one
        return `/${this.folderName}`;
      }
    },
    level: {
      type: Number,
      required: false,  // Make it optional for backward compatibility
      default: 0,
      min: 0,
      max: 5,  // Maximum nesting depth
    },
    documentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAccessedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique folder names per user within the same parent
// This allows same folder names in different parent folders
FolderSchema.index({ userId: 1, parentId: 1, folderName: 1 }, { unique: true, sparse: true });

// Keep the old unique index for backward compatibility with existing folders
FolderSchema.index({ userId: 1, folderName: 1 }, { unique: true, partialFilterExpression: { parentId: { $exists: false } } });

// Index for faster queries
FolderSchema.index({ userId: 1, createdAt: -1 });
FolderSchema.index({ userId: 1, parentId: 1 });  // For querying subfolders
FolderSchema.index({ path: 1 });  // For path-based queries

// Virtual field to check if folder is protected
FolderSchema.virtual('isProtected').get(function () {
  return !!this.passwordHash;
});

// Method to compare folder passwords
FolderSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // If folder has no password, return false (should not reach here)
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save hook to auto-populate path and level for existing folders
FolderSchema.pre('save', async function (next) {
  // Auto-populate path if missing
  if (!this.path) {
    if (this.parentId) {
      // This is a subfolder - we need parent's path
      const Folder = this.constructor as typeof import('./Folder').default;
      const parent = await Folder.findById(this.parentId);
      if (parent) {
        this.path = `${parent.path}/${this.folderName}`;
        this.level = (parent.level || 0) + 1;
      } else {
        // Parent not found, treat as root
        this.path = `/${this.folderName}`;
        this.level = 0;
      }
    } else {
      // Root folder
      this.path = `/${this.folderName}`;
      this.level = 0;
    }
  }

  // Auto-populate level if missing
  if (this.level === undefined || this.level === null) {
    this.level = 0;
  }

  next();
});

// Pre-save hook to hash password (only if password exists)
FolderSchema.pre('save', async function (next) {
  // Skip if password not modified or doesn't exist
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Prevent password from being returned in queries, but include isProtected
FolderSchema.set('toJSON', {
  virtuals: true,  // Include virtual fields like isProtected
  transform: function (_doc, ret) {
    const { passwordHash, ...rest } = ret;
    return rest;
  },
});

const Folder: Model<IFolder> = mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
