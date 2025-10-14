'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import FileUploadZone from '@/components/documents/FileUploadZone';
import DocumentCard from '@/components/documents/DocumentCard';
import FolderSettingsModal from '@/components/folders/FolderSettingsModal';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface FolderDetails {
  id: string;
  folderName: string;
  description?: string;
  documentCount: number;
  totalSize: number;
  createdAt: string;
}

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface FolderViewClientProps {
  folderId: string;
  user: User;
}

export default function FolderViewClient({ folderId }: FolderViewClientProps) {
  const router = useRouter();
  const [folder, setFolder] = useState<FolderDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    // Check for access token
    const token = sessionStorage.getItem(`folder_token_${folderId}`);
    if (!token) {
      // No access token, redirect to dashboard
      router.push('/dashboard');
      return;
    }
    setAccessToken(token);
    fetchFolderData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, router]);

  const fetchFolderData = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch documents with folder details
      const response = await fetch(`/api/folders/${folderId}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch folder');
      }

      const data = await response.json();

      setFolder({
        id: data.folder.id,
        folderName: data.folder.folderName,
        description: data.folder.description,
        documentCount: data.folder.documentCount,
        totalSize: data.folder.totalSize,
        createdAt: data.folder.createdAt,
      });

      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    // Clear access token
    sessionStorage.removeItem(`folder_token_${folderId}`);
    router.push('/dashboard');
  };

  const handleSettingsSuccess = () => {
    // Refresh folder data after settings update
    if (accessToken) {
      fetchFolderData(accessToken);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh folder data after successful upload
    if (accessToken) {
      fetchFolderData(accessToken);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'download';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Refresh folder data after successful deletion
      if (accessToken) {
        fetchFolderData(accessToken);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading folder...</p>
        </div>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg
              className="h-16 w-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load folder'}</p>
          <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-white">
      {/* 3D Parallax Background */}
      <motion.div
        className="absolute inset-0"
        style={{ perspective: "1000px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
          animate={{
            rotateX: [0, 2, 0],
            rotateY: [0, 2, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-400 to-purple-300 rounded-full opacity-20 blur-3xl"
            style={{ transform: "translateZ(-100px)" }}
            animate={{
              y: [0, 40, 0],
              x: [0, 30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToDashboard}
                className="p-2 rounded-lg bg-white/90 backdrop-blur-md border border-purple-200/50 shadow-lg hover:shadow-xl transition-all"
              >
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </motion.button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{folder.folderName}</h1>
                {folder.description && (
                  <p className="text-sm text-gray-600">{folder.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-600">
                  {folder.documentCount} {folder.documentCount === 1 ? 'file' : 'files'}
                </p>
                <p className="text-xs text-gray-500">{formatSize(folder.totalSize)}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-lg bg-white/90 backdrop-blur-md border border-purple-200/50 shadow-lg hover:shadow-xl transition-all"
                title="Folder Settings"
              >
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {accessToken && (
            <FileUploadZone
              folderId={folderId}
              accessToken={accessToken}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </motion.div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-md bg-white/90 border border-purple-200/50 rounded-2xl shadow-xl p-12 text-center"
          >
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600">Upload your first document to get started</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                fileName={doc.fileName}
                originalName={doc.originalName}
                mimeType={doc.mimeType}
                size={doc.size}
                uploadedAt={doc.uploadedAt}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Folder Settings Modal */}
      {folder && (
        <FolderSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSuccess={handleSettingsSuccess}
          folderId={folderId}
          currentName={folder.folderName}
          currentDescription={folder.description || ''}
        />
      )}
    </div>
  );
}
