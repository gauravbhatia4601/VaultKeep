import { z } from 'zod';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// User registration schema
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Folder creation schema
export const createFolderSchema = z.object({
  folderName: z
    .string()
    .min(1, 'Please enter a folder name')
    .max(100, 'Folder name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password is too long (maximum 128 characters)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match. Please make sure both passwords are identical.',
  path: ['confirmPassword'],
});

// Folder password verification schema
export const verifyFolderPasswordSchema = z.object({
  folderId: z.string().min(1, 'Folder ID is required'),
  password: z.string().min(1, 'Password is required'),
});

// File upload validation
export const fileUploadSchema = z.object({
  folderId: z.string().min(1, 'Folder ID is required'),
  folderAccessToken: z.string().min(1, 'Folder access token is required'),
});

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File type validation
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// File size validation (10MB max)
export function validateFileSize(size: number): boolean {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
  return size <= maxSize;
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove consecutive dots
    .substring(0, 255); // Limit length
}

// Types for validation
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type VerifyFolderPasswordInput = z.infer<typeof verifyFolderPasswordSchema>;
