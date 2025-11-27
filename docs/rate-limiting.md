# Rate Limiting Configuration Guide

This guide documents the rate limiting implementation in AI Gurus LMS, which protects against DoS attacks and brute-force attempts.

## Overview

The application uses [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) with serverless Redis to enforce rate limits. The implementation provides three levels of protection:

| Type | Limit | Window | Purpose |
|------|-------|--------|---------|
| Per-IP | 100 requests | 1 minute | Global DoS protection |
| Per-User | 200 requests | 1 minute | Authenticated user quota |
| Login | 5 attempts | 15 minutes | Brute-force prevention |

## Prerequisites

### 1. Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com)
2. Sign up for a free account
3. Create a new Redis database (Free tier: 10K commands/day)
4. Copy the REST URL and Token from the dashboard

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```bash
# Required
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Optional (defaults shown)
RATE_LIMIT_IP_MAX="100"      # Per-IP limit (requests/minute)
RATE_LIMIT_USER_MAX="200"    # Per-user limit (requests/minute)
RATE_LIMIT_LOGIN_MAX="5"     # Login attempts per 15 minutes
```

## Architecture

### Global Middleware (IP-based)

The middleware (`/src/middleware.ts`) applies to all `/api/*` routes:

```typescript
// Automatically applied to all API routes
export const config = {
  matcher: ['/api/:path*'],
}
```

Features:
- Extracts client IP from request headers (handles Vercel, Cloudflare, proxies)
- Uses sliding window algorithm (prevents burst exploitation)
- Returns HTTP 429 with `Retry-After` header on limit exceeded
- Fail-open behavior: allows requests if Redis unavailable

### User Rate Limiting (Per-User)

Apply user rate limiting in API routes after authentication:

```typescript
import { getServerSession } from 'next-auth'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  // 1. Authenticate user
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Apply user rate limiting
  const rateLimitResponse = await applyUserRateLimit(
    session.user.id,
    '/api/your-endpoint'
  )
  if (rateLimitResponse) return rateLimitResponse

  // 3. Continue with business logic
  // ...
}
```

### Login Rate Limiting

Login rate limiting is automatically applied via NextAuth's authorize callback:

- Triggered on every login attempt
- Uses email address as identifier
- After 5 failed attempts: 15-minute lockout
- Error message: "Too many failed login attempts. Please try again in 15 minutes."

## Rate Limit Responses

When rate limit is exceeded, the API returns:

**Status Code:** `429 Too Many Requests`

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-25T12:00:00.000Z
Retry-After: 45
```

**Body:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-11-25T12:00:00.000Z",
      "retryAfter": 45
    }
  }
}
```

## Customizing Rate Limits

### Via Environment Variables

```bash
# Increase per-IP limit for high-traffic scenarios
RATE_LIMIT_IP_MAX="200"

# Decrease login attempts for stricter security
RATE_LIMIT_LOGIN_MAX="3"
```

### Programmatically

For custom rate limiters, use the utility functions:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const customLimiter = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(50, '30 s'), // 50 requests per 30 seconds
  analytics: true,
  prefix: 'ratelimit:custom',
})
```

## Monitoring

### Application Logs

Rate limit violations are logged with structured format:

```json
{
  "level": "warn",
  "message": "Rate limit exceeded",
  "timestamp": "2025-11-25T12:00:00.000Z",
  "context": {
    "type": "ip",
    "identifier": "192.168.1.1",
    "endpoint": "/api/student/courses",
    "limit": 100,
    "remaining": 0,
    "resetAt": "2025-11-25T12:01:00.000Z"
  }
}
```

### Upstash Analytics Dashboard

1. Go to [Upstash Console](https://console.upstash.com)
2. Select your Redis database
3. Navigate to "Analytics" tab
4. View rate limit statistics:
   - Requests allowed vs. blocked
   - Top rate-limited IPs/users
   - Geographic distribution

## Troubleshooting

### "Rate limit exceeded" false positives

**Symptom:** Legitimate users getting blocked

**Common Causes:**
1. **Shared IP addresses** (corporate VPN, school networks)
   - Solution: Users should authenticate to get higher per-user limits
   - Future: IP whitelisting for known corporate ranges

2. **Aggressive client-side polling**
   - Solution: Reduce polling frequency in client code
   - Add exponential backoff to retry logic

3. **Multiple browser tabs**
   - Solution: Implement request deduplication in client

### Redis connection failures

**Symptom:** `Rate limit check failed` errors in logs

**Causes:**
1. Invalid Upstash credentials
2. Upstash service outage
3. Network connectivity issues

**Behavior:** Fail-open (requests allowed when Redis unavailable)

**Resolution:**
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Check [Upstash Status](https://status.upstash.com/)
3. Test connection: `curl $UPSTASH_REDIS_REST_URL/ping`

### Upstash free tier exceeded

**Symptom:** Redis commands failing after 10K/day

**Resolution:**
1. Upgrade to Pay-as-you-go plan (~$0.20/100K commands)
2. Reduce rate limit check frequency
3. Implement local caching for repeated requests

### Rate limits not enforced

**Symptom:** More requests allowed than configured limit

**Causes:**
1. Middleware not matching API routes
2. Environment variables not loaded
3. Redis key prefix collision

**Resolution:**
1. Verify middleware matcher configuration
2. Check `.env.local` is properly loaded
3. Review Redis keys in Upstash console

## Development Mode

Rate limiting can be disabled for local development:

1. Remove Upstash credentials from `.env.local`
2. Rate limiting functions return `null`, allowing all requests
3. Add explicit bypass in middleware for development

## Security Considerations

### Credentials

- **Never commit** `UPSTASH_REDIS_REST_TOKEN` to git
- Use Vercel environment variables for production
- Rotate tokens if accidentally exposed

### IP Spoofing

The middleware extracts IP from trusted headers in order:
1. `request.ip` (Vercel)
2. `x-forwarded-for` (proxies)
3. `cf-connecting-ip` (Cloudflare)
4. `x-real-ip` (nginx)

Ensure your proxy configuration sets these headers correctly.

### Fail-Open Trade-off

The implementation uses fail-open behavior:
- **Pro:** Service remains available if Redis fails
- **Con:** Brief vulnerability window without rate limiting

For critical endpoints, consider fail-closed behavior with fallback to degraded mode.

## API Reference

### Rate Limit Utilities (`/src/lib/rate-limit.ts`)

```typescript
// Check IP rate limit
checkIpRateLimit(ip: string): Promise<RateLimitResult | null>

// Check user rate limit
checkUserRateLimit(userId: string): Promise<RateLimitResult | null>

// Check login rate limit
checkLoginRateLimit(email: string): Promise<RateLimitResult | null>

// Apply user rate limiting (returns NextResponse if limited)
applyUserRateLimit(userId: string, endpoint: string): Promise<NextResponse | null>

// Apply login rate limiting (returns NextResponse if limited)
applyLoginRateLimit(email: string, endpoint: string): Promise<NextResponse | null>

// Create rate limit response
createRateLimitResponse(result: RateLimitResult, message?: string): NextResponse

// Log rate limit violation
logRateLimitViolation(type: RateLimitType, identifier: string, endpoint: string, result: RateLimitResult): void
```

## Related Documentation

- [Architecture: Security](./architecture.md#Security-Architecture)
- [Upstash Rate Limit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
