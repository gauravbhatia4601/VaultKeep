'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import FolderCard from '@/components/folders/FolderCard';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import FolderPasswordModal from '@/components/folders/FolderPasswordModal';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface Folder {
  id: string;
  folderName: string;
  description?: string;
  documentCount: number;
  totalSize: number;
  createdAt: string;
  lastAccessedAt?: string;
}

interface DashboardClientProps {
  user: User;
  handleLogout: () => Promise<void>;
}

export default function DashboardClient({ user, handleLogout }: DashboardClientProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders on component mount
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/folders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch folders');
      }

      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (folder) {
      setSelectedFolder({ id: folder.id, name: folder.folderName });
      setIsPasswordModalOpen(true);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete folder');
      }

      // Remove folder from state
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleModalSuccess = () => {
    fetchFolders();
  };

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
        {/* Layer 1 */}
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

        {/* Layer 2 */}
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
          animate={{
            rotateX: [0, -1, 0],
            rotateY: [0, -1, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-purple-300 to-purple-200 rounded-full opacity-25 blur-3xl"
            style={{ transform: "translateZ(-50px)" }}
            animate={{
              y: [0, -35, 0],
              x: [0, -25, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Floating particles */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-2 h-2 bg-purple-400 rounded-full"
          animate={{
            y: [0, -100, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3"
          >
            <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VaultKeep</h1>
              <p className="text-sm text-purple-600">Welcome back, {user.username}!</p>
            </div>
          </motion.div>
          <form action={handleLogout}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="bg-white/90 backdrop-blur-md border border-purple-200/50 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
              >
                Logout
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Document Vault
            </h2>
            <p className="text-gray-600">
              {folders.length === 0
                ? 'Create your first folder to get started'
                : `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'} in your vault`}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/50 flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Folder
            </Button>
          </motion.div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="backdrop-blur-md bg-white/90 border border-purple-200/50 rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-14 w-14 bg-purple-200 rounded-xl mb-4" />
                <div className="h-6 bg-purple-200 rounded mb-2" />
                <div className="h-4 bg-purple-100 rounded mb-4" />
                <div className="h-4 bg-purple-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && folders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-md bg-white/90 border border-purple-200/50 rounded-2xl shadow-2xl p-12"
          >
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="mx-auto mb-8 inline-block"
              >
                <motion.div
                  whileHover={{ y: -8, rotateX: 10 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="h-24 w-24 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <svg
                    className="h-12 w-12 text-white"
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
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No folders yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first password-protected folder to start organizing your documents
              </p>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-2xl shadow-purple-500/50"
                >
                  Create Your First Folder
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Folders Grid */}
        {!isLoading && folders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {folders.map((folder, index) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <FolderCard
                  {...folder}
                  onOpen={handleOpenFolder}
                  onDelete={handleDeleteFolder}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 p-8 backdrop-blur-md bg-white/90 border border-purple-200/50 rounded-xl shadow-lg"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account Information
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Username</p>
              <p className="text-gray-900 font-semibold">{user.username}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Email</p>
              <p className="text-gray-900 font-semibold">{user.email}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">User ID</p>
              <p className="text-gray-900 font-semibold text-sm">{user.userId}</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Folder Password Modal */}
      {selectedFolder && (
        <FolderPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedFolder(null);
          }}
          folderId={selectedFolder.id}
          folderName={selectedFolder.name}
        />
      )}
    </div>
  );
}
