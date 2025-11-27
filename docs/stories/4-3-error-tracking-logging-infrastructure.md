# Story 4.3: Error Tracking & Logging Infrastructure

Status: ready-for-dev

## Story

As a developer,
I want comprehensive error tracking and logging with alerting,
so that I can detect and diagnose production issues immediately.

## Acceptance Criteria

1. Sentry integrated for error tracking (`@sentry/nextjs` installed)
2. All unhandled exceptions automatically captured and logged
3. Error context includes: User ID, request URL, stack trace, browser/OS info
4. Source maps configured (Sentry shows original TypeScript code)
5. Error severity classification implemented (P0: critical, P1: high, P2: medium, P3: low)
6. Automated alerting configured (P0 → immediate, P1 → 1 hour, P2/P3 → daily digest)
7. Structured logging implemented (Pino) for server-side logs
8. Log aggregation configured (Vercel Logs, searchable)
9. Log retention policy: 30 days for all logs, 90 days for error logs
10. Dashboard created: Error trends, most common errors, error rate over time
11. Documentation: Error tracking and logging guide

## Tasks / Subtasks

- [ ] Task 1: Install and configure Sentry (AC: #1, #4)
  - [ ] 1.1: Run Sentry wizard: `npx @sentry/wizard@latest -i nextjs`
  - [ ] 1.2: Configure Sentry environment variables (DSN, ORG, PROJECT, AUTH_TOKEN)
  - [ ] 1.3: Verify Sentry initialization files created (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
  - [ ] 1.4: Configure source maps upload in next.config.js
  - [ ] 1.5: Test source map upload: Trigger error, verify TypeScript visible in Sentry

- [ ] Task 2: Configure Sentry error capture and context (AC: #2, #3)
  - [ ] 2.1: Create `/src/lib/sentry.ts` with base configuration
  - [ ] 2.2: Configure beforeSend hook to filter sensitive data (passwords, tokens)
  - [ ] 2.3: Configure error context: user ID, request URL, stack trace
  - [ ] 2.4: Configure session replay (100% on errors, 10% general sessions)
  - [ ] 2.5: Configure ignoreErrors list (ResizeObserver, Network errors)
  - [ ] 2.6: Test error capture: Throw test exception, verify context in Sentry dashboard

- [ ] Task 3: Implement error severity classification (AC: #5)
  - [ ] 3.1: Define severity classification rules in documentation
  - [ ] 3.2: Configure Sentry tags for severity (P0/P1/P2/P3)
  - [ ] 3.3: Update error capture calls to include severity tags
  - [ ] 3.4: Test classification: Trigger errors at each level, verify tags in Sentry

- [ ] Task 4: Configure automated alerting (AC: #6)
  - [ ] 4.1: Configure Sentry alert rules for P0 errors (immediate → Slack + Email)
  - [ ] 4.2: Configure Sentry alert rules for P1 errors (1 hour digest → Slack + Email)
  - [ ] 4.3: Configure Sentry alert rules for P2/P3 errors (daily digest → Email)
  - [ ] 4.4: Set up Slack webhook integration for error notifications
  - [ ] 4.5: Configure email notification recipients
  - [ ] 4.6: Test alerts: Trigger P0/P1 errors, verify notifications received within SLA

- [ ] Task 5: Implement Pino structured logging (AC: #7)
  - [ ] 5.1: Install Pino: `npm install pino pino-pretty`
  - [ ] 5.2: Create `/src/lib/logger.ts` with Pino configuration
  - [ ] 5.3: Configure log levels (development: debug, production: info)
  - [ ] 5.4: Configure JSON structured logging with standard fields (timestamp, level, requestId, userId)
  - [ ] 5.5: Replace console.log with logger calls in critical API routes
  - [ ] 5.6: Test logging: Generate logs, verify JSON format in Vercel Logs

- [ ] Task 6: Configure Vercel Logs aggregation (AC: #8, #9)
  - [ ] 6.1: Verify Vercel Logs accessible in Vercel dashboard
  - [ ] 6.2: Test log search functionality (search by requestId, userId, error level)
  - [ ] 6.3: Verify log retention: Check Vercel Pro plan includes 3 months retention
  - [ ] 6.4: Configure Sentry log retention policy: 90 days for error logs
  - [ ] 6.5: Document log access procedures (how to search, filter, export)

- [ ] Task 7: Create monitoring dashboard (AC: #10)
  - [ ] 7.1: Configure Sentry dashboard widgets: Error trends (24h, 7d, 30d)
  - [ ] 7.2: Configure Sentry dashboard widgets: Most common errors (grouped)
  - [ ] 7.3: Configure Sentry dashboard widgets: Error rate over time
  - [ ] 7.4: Configure Sentry dashboard widgets: Error distribution by endpoint
  - [ ] 7.5: Configure Sentry dashboard widgets: Session replay links for debugging
  - [ ] 7.6: Save dashboard as team default view
  - [ ] 7.7: Test dashboard: Trigger various errors, verify metrics update in real-time

- [ ] Task 8: Create error tracking and logging documentation (AC: #11)
  - [ ] 8.1: Create `/docs/error-tracking-logging.md` guide
  - [ ] 8.2: Document Sentry setup and configuration
  - [ ] 8.3: Document error severity classification (P0/P1/P2/P3 definitions)
  - [ ] 8.4: Document alert channels and notification SLAs
  - [ ] 8.5: Document Pino logging patterns (how to log, what to log)
  - [ ] 8.6: Document log access procedures (Vercel Logs, Sentry dashboard)
  - [ ] 8.7: Document troubleshooting procedures (common errors, debugging steps)
  - [ ] 8.8: Include code examples for error capture and logging patterns

- [ ] Task 9: Integration testing and validation
  - [ ] 9.1: Trigger unhandled exception in API route, verify Sentry capture
  - [ ] 9.2: Trigger client-side error, verify Sentry capture with browser context
  - [ ] 9.3: Verify source maps show TypeScript code (not compiled JS)
  - [ ] 9.4: Verify session replay captures user actions leading to error
  - [ ] 9.5: Verify sensitive data filtered (passwords, tokens redacted)
  - [ ] 9.6: Verify alerts fire according to SLA (P0 immediate, P1 1 hour)
  - [ ] 9.7: Verify Pino logs searchable in Vercel Logs
  - [ ] 9.8: Verify dashboard displays correct error trends and metrics

## Dev Notes

### References

- [Source: docs/tech-spec-epic-4.md#Error Tracking]
- [Source: docs/epics.md#Story 4.3]

### Sentry Configuration Details

**Environment Variables (add to Vercel):**
```bash
# Error Tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_AUTH_TOKEN="<sentry-auth-token>"
SENTRY_ORG="ai-gurus"
SENTRY_PROJECT="ai-gurus-lms"
```

**Sentry Configuration Pattern:**
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: 0.1,  // 10% of transactions in production

  // Session replay for error debugging
  replaysOnErrorSampleRate: 1.0,  // 100% replay on errors
  replaysSessionSampleRate: 0.1,  // 10% general replay

  // Filter sensitive data
  beforeSend(event) {
    if (event.request?.data?.password) {
      delete event.request.data.password;
    }
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[REDACTED]';
    }
    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Load failed',
  ],
});
```

**API Route Error Capture Pattern:**
```typescript
// Example: API Route Error Capture
export async function POST(request: Request) {
  try {
    // Business logic
  } catch (error) {
    // Capture with context
    Sentry.captureException(error, {
      tags: {
        route: '/api/instructor/courses',
        action: 'create_course',
        severity: 'P1',  // High priority
      },
      extra: {
        userId: session?.user?.id,
        requestBody: sanitizedBody,
      },
      level: 'error',
    });

    logger.error({ error, userId: session?.user?.id }, 'Failed to create course');

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

**Pino Logger Configuration:**
```typescript
// src/lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
  },
});

export default logger;
```

**Error Severity Classification:**
- **P0 (Critical):** Authentication failures, data loss risk, site down, payment processing errors
- **P1 (High):** Major feature broken (course enrollment fails, assignment submission fails, grading unavailable)
- **P2 (Medium):** Minor feature broken (search not working, notification delay, UI glitch)
- **P3 (Low):** Cosmetic issues, non-critical warnings, performance degradation (not blocking)

**Alert Configuration:**
- **P0:** Immediate notification → Slack + Email + SMS (if configured)
- **P1:** Notification within 1 hour → Slack + Email
- **P2/P3:** Daily digest → Email only

**Session Replay Configuration:**
- 100% replay on errors (captures all user sessions that encounter errors)
- 10% general session replay (samples 10% of non-error sessions for UX insights)
- Privacy: Sensitive inputs excluded (passwords, credit cards, PII)

**Source Maps Upload:**
- Configured in `next.config.js` via Sentry wizard
- Source maps uploaded during build process
- Allows Sentry to show original TypeScript code instead of compiled JavaScript
- Improves debugging experience significantly

**Log Retention Policies:**
- Vercel Logs: 3 months (Vercel Pro plan default)
- Sentry Error Logs: 90 days (configurable in Sentry project settings)
- General application logs: 30 days (sufficient for troubleshooting)

**Monitoring Dashboard Widgets:**
1. Error trends: Line chart showing errors over time (24h, 7d, 30d views)
2. Most common errors: Table showing top 10 errors by frequency (grouped by error message)
3. Error rate: Percentage of requests resulting in errors
4. Error distribution by endpoint: Bar chart showing which API routes generate most errors
5. Session replay: Quick access links to replay sessions with errors

**Installation Commands:**
```bash
# Install Sentry
npx @sentry/wizard@latest -i nextjs

# Install Pino
npm install pino pino-pretty

# Verify installation
npm list @sentry/nextjs pino
```

**Testing Checklist:**
- [ ] Trigger test error in development, verify Sentry captures
- [ ] Trigger test error in production, verify source maps show TypeScript
- [ ] Verify session replay captures user interactions
- [ ] Verify sensitive data filtered (passwords, auth tokens)
- [ ] Trigger P0 error, verify immediate Slack notification
- [ ] Trigger P1 error, verify email notification within 1 hour
- [ ] Verify Pino logs searchable in Vercel Logs
- [ ] Verify dashboard shows accurate error metrics

## Dev Agent Record

### Context Reference

Story context XML created: `4-3-error-tracking-logging-infrastructure.context.xml`

This context file contains:
- Complete Sentry configuration (@sentry/nextjs setup, environment variables, beforeSend hooks)
- Pino structured logging implementation (src/lib/logger.ts)
- Error severity classification (P0/P1/P2/P3 definitions with examples)
- Automated alerting configuration (Slack webhooks, email notifications, alert rules)
- API route error capture patterns (existing routes requiring updates)
- Session replay configuration (privacy settings, sampling rates)
- Vercel Logs aggregation (search procedures, retention policies)
- Sentry dashboard widgets (error trends, common errors, distribution)
- Testing scenarios and validation criteria
- Integration with existing middleware and health check endpoints

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
