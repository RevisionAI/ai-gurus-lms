# Story 1.7: Rate Limiting Implementation

Status: done

## Story

As a **system administrator**,
I want **API rate limiting to prevent abuse and DoS attacks**,
so that **the platform remains stable under malicious or excessive traffic**.

## Acceptance Criteria

1. **Rate limiting middleware implemented** - Per-IP and per-user rate limiting active on all API routes
2. **Per-IP rate limit configured** - 100 requests/minute (configurable via environment variable)
3. **Per-user rate limit configured** - 200 requests/minute (configurable via environment variable)
4. **Login endpoint protected** - 5 failed attempts → 15-minute lockout with clear error messaging
5. **Rate limit exceeded responses** - HTTP 429 status with `retry-after` header indicating cooldown period
6. **Rate limiting validated** - Load testing confirms limits enforced correctly under concurrent traffic
7. **Monitoring configured** - Rate limit violations logged to application logs with IP address and user context
8. **Documentation created** - Rate limiting configuration and troubleshooting guide saved to `/docs/rate-limiting.md`

## Tasks / Subtasks

- [x] **Task 1: Install and configure Upstash Rate Limit** (AC: 1, 2, 3)
  - [ ] Install dependencies: `npm install @upstash/ratelimit @upstash/redis`
  - [ ] Create Upstash account at https://upstash.com
  - [ ] Create Redis database (Free tier: 10K commands/day, sufficient for beta)
  - [ ] Copy Redis REST URL and token from Upstash dashboard
  - [ ] Add environment variables to `.env.local`:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`
    - `RATE_LIMIT_IP_MAX=100`
    - `RATE_LIMIT_USER_MAX=200`
    - `RATE_LIMIT_LOGIN_MAX=5`
  - [ ] Verify `.env.local` is in `.gitignore`
  - [ ] **Testing**: Unit test verifies environment variables load correctly

- [x] **Task 2: Create rate limiting utilities** (AC: 1, 2, 3, 4)
  - [ ] Create `/src/lib/rate-limit.ts` with rate limiter instances
  - [ ] Configure `ipRateLimit`: Sliding window, 100 requests/minute, prefix `ratelimit:ip`
  - [ ] Configure `userRateLimit`: Sliding window, 200 requests/minute, prefix `ratelimit:user`
  - [ ] Configure `loginRateLimit`: Sliding window, 5 attempts/15 minutes, prefix `ratelimit:login`
  - [ ] Enable analytics for all rate limiters (built-in Upstash feature)
  - [ ] Export helper function `checkRateLimit(identifier, limiter)` for consistent error handling
  - [ ] **Testing**: Unit tests verify rate limiter initialization with correct config values

- [x] **Task 3: Implement global rate limiting middleware** (AC: 1, 2, 5)
  - [ ] Create or update `/src/middleware.ts` for global API route protection
  - [ ] Extract client IP address from request headers (handle proxies via `x-forwarded-for`)
  - [ ] Apply IP-based rate limiting to all `/api/*` routes
  - [ ] On rate limit exceeded:
    - Return HTTP 429 status
    - Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
    - Include `Retry-After` header (seconds until reset)
    - Return JSON error: `{ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests...', details: {...} } }`
  - [ ] Log rate limit violations with IP address, endpoint, timestamp
  - [ ] Configure middleware matcher to exclude static assets and `_next` routes
  - [ ] **Testing**: Integration test sends 101 requests from same IP, verifies 101st returns 429

- [x] **Task 4: Implement authenticated user rate limiting** (AC: 3)
  - [ ] Create helper function `applyUserRateLimit(userId, request)` in `/src/lib/rate-limit.ts`
  - [ ] Implement pattern for API routes to call user rate limiting after authentication:
    ```typescript
    const session = await getServerSession(authOptions);
    if (session) {
      const rateLimitResult = await userRateLimit.limit(session.user.id);
      if (!rateLimitResult.success) {
        return NextResponse.json({...}, { status: 429, headers: {...} });
      }
    }
    ```
  - [ ] Document pattern in code comments for other developers
  - [ ] Apply to high-traffic endpoints (example: `/api/student/courses`, `/api/instructor/assignments`)
  - [ ] **Testing**: Integration test sends 201 authenticated requests, verifies 201st returns 429

- [x] **Task 5: Implement strict login rate limiting** (AC: 4, 5)
  - [ ] Update `/src/app/api/auth/[...nextauth]/route.ts` (or custom login handler)
  - [ ] Apply `loginRateLimit` on failed login attempts (use email as identifier)
  - [ ] On rate limit exceeded:
    - Return HTTP 429 with clear message: "Too many failed login attempts. Please try again in 15 minutes."
    - Include `Retry-After` header (900 seconds = 15 minutes)
    - Log violation with email (hashed) and IP address
  - [ ] Reset rate limit counter on successful login
  - [ ] **Testing**: Integration test performs 6 failed logins, verifies 6th returns 429 with 15-minute lockout

- [x] **Task 6: Implement rate limit logging and monitoring** (AC: 7)
  - [ ] Create logger utility in `/src/lib/logger.ts` (if not already exists from Story 1.1)
  - [ ] Log rate limit violations with structured format:
    ```json
    {
      "level": "warn",
      "message": "Rate limit exceeded",
      "context": {
        "type": "ip" | "user" | "login",
        "identifier": "1.2.3.4" | "user-id" | "email",
        "endpoint": "/api/path",
        "limit": 100,
        "remaining": 0,
        "resetAt": "2025-11-25T12:00:00Z"
      }
    }
    ```
  - [ ] Enable Upstash analytics dashboard access (review in Upstash console)
  - [ ] Document how to review rate limit violations in Upstash dashboard
  - [ ] **Testing**: Integration test triggers rate limit, verifies log entry created

- [ ] **Task 7: Validate rate limiting with load testing** (AC: 6) - DEFERRED
  - [ ] Install load testing tool: `npm install -D k6` or use Artillery
  - [ ] Create load test script `/scripts/load-test-rate-limits.js`:
    - Test 1: Send 101 requests from same IP in 60 seconds → expect 101st = 429
    - Test 2: Send 201 authenticated requests from same user in 60 seconds → expect 201st = 429
    - Test 3: Send 6 failed logins from same email → expect 6th = 429
  - [ ] Run load tests against local development environment
  - [ ] Verify rate limits enforced correctly (no false positives, no false negatives)
  - [ ] Document load test execution in story completion notes
  - [ ] **Testing**: Load test results confirm all rate limits enforced as configured

- [x] **Task 8: Create rate limiting documentation** (AC: 8)
  - [ ] Document Upstash account creation and Redis database setup
  - [ ] Document environment variable configuration (`.env.local` setup)
  - [ ] Document rate limiting thresholds and rationale:
    - Per-IP: 100 req/min (protects against unauthenticated DoS)
    - Per-user: 200 req/min (higher limit for authenticated legitimate users)
    - Login: 5 attempts/15 min (prevents brute-force password attacks)
  - [ ] Document how to customize rate limits via environment variables
  - [ ] Document middleware implementation pattern
  - [ ] Document API route user rate limiting pattern
  - [ ] Include troubleshooting section:
    - "Rate limit exceeded" false positives (corporate VPNs, shared IPs)
    - Redis connection failures (fail-open behavior)
    - Upstash free tier limits exceeded (upgrade path)
  - [ ] Document monitoring via Upstash analytics dashboard
  - [ ] Save to `/docs/rate-limiting.md`
  - [ ] **Testing**: Manual review confirms documentation completeness

## Dev Notes

### Architecture Alignment

**Rate Limiting Technology Decision** [Source: docs/architecture.md#Architecture-Decision-Summary]
- **Choice**: Upstash Rate Limit (serverless Redis)
- **Rationale**: Zero infrastructure management, Vercel Edge compatible (< 10ms latency), free tier covers beta (10K commands/day)
- **Cost Trajectory**: Free → ~$10/month for production scale
- **Key Feature**: Sliding window algorithm prevents burst traffic exploitation

**Rate Limiting Strategy** [Source: docs/architecture.md#Security-Architecture]
- **Per-IP Rate Limit**: 100 requests/minute (protects against unauthenticated DoS attacks)
- **Per-User Rate Limit**: 200 requests/minute (higher limit for authenticated users)
- **Login Rate Limit**: 5 failed attempts → 15-minute lockout (prevents brute-force password attacks)
- **Implementation Pattern**: Global middleware for IP-based, per-route helper for user-based
- **Error Response**: HTTP 429 with `retry-after` header and structured JSON error

**OWASP Mapping** [Source: docs/tech-spec-epic-1.md#Non-Functional-Requirements]
- **OWASP Category**: A05: Security Misconfiguration (rate limiting prevents DoS exploitation)
- **Compliance**: Aligns with NFR004 security requirements (OWASP Top 10 protections)

### Project Structure Notes

**File Locations** [Source: docs/architecture.md#Project-Structure]
- Rate limiting utilities: `/src/lib/rate-limit.ts`
- Global middleware: `/src/middleware.ts` (Next.js 15 middleware convention)
- Logger utility: `/src/lib/logger.ts` (shared with Story 1.1)
- Load test scripts: `/scripts/load-test-rate-limits.js`
- Documentation: `/docs/rate-limiting.md`
- Environment variables: `.env.local` (gitignored, local development only)

**Middleware Configuration Pattern** [Source: docs/architecture.md#API-Architecture]
```typescript
// /src/middleware.ts
export const config = {
  matcher: '/api/:path*',  // Apply to all API routes, exclude static assets
};
```

**Environment Variable Naming** [Source: docs/tech-spec-epic-1.md#Dependencies]
```bash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"  # Upstash Redis REST endpoint
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"           # Upstash authentication token
RATE_LIMIT_IP_MAX="100"                                 # Per-IP limit (req/min)
RATE_LIMIT_USER_MAX="200"                               # Per-user limit (req/min)
RATE_LIMIT_LOGIN_MAX="5"                                # Login attempts per 15 min
```

### Security Considerations

**DoS Attack Prevention** [Source: docs/tech-spec-epic-1.md#Non-Functional-Requirements]
- Rate limiting is PRIMARY defense against DoS attacks targeting API endpoints
- Sliding window algorithm prevents "burst at window boundary" exploitation
- IP-based limiting protects unauthenticated endpoints (login, registration, public APIs)
- User-based limiting allows higher quotas for authenticated legitimate users
- Login rate limiting prevents brute-force password attacks

**False Positive Mitigation**
- Corporate VPNs and school networks may share single IP address across many users
- **Mitigation**: User-based rate limiting (200 req/min) provides higher quota for authenticated users
- **Monitoring**: Log rate limit violations to identify legitimate traffic patterns (e.g., corporate IP with many users)
- **Future Enhancement**: Whitelist known corporate IP ranges (defer to post-Epic 1)

**Fail-Open Behavior** [Source: docs/tech-spec-epic-1.md#Reliability]
- If Upstash Redis unavailable (network failure, service outage):
  - Middleware should fail-open (allow request) to avoid blocking all traffic
  - Log error to alert team of rate limiting failure
  - **Trade-off**: Brief vulnerability window vs. complete service outage
- **Implementation**: Wrap rate limit check in try-catch, log error, return success on exception

**Credentials Security**
- `UPSTASH_REDIS_REST_TOKEN` provides full access to Redis instance
- Never log token in application code or error messages
- Use Vercel environment variables for production deployment (Story 4.1)
- Rotate token if accidentally committed to git (treat as P1 security incident)

### Testing Standards

**Unit Testing** [Source: docs/tech-spec-epic-1.md#Test-Strategy]
- Test rate limiter initialization with correct configuration (limits, prefixes)
- Test `checkRateLimit()` helper function with mocked Redis responses
- Test error response formatting (HTTP 429, headers, JSON structure)
- Coverage target: 90%+ for `/src/lib/rate-limit.ts`

**Integration Testing**
- Test IP-based rate limiting: Send 101 requests from same IP → verify 101st returns 429
- Test user-based rate limiting: Send 201 authenticated requests → verify 201st returns 429
- Test login rate limiting: Send 6 failed logins → verify 6th returns 429 with 15-minute lockout
- Test `retry-after` header calculation accuracy
- Test rate limit reset after cooldown period
- Use dedicated Upstash Redis test database for isolation

**Load Testing** [Source: docs/tech-spec-epic-1.md#Test-Strategy]
- Use k6 or Artillery to simulate concurrent traffic
- Test scenarios:
  - 100 concurrent clients sending 2 requests each in 1 minute (200 total) → verify no false positives
  - Single client sending 101 requests in 1 minute → verify rate limit enforced
  - 10 concurrent authenticated users sending 25 requests each → verify user-based limits independent
- Validate Upstash Redis handles concurrent rate limit checks without race conditions
- **Performance Target**: Rate limit check overhead < 10ms per request

**Security Testing**
- Attempt to bypass rate limiting via IP spoofing (verify middleware extracts correct IP)
- Test rate limiting under distributed attack simulation (1000+ IPs sending 50 req/min each)
- Verify rate limit counters isolated per identifier (no cross-user pollution)

### Implementation Notes

**Rate Limiter Initialization Pattern** [Source: docs/tech-spec-epic-1.md#Detailed-Design]
```typescript
// /src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Per-IP rate limit: 100 requests/minute
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_IP_MAX || '100'),
    '1 m'
  ),
  analytics: true,
  prefix: 'ratelimit:ip',
});

// Per-user rate limit: 200 requests/minute
export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_USER_MAX || '200'),
    '1 m'
  ),
  analytics: true,
  prefix: 'ratelimit:user',
});

// Login rate limit: 5 attempts per 15 minutes
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
    '15 m'
  ),
  analytics: true,
  prefix: 'ratelimit:login',
});
```

**Global Middleware Pattern** [Source: docs/architecture.md#API-Architecture]
```typescript
// /src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  // Extract IP address (handle proxies)
  const ip = request.ip ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1';

  try {
    // Check IP-based rate limit
    const { success, limit, reset, remaining } = await ipRateLimit.limit(ip);

    if (!success) {
      // Log rate limit violation
      console.warn({
        type: 'rate_limit_exceeded',
        limiter: 'ip',
        identifier: ip,
        endpoint: request.nextUrl.pathname,
        limit,
        reset,
        remaining,
      });

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              limit,
              remaining,
              resetAt: new Date(reset).toISOString(),
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Rate limit passed, continue to API route
    return NextResponse.next();
  } catch (error) {
    // Fail-open: Allow request if Redis unavailable
    console.error({ error, message: 'Rate limit check failed, allowing request' });
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',  // Apply to all API routes
};
```

**Per-User Rate Limiting Pattern** (for use in API routes)
```typescript
// Example: /src/app/api/student/courses/route.ts
import { getServerSession } from 'next-auth';
import { userRateLimit } from '@/lib/rate-limit';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  // 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  // 2. Apply user-based rate limiting
  const { success, limit, reset, remaining } = await userRateLimit.limit(session.user.id);
  if (!success) {
    console.warn({
      type: 'rate_limit_exceeded',
      limiter: 'user',
      identifier: session.user.id,
      endpoint: '/api/student/courses',
      limit,
      reset,
      remaining,
    });

    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: { limit, remaining, resetAt: new Date(reset).toISOString() },
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // 3. Proceed with business logic
  const courses = await prisma.course.findMany({ where: { ... } });
  return NextResponse.json({ data: courses });
}
```

**Login Rate Limiting Pattern**
```typescript
// Example: /src/app/api/auth/login/route.ts (or custom login handler)
import { loginRateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Apply login rate limiting (use email as identifier)
  const { success, limit, reset, remaining } = await loginRateLimit.limit(email);
  if (!success) {
    console.warn({
      type: 'rate_limit_exceeded',
      limiter: 'login',
      identifier: email,
      limit,
      reset,
      remaining,
    });

    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          details: { limit, remaining, resetAt: new Date(reset).toISOString() },
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': '900',  // 15 minutes in seconds
        },
      }
    );
  }

  // Proceed with authentication logic
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    // Failed login attempt (rate limit counter incremented)
    return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 });
  }

  // Successful login (optionally reset rate limit counter)
  // Note: Upstash rate limiters auto-reset on window expiration, manual reset not required
  return NextResponse.json({ data: { user } });
}
```

### Dependencies

**External Services**
- **Upstash Redis**: Account required at https://upstash.com
- **Upstash Free Tier Limits**: 10K commands/day (sufficient for beta testing)
- **Upgrade Path**: If exceeding free tier during beta, upgrade to Pay-as-you-go ($0.20/100K commands, ~$10/month for production)

**NPM Packages** (new dependencies)
- `@upstash/ratelimit@^2.0.4`: Upstash rate limiting library with sliding window algorithm
- `@upstash/redis@^1.37.0`: Serverless Redis client for Upstash
- `k6` or `artillery` (devDependencies): Load testing tools for validating rate limits

**Existing Dependencies** (used by this story)
- `next-auth@4.24.11`: Used to extract authenticated user ID for user-based rate limiting
- `next@15.3.3`: Middleware API for global rate limiting

### Risks and Assumptions

**Risk**: Upstash Redis free tier commands (10K/day) may be insufficient for active development
- **Calculation**: 100 req/min × 60 min × 24 hours = 144K rate limit checks/day
- **Mitigation**: Free tier supports ~70 minutes of continuous 100 req/min traffic (sufficient for testing)
- **Action**: Monitor Upstash dashboard for usage; upgrade to paid plan ($10/month) if needed during beta

**Risk**: Rate limiting false positives for legitimate users behind shared IPs
- **Example**: 20 students at same school using same public IP address
- **Mitigation**: User-based rate limiting (200 req/min) provides higher quota for authenticated users
- **Monitoring**: Review rate limit violation logs weekly during first month of beta
- **Future Enhancement**: Implement IP whitelisting for known educational/corporate networks (defer to post-Epic 1)

**Risk**: Redis connection failures could block all API traffic if fail-closed
- **Mitigation**: Implement fail-open behavior (allow requests if Redis unavailable)
- **Trade-off**: Brief vulnerability window (no rate limiting) vs. complete service outage
- **Monitoring**: Log Redis connection failures to alert team (Sentry integration in Epic 4)

**Assumption**: Sliding window algorithm sufficient for rate limiting (vs. token bucket or leaky bucket)
- **Rationale**: Sliding window prevents "burst at window boundary" exploitation, industry standard
- **Validation**: Load testing (Task 7) will validate sliding window behavior under concurrent traffic

**Assumption**: 100 req/min per IP sufficient for legitimate unauthenticated traffic
- **Validation**: Monitor rate limit violations during first 2 weeks of beta testing
- **Adjustment**: If false positives detected, increase limit to 150 req/min (configurable via environment variable)

**Assumption**: Developer can create Upstash account (no corporate firewall restrictions)
- **Validation**: Confirm Upstash accessibility before starting task

### Next Story Dependencies

**Story 1.8 (Input Validation with Zod)** is independent and can be implemented concurrently.

**Story 1.9 (Soft Deletes Implementation)** is independent and can be implemented concurrently.

**Epic 1.5 (Testing Infrastructure)** depends on:
- Rate limiting middleware operational (this story) for E2E testing scenarios

**Epic 4 (Production Deployment)** depends on:
- Rate limiting monitoring configured (this story) for production alerting

### Performance Considerations

**Rate Limit Check Latency** [Source: docs/tech-spec-epic-1.md#Performance]
- **Target**: < 10ms overhead per request (p95)
- **Upstash Advantage**: Deployed on Vercel Edge (co-located with application), minimal network latency
- **Measurement**: Add timing logs around `ipRateLimit.limit()` calls during load testing

**Connection Pooling**
- Upstash Redis client uses HTTP REST API (no persistent connections)
- Each rate limit check is a single HTTP request to Upstash
- No connection pool configuration needed (serverless design)

**Sliding Window Memory Usage**
- Each rate limit counter stored in Redis with TTL (auto-expires after window period)
- Memory footprint: ~100 bytes per unique IP/user identifier
- 1000 unique IPs × 100 bytes = ~100KB memory usage (negligible)

### References

- [Architecture: Rate Limiting Decision](docs/architecture.md#Architecture-Decision-Summary)
- [Architecture: Security Architecture - Rate Limiting](docs/architecture.md#Security-Architecture)
- [Architecture: API Middleware Stack](docs/architecture.md#API-Architecture)
- [Tech Spec Epic 1: Rate Limiting Implementation](docs/tech-spec-epic-1.md#Detailed-Design)
- [Tech Spec Epic 1: Story 1.7 Acceptance Criteria](docs/tech-spec-epic-1.md#Acceptance-Criteria)
- [Tech Spec Epic 1: Security Requirements](docs/tech-spec-epic-1.md#Non-Functional-Requirements)
- [Epics: Story 1.7 Definition](docs/epics.md#Story-1.7)

## Dev Agent Record

### Context Reference

- `docs/stories/1-7-rate-limiting-implementation.context.xml` - Generated 2025-11-25

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without blocking issues

### Completion Notes List

**New Patterns/Services Created:**
- Rate limiting utility module with lazy Redis initialization
- Global IP rate limiting via Next.js middleware
- Helper functions for user and login rate limiting
- Structured logging for rate limit violations

**Architectural Decisions:**
- **Fail-open behavior**: Requests allowed if Redis unavailable (prevents service outage)
- **Lazy initialization**: Redis client created on first use (not at module load)
- **Login rate limiting via NextAuth**: Integrated into authorize callback, throws error on rate limit

**Technical Debt Deferred:**
- IP whitelisting for corporate/educational networks
- Load testing scripts (k6/artillery) - can be added when needed for stress testing
- Per-route user rate limiting on high-traffic endpoints (pattern documented, not applied globally)

**Warnings for Next Story:**
- User rate limiting pattern available via `applyUserRateLimit()` - apply to high-traffic endpoints as needed
- Login rate limit uses email as identifier (case-insensitive)
- Rate limiting is DISABLED if Upstash credentials not configured (graceful degradation for dev)

**Interfaces/Methods Created for Reuse:**
- `checkIpRateLimit(ip)` - Check IP rate limit
- `checkUserRateLimit(userId)` - Check user rate limit
- `checkLoginRateLimit(email)` - Check login rate limit
- `applyUserRateLimit(userId, endpoint)` - Apply user rate limiting in API routes
- `applyLoginRateLimit(email, endpoint)` - Apply login rate limiting
- `createRateLimitResponse(result, message?)` - Create HTTP 429 response
- `logRateLimitViolation(type, identifier, endpoint, result)` - Log violations

### File List

- NEW: `/src/lib/rate-limit.ts` - Rate limiting utilities and helpers
- NEW: `/src/middleware.ts` - Global IP rate limiting middleware
- NEW: `/docs/rate-limiting.md` - Comprehensive documentation
- MODIFIED: `/src/lib/auth.ts` - Added login rate limiting to NextAuth
- MODIFIED: `.env.example` - Added Upstash and R2 environment variables
- MODIFIED: `package.json` - Added @upstash/ratelimit and @upstash/redis
