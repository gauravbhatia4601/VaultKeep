import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

export interface UploadResult {
  key: string;
  size: number;
  checksum: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<UploadResult> {
  try {
    // Generate unique key with folder structure
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const key = `folders/${folderId}/${uniqueFileName}`;

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalName: fileName,
        checksum: checksum,
      },
    });

    await r2Client.send(command);

    return {
      key,
      size: buffer.length,
      checksum,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Download a file from Cloudflare R2
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error('No file content received from R2');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const body = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('R2 download error:', error);
    throw new Error('Failed to download file from R2');
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from R2');
  }
}

/**
 * Generate a sanitized filename
 */
export function generateUniqueKey(fileName: string, folderId: string): string {
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
  return `folders/${folderId}/${uniqueFileName}`;
}

/**
 * Validate R2 configuration
 */
export function validateR2Config(): { valid: boolean; error?: string } {
  if (!process.env.R2_ENDPOINT) {
    return { valid: false, error: 'R2_ENDPOINT not configured' };
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    return { valid: false, error: 'R2_ACCESS_KEY_ID not configured' };
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    return { valid: false, error: 'R2_SECRET_ACCESS_KEY not configured' };
  }
  if (!process.env.R2_BUCKET_NAME) {
    return { valid: false, error: 'R2_BUCKET_NAME not configured' };
  }
  return { valid: true };
}


