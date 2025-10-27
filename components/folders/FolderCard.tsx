'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface FolderCardProps {
  id: string;
  folderName: string;
  description?: string;
  documentCount: number;
  subfolderCount?: number;  // Count of subfolders inside this folder
  totalSize: number;
  isProtected: boolean;  // NEW: indicates if folder requires PIN
  createdAt: string;
  lastAccessedAt?: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FolderCard({
  id,
  folderName,
  description,
  documentCount,
  subfolderCount = 0,
  totalSize,
  isProtected,
  createdAt,
  lastAccessedAt,
  onOpen,
  onDelete,
}: FolderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Format file size in human readable format
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${folderName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(id)}
      className="relative group cursor-pointer"
    >
      <div className="backdrop-blur-md bg-white/90 border border-border/50 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 p-6">
        {/* Folder Icon */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotateY: 10 }}
            transition={{ duration: 0.3 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="h-14 w-14 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </motion.div>

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
          >
            {isDeleting ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Folder Name with Protection Badge */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900 truncate flex-1">
            {folderName}
          </h3>
          {isProtected ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-primary text-xs font-semibold rounded-full">
              🔒 Protected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              🔓 Open
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
            {description}
          </p>
        )}

        {/* Stats */}
        <div className="space-y-2 mb-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {/* Subfolder Count */}
              <div className="flex items-center gap-1">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium">{subfolderCount}</span>
                <span>{subfolderCount === 1 ? 'folder' : 'folders'}</span>
              </div>

              {/* File Count */}
              <div className="flex items-center gap-1">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">{documentCount}</span>
                <span>{documentCount === 1 ? 'file' : 'files'}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 font-medium">
              {formatSize(totalSize)}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Created {formatDate(createdAt)}</span>
          </div>
          {lastAccessedAt && (
            <div className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>Accessed {formatDate(lastAccessedAt)}</span>
            </div>
          )}
        </div>

        {/* Hover Effect Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute bottom-4 right-4 text-primary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
