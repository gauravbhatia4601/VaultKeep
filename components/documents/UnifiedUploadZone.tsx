'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface UnifiedUploadZoneProps {
  folderId: string;
  accessToken: string;
  onUploadSuccess: () => void;
}

interface FileWithPath extends File {
  webkitRelativePath: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UnifiedUploadZone({
  folderId,
  accessToken,
  onUploadSuccess,
}: UnifiedUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadType, setUploadType] = useState<'files' | 'folder' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect if upload is folder or files based on webkitRelativePath
  const detectUploadType = (files: FileWithPath[]): 'files' | 'folder' => {
    // If any file has a webkitRelativePath, it's a folder upload
    return files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/')) 
      ? 'folder' 
      : 'files';
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files) as FileWithPath[];
    
    if (fileArray.length === 0) return;

    // Filter out hidden files and folders (starts with .)
    const filteredFiles = fileArray.filter(file => {
      const path = file.webkitRelativePath || file.name;
      const pathParts = path.split('/');
      // Check if any part of the path starts with .
      return !pathParts.some(part => part.startsWith('.') && part.length > 1);
    });

    if (filteredFiles.length === 0) {
      setError('No valid files to upload. Hidden files (starting with .) are skipped.');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Auto-detect upload type
    const detectedType = detectUploadType(filteredFiles);
    setUploadType(detectedType);

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = filteredFiles.map(file => ({
      fileName: file.webkitRelativePath || file.name,
      progress: 0,
      status: 'pending',
    }));
    setUploadProgress(initialProgress);

    try {
      if (detectedType === 'folder') {
        await handleFolderUpload(filteredFiles);
      } else {
        await handleFileUpload(filteredFiles);
      }

      onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (files: FileWithPath[]) => {
    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update status to uploading
      setUploadProgress(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'uploading' } : p
      ));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('accessToken', accessToken); // Add token to FormData

        // For single files, always use the current folder and its token
        const response = await fetch(`/api/folders/${folderId}/documents`, {
          method: 'POST',
          body: formData, // Don't set Authorization header, token is in FormData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Upload failed for ${file.name}:`, errorData);
          throw new Error(`Failed to upload ${file.name}`);
        }

        completedCount++;
        
        // Update progress
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 100, status: 'completed' } : p
        ));
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i 
            ? { 
                ...p, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } 
            : p
        ));
      }
    }

    if (completedCount < files.length) {
      setError(`Uploaded ${completedCount} of ${files.length} files. Some files failed.`);
    }
  };

  const handleFolderUpload = async (files: FileWithPath[]) => {
    // Group files by their directory structure
    const filesByPath = new Map<string, FileWithPath[]>();
    
    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const pathParts = relativePath.split('/');
      
      // Get the full directory path (excluding the filename)
      // This includes the root folder name (X in X/Y/file.txt)
      const directoryPath = pathParts.slice(0, -1).join('/');
      
      if (!filesByPath.has(directoryPath)) {
        filesByPath.set(directoryPath, []);
      }
      filesByPath.get(directoryPath)!.push(file);
    }

    // Create nested folder structure and upload files
    let completedCount = 0;
    const createdFolders = new Map<string, string>(); // path -> folderId
    const folderTokens = new Map<string, string>(); // folderId -> accessToken
    
    createdFolders.set('', folderId); // Root is the current folder
    folderTokens.set(folderId, accessToken); // Store the current folder's token

    for (const [dirPath, dirFiles] of filesByPath) {
      try {
        // Create nested folders for this path
        let currentPath = '';
        let currentParentId = folderId;

        if (dirPath) {
          const pathParts = dirPath.split('/').filter(Boolean);
          
          for (const folderName of pathParts) {
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            
            if (!createdFolders.has(newPath)) {
              // Create this folder
              const createResponse = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  folderName,
                  parentId: currentParentId,
                  description: `Auto-created from folder upload`,
                }),
              });

              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                console.error(`Failed to create folder ${folderName}:`, errorData);
                throw new Error(`Failed to create folder: ${folderName}`);
              }

              const createData = await createResponse.json();
              const newFolderId = createData.folder.id;
              createdFolders.set(newPath, newFolderId);
              currentParentId = newFolderId;
              
              // Get access token for the newly created folder
              const verifyResponse = await fetch(`/api/folders/${newFolderId}/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: '' }),
              });

              if (!verifyResponse.ok) {
                console.error(`Failed to get token for folder ${folderName}`);
                throw new Error(`Failed to get access token for folder: ${folderName}`);
              }

              const verifyData = await verifyResponse.json();
              folderTokens.set(newFolderId, verifyData.accessToken);
              
              console.log(`Created folder: ${newPath} with ID: ${currentParentId}`);
            } else {
              // Folder already exists, use its ID
              currentParentId = createdFolders.get(newPath)!;
              console.log(`Using existing folder: ${newPath} with ID: ${currentParentId}`);
            }
            
            currentPath = newPath;
          }
        }

        // Get the token for the target folder
        const targetToken = folderTokens.get(currentParentId);
        if (!targetToken) {
          console.error(`No token found for folder ID: ${currentParentId}`);
          throw new Error(`Missing access token for folder`);
        }

        console.log(`Uploading ${dirFiles.length} files to folder ID: ${currentParentId}`);

        // Upload files to the target folder
        for (const file of dirFiles) {
          const fileIndex = files.indexOf(file);
          
          // Update status to uploading
          setUploadProgress(prev => prev.map((p, i) => 
            i === fileIndex ? { ...p, status: 'uploading' } : p
          ));

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('accessToken', targetToken); // Add token to FormData

            const uploadResponse = await fetch(`/api/folders/${currentParentId}/documents`, {
              method: 'POST',
              body: formData, // Don't set Authorization header, token is in FormData
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            completedCount++;
            
            // Update progress
            setUploadProgress(prev => prev.map((p, i) => 
              i === fileIndex 
                ? { ...p, progress: 100, status: 'completed' } 
                : p
            ));
          } catch (fileError) {
            console.error(`Error uploading ${file.name}:`, fileError);
            setUploadProgress(prev => prev.map((p, i) => 
              i === fileIndex 
                ? { 
                    ...p, 
                    status: 'error', 
                    error: fileError instanceof Error ? fileError.message : 'Upload failed' 
                  } 
                : p
            ));
          }
        }
      } catch (dirError) {
        console.error(`Error processing directory ${dirPath}:`, dirError);
      }
    }

    if (completedCount < files.length) {
      setError(`Uploaded ${completedCount} of ${files.length} files. Some files failed.`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    // Process dropped items
    items.forEach(item => {
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    });

    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = '';
  };

  const completedFiles = uploadProgress.filter(p => p.status === 'completed').length;
  const totalFiles = uploadProgress.length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-white/90 border border-border/50 rounded-2xl shadow-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Upload Files or Folders</h3>
            <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        /* @ts-expect-error - webkitdirectory is not in standard types */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />

      {/* Drop zone or upload buttons */}
      {!isUploading && uploadProgress.length === 0 && (
        <>
          <motion.div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-primary bg-muted/30'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <svg
              className="h-12 w-12 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-700 font-medium mb-2">
              {isDragging ? 'Drop your files or folders here' : 'Drag & drop files or folders here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="secondary"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Select Files
              </Button>
              
              <Button
                onClick={() => folderInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Select Folder
              </Button>
            </div>
          </motion.div>

          {/* Info box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Smart Upload:</strong> Automatically detects if you&apos;re uploading files or folders. 
              Folder structure will be preserved automatically! Hidden files (.DS_Store, .git, etc.) are automatically skipped.
            </p>
          </div>
        </>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
              {uploadType === 'folder' ? (
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Uploading {uploadType === 'folder' ? 'Folder' : 'Files'}
              </p>
              <p className="text-xs text-gray-600">
                {uploadType === 'folder' && 'Creating folder structure and uploading files...'}
                {uploadType === 'files' && 'Uploading files to current folder...'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                Progress: {completedFiles} / {totalFiles} files
              </span>
              <span className="text-primary font-medium">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Individual file progress (show only last 5) */}
          <div className="max-h-40 overflow-y-auto space-y-2">
            {uploadProgress.slice(-5).map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {file.status === 'completed' && (
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {file.status === 'uploading' && (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                {file.status === 'error' && (
                  <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="truncate text-gray-600">{file.fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion summary */}
      {!isUploading && uploadProgress.length > 0 && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">Upload Complete!</p>
                <p className="text-sm text-green-700 mt-1">
                  {uploadType === 'folder' 
                    ? `Successfully uploaded ${completedFiles} files with folder structure preserved`
                    : `Successfully uploaded ${completedFiles} file${completedFiles > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setUploadProgress([]);
              setError(null);
              setUploadType(null);
            }}
            variant="secondary"
            className="w-full"
          >
            Upload More
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <svg
            className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Upload Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

