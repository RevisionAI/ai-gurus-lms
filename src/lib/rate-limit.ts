/**
 * Rate Limiting Utilities
 *
 * Provides rate limiting functionality using Upstash Redis for serverless
 * environments. Implements per-IP, per-user, and login rate limiting.
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Upstash authentication token
 * - RATE_LIMIT_IP_MAX: Per-IP limit (requests/minute, default: 100)
 * - RATE_LIMIT_USER_MAX: Per-user limit (requests/minute, default: 200)
 * - RATE_LIMIT_LOGIN_MAX: Login attempts per 15 minutes (default: 5)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// ============================================
// Types
// ============================================

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface RateLimitError {
  code: 'RATE_LIMIT_EXCEEDED'
  message: string
  details: {
    limit: number
    remaining: number
    resetAt: string
    retryAfter: number
  }
}

export type RateLimitType = 'ip' | 'user' | 'login'

// ============================================
// Configuration
// ============================================

const RATE_LIMIT_IP_MAX = parseInt(process.env.RATE_LIMIT_IP_MAX || '100', 10)
const RATE_LIMIT_USER_MAX = parseInt(process.env.RATE_LIMIT_USER_MAX || '200', 10)
const RATE_LIMIT_LOGIN_MAX = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10)

// ============================================
// Redis Client
// ============================================

let redis: Redis | null = null

/**
 * Get the Redis client instance (lazy initialization)
 * Returns null if Upstash credentials are not configured
 */
function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Return null if credentials not configured (allows development without Upstash)
  if (!url || !token) {
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// ============================================
// Rate Limiters
// ============================================

let ipRateLimitInstance: Ratelimit | null = null
let userRateLimitInstance: Ratelimit | null = null
let loginRateLimitInstance: Ratelimit | null = null

/**
 * Per-IP rate limit: 100 requests/minute (configurable)
 * Used for global API protection against DoS attacks
 */
export function getIpRateLimit(): Ratelimit | null {
  const client = getRedisClient()
  if (!client) return null

  if (!ipRateLimitInstance) {
    ipRateLimitInstance = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_IP_MAX, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  }

  return ipRateLimitInstance
}

/**
 * Per-user rate limit: 200 requests/minute (configurable)
 * Higher limit for authenticated legitimate users
 */
export function getUserRateLimit(): Ratelimit | null {
  const client = getRedisClient()
  if (!client) return null

  if (!userRateLimitInstance) {
    userRateLimitInstance = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_USER_MAX, '1 m'),
      analytics: true,
      prefix: 'ratelimit:user',
    })
  }

  return userRateLimitInstance
}

/**
 * Login rate limit: 5 attempts per 15 minutes (configurable)
 * Prevents brute-force password attacks
 */
export function getLoginRateLimit(): Ratelimit | null {
  const client = getRedisClient()
  if (!client) return null

  if (!loginRateLimitInstance) {
    loginRateLimitInstance = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_LOGIN_MAX, '15 m'),
      analytics: true,
      prefix: 'ratelimit:login',
    })
  }

  return loginRateLimitInstance
}

// ============================================
// Helper Functions
// ============================================

/**
 * Log a rate limit violation with structured context
 */
export function logRateLimitViolation(
  type: RateLimitType,
  identifier: string,
  endpoint: string,
  result: RateLimitResult
): void {
  const logEntry = {
    level: 'warn',
    message: 'Rate limit exceeded',
    timestamp: new Date().toISOString(),
    context: {
      type,
      identifier: type === 'login' ? hashIdentifier(identifier) : identifier,
      endpoint,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: new Date(result.reset).toISOString(),
    },
  }

  console.warn(JSON.stringify(logEntry))
}

/**
 * Hash sensitive identifiers (like email) for logging
 */
function hashIdentifier(identifier: string): string {
  // Simple masking for logs (first 3 chars + ***)
  if (identifier.length <= 3) return '***'
  return `${identifier.substring(0, 3)}***`
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    'Retry-After': retryAfter.toString(),
  }
}

/**
 * Create rate limit error response body
 */
export function createRateLimitError(
  result: RateLimitResult,
  message?: string
): { error: RateLimitError } {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))

  return {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: message || 'Too many requests. Please try again later.',
      details: {
        limit: result.limit,
        remaining: result.remaining,
        resetAt: new Date(result.reset).toISOString(),
        retryAfter,
      },
    },
  }
}

/**
 * Create a NextResponse for rate limit exceeded
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message?: string
): NextResponse {
  return NextResponse.json(createRateLimitError(result, message), {
    status: 429,
    headers: createRateLimitHeaders(result),
  })
}

// ============================================
// Rate Limit Check Functions
// ============================================

/**
 * Check IP-based rate limit
 *
 * @param ip - Client IP address
 * @returns Rate limit result or null if rate limiting disabled
 */
export async function checkIpRateLimit(
  ip: string
): Promise<RateLimitResult | null> {
  const limiter = getIpRateLimit()
  if (!limiter) return null

  try {
    const result = await limiter.limit(ip)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // Fail-open: Allow request if Redis unavailable
    console.error('IP rate limit check failed:', error)
    return null
  }
}

/**
 * Check user-based rate limit
 *
 * @param userId - Authenticated user ID
 * @returns Rate limit result or null if rate limiting disabled
 */
export async function checkUserRateLimit(
  userId: string
): Promise<RateLimitResult | null> {
  const limiter = getUserRateLimit()
  if (!limiter) return null

  try {
    const result = await limiter.limit(userId)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // Fail-open: Allow request if Redis unavailable
    console.error('User rate limit check failed:', error)
    return null
  }
}

/**
 * Check login rate limit
 *
 * @param email - User email (used as identifier)
 * @returns Rate limit result or null if rate limiting disabled
 */
export async function checkLoginRateLimit(
  email: string
): Promise<RateLimitResult | null> {
  const limiter = getLoginRateLimit()
  if (!limiter) return null

  try {
    const result = await limiter.limit(email.toLowerCase())
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // Fail-open: Allow request if Redis unavailable
    console.error('Login rate limit check failed:', error)
    return null
  }
}

// ============================================
// API Route Helper
// ============================================

/**
 * Apply user rate limiting in an API route
 *
 * Usage in API routes:
 * ```typescript
 * const session = await getServerSession(authOptions);
 * if (session) {
 *   const rateLimitResponse = await applyUserRateLimit(session.user.id, '/api/endpoint');
 *   if (rateLimitResponse) return rateLimitResponse;
 * }
 * ```
 *
 * @param userId - Authenticated user ID
 * @param endpoint - API endpoint path (for logging)
 * @returns NextResponse if rate limited, null if allowed
 */
export async function applyUserRateLimit(
  userId: string,
  endpoint: string
): Promise<NextResponse | null> {
  const result = await checkUserRateLimit(userId)

  // Rate limiting disabled or Redis unavailable
  if (!result) return null

  // Rate limit exceeded
  if (!result.success) {
    logRateLimitViolation('user', userId, endpoint, result)
    return createRateLimitResponse(result)
  }

  return null
}

/**
 * Apply login rate limiting
 *
 * Usage in login handlers:
 * ```typescript
 * const rateLimitResponse = await applyLoginRateLimit(email, '/api/auth/login');
 * if (rateLimitResponse) return rateLimitResponse;
 * ```
 *
 * @param email - User email
 * @param endpoint - API endpoint path (for logging)
 * @returns NextResponse if rate limited, null if allowed
 */
export async function applyLoginRateLimit(
  email: string,
  endpoint: string
): Promise<NextResponse | null> {
  const result = await checkLoginRateLimit(email)

  // Rate limiting disabled or Redis unavailable
  if (!result) return null

  // Rate limit exceeded
  if (!result.success) {
    logRateLimitViolation('login', email, endpoint, result)
    return createRateLimitResponse(
      result,
      'Too many failed login attempts. Please try again in 15 minutes.'
    )
  }

  return null
}

// ============================================
// Exports for Testing
// ============================================

export const __test__ = {
  RATE_LIMIT_IP_MAX,
  RATE_LIMIT_USER_MAX,
  RATE_LIMIT_LOGIN_MAX,
  hashIdentifier,
}
