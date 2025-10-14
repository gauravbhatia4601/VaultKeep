import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { registerSchema } from '@/lib/validation';
import { createSession } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/middleware/rateLimit';
import { createErrorResponse, createSuccessResponse } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rateLimit.success) {
      return createErrorResponse(
        `Too many registration attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
        429
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
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

    const { username, email, password } = validationResult.data;

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return createErrorResponse('Email already registered', 409);
      }
      if (existingUser.username === username) {
        return createErrorResponse('Username already taken', 409);
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
    });

    await user.save();

    // Create session
    await createSession(String(user._id), user.username, user.email);

    // Return success response (password excluded by toJSON)
    return createSuccessResponse(
      {
        message: 'Registration successful',
        user: {
          id: String(user._id),
          username: user.username,
          email: user.email,
        },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    return createErrorResponse(
      'An error occurred during registration. Please try again.',
      500
    );
  }
}
