import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IDocument extends Document {
  folderId: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  checksum: string;
  shareToken?: string;
  shareExpiresAt?: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      required: [true, 'Folder ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
    },
    checksum: {
      type: String,
      required: [true, 'Checksum is required'],
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    shareExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
DocumentSchema.index({ folderId: 1, uploadedAt: -1 });
DocumentSchema.index({ userId: 1, uploadedAt: -1 });

// Index for checksum-based duplicate detection
DocumentSchema.index({ folderId: 1, checksum: 1 });

const DocumentModel: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;
