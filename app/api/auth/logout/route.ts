import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Destroy the session
    await destroySession();

    return createSuccessResponse({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse(
      'An error occurred during logout. Please try again.',
      500
    );
  }
}
