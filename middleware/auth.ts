import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAuthenticated, generateFolderAccessToken } from '@/lib/auth';

/**
 * Middleware to check if user is authenticated
 * Use this in API routes that require authentication
 * Returns user data if authenticated, or error response if not
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | { userId: string; username: string; email: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
  };
}

// Re-export generateFolderAccessToken for convenience
export { generateFolderAccessToken };

/**
 * Get authenticated user or return error response
 * Use this in API routes to get the current user
 */
export async function getAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Helper to create error responses
 */
export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Helper to create success responses
 */
export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
