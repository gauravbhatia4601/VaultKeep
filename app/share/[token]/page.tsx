import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    await connectDB();

    // Find document by share token
    const document = await Document.findOne({ shareToken: token });

    if (!document) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-white to-background">
          <div className="text-center max-w-md p-8">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Document Not Found
            </h1>
            <p className="text-gray-600">
              This shared link is invalid or has expired.
            </p>
          </div>
        </div>
      );
    }

    // Check if share link has expired
    if (document.shareExpiresAt && document.shareExpiresAt < new Date()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-white to-background">
          <div className="text-center max-w-md p-8">
            <div className="mb-6">
              <svg
                className="h-16 w-16 text-orange-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
            <p className="text-gray-600">
              This shared link has expired. Please request a new link from the document owner.
            </p>
          </div>
        </div>
      );
    }

    // Update last accessed time
    document.lastAccessedAt = new Date();
    await document.save();

    // Return file download page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-white to-background p-4">
        <div className="max-w-md w-full backdrop-blur-md bg-white/90 border border-border/50 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Shared Document
            </h1>
            <p className="text-gray-600 mb-6 break-all">{document.originalName}</p>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">File Type:</span>
                <span className="font-semibold text-gray-900">
                  {document.mimeType.split('/')[1]?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">File Size:</span>
                <span className="font-semibold text-gray-900">
                  {(document.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>

            <a
              href={`/api/share/${token}/download`}
              download={document.originalName}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all duration-300 w-full"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download File
            </a>

            <p className="text-xs text-gray-500 mt-4">
              Secured by VaultKeep
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Shared document error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-white to-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">
            An error occurred while loading the shared document.
          </p>
        </div>
      </div>
    );
  }
}
