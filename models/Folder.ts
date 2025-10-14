import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IFolder extends Document {
  userId: Types.ObjectId;
  folderName: string;
  passwordHash: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  documentCount: number;
  totalSize: number;
  lastAccessedAt?: Date;
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
      required: [true, 'Folder password is required'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
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

// Compound index to ensure unique folder names per user
FolderSchema.index({ userId: 1, folderName: 1 }, { unique: true });

// Index for faster queries
FolderSchema.index({ userId: 1, createdAt: -1 });

// Method to compare folder passwords
FolderSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save hook to hash password
FolderSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
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

// Prevent password from being returned in queries
FolderSchema.set('toJSON', {
  transform: function (_doc, ret) {
    const { passwordHash, ...rest } = ret;
    return rest;
  },
});

const Folder: Model<IFolder> = mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
