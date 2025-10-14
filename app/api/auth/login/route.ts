import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validation';
import { createSession } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/middleware/rateLimit';
import { createErrorResponse, createSuccessResponse } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: errors,
          details: errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check rate limit (by email to prevent brute force on specific accounts)
    const rateLimit = checkRateLimit(`login:${email}`, RATE_LIMITS.login);
    if (!rateLimit.success) {
      return createErrorResponse(
        `Too many login attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
        429
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });

    // Generic error message to prevent user enumeration
    if (!user) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return createErrorResponse('Account is inactive. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    await createSession(String(user._id), user.username, user.email);

    // Return success response
    return createSuccessResponse({
      message: 'Login successful',
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(
      'An error occurred during login. Please try again.',
      500
    );
  }
}
