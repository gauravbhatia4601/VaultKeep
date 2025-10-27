'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface DocumentCardProps {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onShare: (id: string) => void;
}

export default function DocumentCard({
  id,
  originalName,
  mimeType,
  size,
  uploadedAt,
  onDownload,
  onDelete,
  onRename,
  onShare,
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(originalName);

  // Format file size
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get file icon based on mime type
  const getFileIcon = () => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${originalName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
  };

  const handleRename = async () => {
    if (newName.trim() === '' || newName === originalName) {
      setIsRenaming(false);
      setNewName(originalName);
      return;
    }

    try {
      await onRename(id, newName);
      setIsRenaming(false);
    } catch (error) {
      console.error('Rename error:', error);
      setNewName(originalName);
      setIsRenaming(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <div className="backdrop-blur-md bg-white/90 border border-border/50 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 p-6">
        {/* File Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="h-14 w-14 bg-gradient-to-br from-background to-background rounded-xl flex items-center justify-center shadow-md">
            {getFileIcon()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDownload(id)}
              className="p-2 rounded-lg bg-muted/30 hover:bg-muted text-primary"
              title="Download"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600"
              title="Share"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
              title="Rename"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {/* File Name - Editable */}
        {isRenaming ? (
          <div className="mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setNewName(originalName);
                }
              }}
              autoFocus
              className="w-full px-2 py-1 text-base font-semibold text-gray-900 border-2 border-primary rounded focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <h3 className="text-base font-semibold text-gray-900 mb-2 truncate" title={originalName}>
            {originalName}
          </h3>
        )}

        {/* File Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="font-medium">{formatSize(size)}</span>
          <span className="text-xs text-gray-500">{mimeType.split('/')[1]?.toUpperCase()}</span>
        </div>

        {/* Upload Date */}
        <div className="text-xs text-gray-500 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(uploadedAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
