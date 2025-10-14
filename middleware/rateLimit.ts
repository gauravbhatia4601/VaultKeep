// Simple in-memory rate limiter
// For production, use Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  max: number; // Maximum number of requests
  window: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier for the client (e.g., IP, userId, email)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or entry expired
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.window;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetTime,
    };
  }

  // Entry exists and not expired
  if (entry.count >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for an identifier
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get rate limit info without incrementing
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 */
export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      resetTime: now + config.window,
    };
  }

  return {
    success: entry.count < config.max,
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetTime: entry.resetTime,
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  login: {
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
    window: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '900000'), // 15 minutes
  },
  folderPassword: {
    max: parseInt(process.env.RATE_LIMIT_FOLDER_PASSWORD_MAX || '3'),
    window: parseInt(process.env.RATE_LIMIT_FOLDER_PASSWORD_WINDOW || '300000'), // 5 minutes
  },
  register: {
    max: 3,
    window: 60 * 60 * 1000, // 1 hour
  },
  api: {
    max: 100,
    window: 60 * 1000, // 1 minute
  },
};
