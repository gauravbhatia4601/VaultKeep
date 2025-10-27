'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UnifiedUploadZone from '@/components/documents/UnifiedUploadZone';
import DocumentCard from '@/components/documents/DocumentCard';
import FolderCard from '@/components/folders/FolderCard';
import FolderSettingsModal from '@/components/folders/FolderSettingsModal';
import ShareDocumentModal from '@/components/documents/ShareDocumentModal';
import CreateFolderModal from '@/components/folders/CreateFolderModal';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface FolderDetails {
  id: string;
  folderName: string;
  description?: string;
  parentId?: string;
  path: string;
  level: number;
  documentCount: number;
  totalSize: number;
  createdAt: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
}

interface Subfolder {
  id: string;
  folderName: string;
  description?: string;
  documentCount: number;
  subfolderCount: number;
  totalSize: number;
  isProtected: boolean;
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
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateSubfolderModalOpen, setIsCreateSubfolderModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // First, check URL parameter for token (for direct access from dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      // Save token to sessionStorage for future use
      sessionStorage.setItem(`folder_token_${folderId}`, urlToken);
      setAccessToken(urlToken);
      fetchFolderData(urlToken);
      // Clean up URL (remove token from address bar)
      window.history.replaceState({}, '', `/folders/${folderId}`);
      return;
    }
    
    // If no URL token, check sessionStorage
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
      const docsResponse = await fetch(`/api/folders/${folderId}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!docsResponse.ok) {
        const data = await docsResponse.json();
        throw new Error(data.error || 'Failed to fetch folder');
      }

      const docsData = await docsResponse.json();

      setFolder({
        id: docsData.folder.id,
        folderName: docsData.folder.folderName,
        description: docsData.folder.description,
        parentId: docsData.folder.parentId,
        path: docsData.folder.path,
        level: docsData.folder.level,
        documentCount: docsData.folder.documentCount,
        totalSize: docsData.folder.totalSize,
        createdAt: docsData.folder.createdAt,
      });

      setDocuments(docsData.documents || []);

      // Fetch subfolders
      const subfoldersResponse = await fetch(`/api/folders?parentId=${folderId}`);
      if (subfoldersResponse.ok) {
        const subfoldersData = await subfoldersResponse.json();
        setSubfolders(subfoldersData.folders || []);
      }

      // Build breadcrumbs by fetching parent folder chain
      await buildBreadcrumbs(docsData.folder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const buildBreadcrumbs = async (currentFolder: FolderDetails) => {
    const crumbs: BreadcrumbItem[] = [];
    
    // Add current folder
    crumbs.unshift({
      id: currentFolder.id,
      name: currentFolder.folderName,
      level: currentFolder.level,
    });

    // Traverse up to get parent folders
    let parentId = currentFolder.parentId;
    while (parentId) {
      try {
        const response = await fetch(`/api/folders/${parentId}`);
        if (response.ok) {
          const data = await response.json();
          crumbs.unshift({
            id: data.folder.id,
            name: data.folder.folderName,
            level: data.folder.level,
          });
          parentId = data.folder.parentId;
        } else {
          break;
        }
      } catch (error) {
        console.error('Error fetching parent folder:', error);
        break;
      }
    }

    setBreadcrumbs(crumbs);
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
      
      // Show success message
      setError('Document deleted successfully from storage and database');
      setTimeout(() => setError(null), 3000);

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

  const handleRename = async (docId: string, newName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ originalName: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      // Refresh folder data after successful rename
      if (accessToken) {
        fetchFolderData(accessToken);
      }
    } catch (err) {
      console.error('Rename error:', err);
      setError('Failed to rename document');
      setTimeout(() => setError(null), 3000);
      throw err;
    }
  };

  const handleShare = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setSelectedDocument({ id: doc.id, name: doc.originalName });
      setIsShareModalOpen(true);
    }
  };

  const handleOpenSubfolder = async (subfolderId: string) => {
    try {
      // Get a new token for the subfolder by calling verify endpoint
      // Subfolders don't have passwords, so we pass empty password
      const response = await fetch(`/api/folders/${subfolderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '' }),
      });

      if (!response.ok) {
        throw new Error('Failed to access subfolder');
      }

      const data = await response.json();
      
      // Store the subfolder's token and navigate
      sessionStorage.setItem(`folder_token_${subfolderId}`, data.accessToken);
      router.push(`/folders/${subfolderId}?token=${data.accessToken}`);
    } catch (err) {
      console.error('Error opening subfolder:', err);
      setError('Failed to open subfolder. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteSubfolder = async (subfolderId: string) => {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${subfolderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      const data = await response.json();
      
      // Show success message
      const message = `Folder deleted successfully! ${data.deletedFolders} folder(s) and ${data.deletedDocuments} document(s) removed from storage.`;
      setError(message);
      setTimeout(() => setError(null), 5000);

      // Refresh folder data
      if (accessToken) {
        fetchFolderData(accessToken);
      }
    } catch (err) {
      console.error('Delete folder error:', err);
      setError('Failed to delete folder');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateSubfolderSuccess = () => {
    // Refresh folder data after creating a subfolder
    if (accessToken) {
      fetchFolderData(accessToken);
    }
    setIsCreateSubfolderModalOpen(false);
  };

  const handleBreadcrumbClick = async (breadcrumbFolderId: string) => {
    // If clicking on current folder, do nothing
    if (breadcrumbFolderId === folderId) {
      return;
    }

    try {
      // Get token for the target folder
      const response = await fetch(`/api/folders/${breadcrumbFolderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '' }),
      });

      if (!response.ok) {
        throw new Error('Failed to access folder');
      }

      const data = await response.json();
      
      // Store the folder's token and navigate
      sessionStorage.setItem(`folder_token_${breadcrumbFolderId}`, data.accessToken);
      router.push(`/folders/${breadcrumbFolderId}?token=${data.accessToken}`);
    } catch (err) {
      console.error('Error navigating to folder:', err);
      setError('Failed to navigate to folder. Please try again.');
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading folder...</p>
        </div>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-white flex items-center justify-center">
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-white">
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
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary to-primary/80 rounded-full opacity-20 blur-3xl"
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
                className="p-2 rounded-lg bg-white/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all"
              >
                <svg
                  className="h-5 w-5 text-primary"
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
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-sm mb-1 flex-wrap">
                  <button
                    onClick={handleBackToDashboard}
                    className="text-gray-600 hover:text-primary hover:underline transition-colors font-medium"
                  >
                    🏠 Home
                  </button>
                  
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => handleBreadcrumbClick(crumb.id)}
                        disabled={index === breadcrumbs.length - 1}
                        className={`transition-colors ${
                          index === breadcrumbs.length - 1
                            ? 'text-primary font-semibold cursor-default'
                            : 'text-gray-600 hover:text-primary hover:underline font-medium'
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{folder.folderName}</h1>
                {folder.description && (
                  <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
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
                className="p-2 rounded-lg bg-white/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all"
                title="Folder Settings"
              >
                <svg
                  className="h-5 w-5 text-primary"
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
        {/* Unified Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {accessToken && (
            <UnifiedUploadZone
              folderId={folderId}
              accessToken={accessToken}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </motion.div>

        {/* Subfolders Section - Compact List */}
        {(subfolders.length > 0 || folder.level < 5) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">📁 Folders</h2>
              {folder.level < 5 && (
                <Button
                  onClick={() => setIsCreateSubfolderModalOpen(true)}
                  className="text-sm"
                >
                  + Create Subfolder
                </Button>
              )}
            </div>
            
            {subfolders.length === 0 ? (
              <div className="backdrop-blur-md bg-white/90 border border-border/50 rounded-2xl shadow-xl p-6 text-center">
                <p className="text-gray-600 text-sm">No subfolders yet. Create one to organize your documents!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subfolders.map((subfolder, index) => (
                  <motion.div
                    key={subfolder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="group bg-white/90 backdrop-blur-md border border-border/50 rounded-xl shadow-sm hover:shadow-lg p-4 transition-all duration-300 cursor-pointer"
                    onClick={() => handleOpenSubfolder(subfolder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Folder Icon */}
                        <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <svg
                            className="h-6 w-6 text-white"
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
                        </div>

                        {/* Folder Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {subfolder.folderName}
                            </h3>
                            {subfolder.isProtected ? (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                🔒
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                🔓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{subfolder.subfolderCount} {subfolder.subfolderCount === 1 ? 'folder' : 'folders'}</span>
                            <span>•</span>
                            <span>{subfolder.documentCount} {subfolder.documentCount === 1 ? 'file' : 'files'}</span>
                            <span>•</span>
                            <span>{formatSize(subfolder.totalSize)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubfolder(subfolder.id);
                          }}
                          className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubfolder(subfolder.id);
                          }}
                          className="p-2 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Documents List - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Documents</h2>
          
          {documents.length === 0 ? (
            <div className="backdrop-blur-md bg-white/90 border border-border/50 rounded-2xl shadow-xl p-12 text-center">
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
            </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
              className="space-y-2"
          >
              {documents.map((doc, index) => (
                <motion.div
                key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="group bg-white/90 backdrop-blur-md border border-border/50 rounded-xl shadow-sm hover:shadow-lg p-4 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* File Icon */}
                      <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-primary"
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

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {doc.originalName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatSize(doc.size)}</span>
                          <span>•</span>
                          <span>{doc.mimeType}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                        className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                        title="Download"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare(doc.id, doc.originalName)}
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        title="Share"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(doc.id, doc.fileName)}
                        className="p-2 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
            ))}
          </motion.div>
        )}
        </motion.div>
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

      {/* Share Document Modal */}
      {selectedDocument && accessToken && (
        <ShareDocumentModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedDocument(null);
          }}
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          folderId={folderId}
          accessToken={accessToken}
        />
      )}

      {/* Create Subfolder Modal */}
      <CreateFolderModal
        isOpen={isCreateSubfolderModalOpen}
        onClose={() => setIsCreateSubfolderModalOpen(false)}
        onSuccess={handleCreateSubfolderSuccess}
        parentId={folderId}
      />
    </div>
  );
}
