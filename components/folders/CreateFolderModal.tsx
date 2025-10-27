'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId?: string;  // Optional parent folder ID for creating subfolders
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onSuccess,
  parentId,
}: CreateFolderModalProps) {
  const [formData, setFormData] = useState({
    folderName: '',
    pin: '',
    confirmPin: '',
    description: '',
  });
  const [isProtected, setIsProtected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Build submit data
      const submitData: {
        folderName: string;
        description?: string;
        pin?: string;
        confirmPin?: string;
        parentId?: string;
      } = {
        folderName: formData.folderName,
        description: formData.description,
      };

      // Only include pin fields if folder is protected (and not a subfolder)
      if (isProtected && !parentId) {
        submitData.pin = formData.pin;
        submitData.confirmPin = formData.confirmPin;
      }

      // Include parentId if creating a subfolder
      if (parentId) {
        submitData.parentId = parentId;
      }

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setErrors({ general: 'Server returned an invalid response. Please try again.' });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          // Handle validation errors
          const newErrors: Record<string, string> = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            newErrors[detail.field] = detail.message;
          });
          setErrors(newErrors);
        } else if (data.error) {
          setErrors({ general: data.error });
        } else {
          setErrors({ general: 'Failed to create folder. Please try again.' });
        }
        setIsLoading(false);
        return;
      }

      // Success
      setFormData({
        folderName: '',
        pin: '',
        confirmPin: '',
        description: '',
      });
      setIsProtected(false);
      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (error) {
      // Only catch actual network errors
      console.error('Network error creating folder:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        folderName: '',
        pin: '',
        confirmPin: '',
        description: '',
      });
      setIsProtected(false);
      setErrors({});
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="backdrop-blur-md bg-white/95 border border-border/50 rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="h-10 w-10 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"
                  >
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {parentId ? 'Create Subfolder' : 'Create Folder'}
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-red-50 border border-red-300 flex items-start gap-3"
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
                      <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                      <p className="text-sm text-red-700">{errors.general}</p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label
                    htmlFor="folderName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Folder Name *
                  </label>
                  <Input
                    id="folderName"
                    name="folderName"
                    type="text"
                    placeholder="My Documents"
                    value={formData.folderName}
                    onChange={handleChange}
                    error={errors.folderName}
                    disabled={isLoading}
                    required
                  />
                  {!errors.folderName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Use letters, numbers, spaces, hyphens, or underscores
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of folder contents..."
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isLoading}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 border rounded-lg shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary border-border/50 bg-white/80 hover:border-border resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Protection Toggle - Only show for root folders */}
                {!parentId && (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id="isProtected"
                      checked={isProtected}
                      onChange={(e) => setIsProtected(e.target.checked)}
                      disabled={isLoading}
                      className="h-5 w-5 text-primary focus:ring-ring border-border rounded cursor-pointer"
                    />
                    <label
                      htmlFor="isProtected"
                      className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      🔒 Protect this folder with a PIN
                    </label>
                  </div>
                )}

                {/* Info message for subfolders */}
                {parentId && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      Subfolders inherit the protection of their parent folder. No separate PIN is needed.
                    </p>
                  </div>
                )}

                {/* PIN Fields - Only show if protected */}
                {isProtected && (
                  <>
                    <div>
                      <label
                        htmlFor="pin"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Folder PIN *
                      </label>
                      <Input
                        id="pin"
                        name="pin"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="4-6 digit PIN"
                        maxLength={6}
                        value={formData.pin}
                        onChange={handleChange}
                        error={errors.pin}
                        disabled={isLoading}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a 4-6 digit numeric PIN to protect your folder
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPin"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confirm PIN *
                      </label>
                      <Input
                        id="confirmPin"
                        name="confirmPin"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Re-enter PIN"
                        maxLength={6}
                        value={formData.confirmPin}
                        onChange={handleChange}
                        error={errors.confirmPin}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="flex-1 bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20"
                  >
                    {isLoading ? 'Creating...' : (parentId ? 'Create Subfolder' : 'Create Folder')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
