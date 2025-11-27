/**
 * Global Rate Limiting Middleware
 *
 * Applies per-IP rate limiting to all API routes.
 * Protects against DoS attacks from unauthenticated sources.
 *
 * Rate Limit: 100 requests/minute per IP (configurable via RATE_LIMIT_IP_MAX)
 *
 * Fail-Open Behavior: If Redis is unavailable, requests are allowed to prevent
 * complete service outage. Rate limit failures are logged for monitoring.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================
// Configuration
// ============================================

const RATE_LIMIT_IP_MAX = parseInt(process.env.RATE_LIMIT_IP_MAX || '100', 10)

// ============================================
// Rate Limiter (Edge-compatible initialization)
// ============================================

// Note: We initialize Redis/Ratelimit directly here because middleware
// runs on the Edge runtime which has different module resolution.
// The @/lib/rate-limit.ts utilities are for use in API routes (Node runtime).

let ratelimit: Ratelimit | null = null

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Rate limiting disabled if credentials not configured
  if (!url || !token) {
    return null
  }

  try {
    const redis = new Redis({ url, token })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_IP_MAX, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
    return ratelimit
  } catch (error) {
    console.error('Failed to initialize rate limiter:', error)
    return null
  }
}

// ============================================
// IP Address Extraction
// ============================================

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
function getClientIp(request: NextRequest): string {
  // Vercel provides the IP directly
  if (request.ip) {
    return request.ip
  }

  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, first one is the client
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Real IP header (nginx, other proxies)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for local development
  return '127.0.0.1'
}

// ============================================
// Middleware Handler
// ============================================

export async function middleware(request: NextRequest) {
  const limiter = getRateLimiter()

  // Rate limiting disabled - allow all requests
  if (!limiter) {
    return NextResponse.next()
  }

  const ip = getClientIp(request)

  try {
    const { success, limit, reset, remaining } = await limiter.limit(ip)

    if (!success) {
      // Log rate limit violation
      console.warn(
        JSON.stringify({
          level: 'warn',
          message: 'Rate limit exceeded',
          timestamp: new Date().toISOString(),
          context: {
            type: 'ip',
            identifier: ip,
            endpoint: request.nextUrl.pathname,
            limit,
            remaining,
            resetAt: new Date(reset).toISOString(),
          },
        })
      )

      // Calculate retry-after in seconds
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              limit,
              remaining,
              resetAt: new Date(reset).toISOString(),
              retryAfter,
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Rate limit passed - add headers to response for transparency
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())

    return response
  } catch (error) {
    // Fail-open: Allow request if Redis unavailable to prevent service outage
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Rate limit check failed, allowing request (fail-open)',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: request.nextUrl.pathname,
        ip,
      })
    )

    return NextResponse.next()
  }
}

// ============================================
// Middleware Configuration
// ============================================

export const config = {
  // Apply rate limiting to all API routes
  // Excludes: static assets, _next internal routes, favicon
  matcher: [
    '/api/:path*',
    // Exclude these patterns from rate limiting:
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
