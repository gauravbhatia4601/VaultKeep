import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Session data interface
export interface SessionData {
  userId: string;
  username: string;
  email: string;
  isLoggedIn: boolean;
}

// Session configuration
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'family-docs-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

// Validate session secret exists
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long');
}

// Get session from cookies
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Create session for user
export async function createSession(userId: string, username: string, email: string) {
  const session = await getSession();
  session.userId = userId;
  session.username = username;
  session.email = email;
  session.isLoggedIn = true;
  await session.save();
}

// Destroy session
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true && !!session.userId;
}

// Get current user from session
export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return {
    userId: session.userId,
    username: session.username,
    email: session.email,
    isLoggedIn: session.isLoggedIn,
  };
}

// Folder access token interface
interface FolderAccessToken {
  userId: string;
  folderId: string;
  exp: number;
}

// Generate folder access token (JWT)
export function generateFolderAccessToken(
  userId: string,
  folderId: string
): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload: FolderAccessToken = {
    userId,
    folderId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
}

// Verify folder access token
export function verifyFolderAccessToken(
  token: string,
  folderId: string
): { valid: boolean; userId?: string } {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as FolderAccessToken;

    // Check if token is for the correct folder
    if (decoded.folderId !== folderId) {
      return { valid: false };
    }

    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false };
  }
}
