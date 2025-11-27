# Epic Technical Specification: Production Deployment & Monitoring

Date: 2025-11-27
Author: Ed
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 transforms the validated AI Gurus LMS application into an operational production system capable of serving 1-10 SME executive beta testers with enterprise-grade reliability (99.5%+ uptime). This epic deploys the tested platform to production infrastructure with comprehensive monitoring, logging, error tracking, and operational procedures established during Epics 1-3.

Beyond deployment, this epic establishes the operational foundation for incident response, performance monitoring, and proactive issue detection. When beta users encounter issues, the team can detect, diagnose, and resolve them rapidly through Sentry error tracking, Better Stack uptime monitoring, and Vercel Analytics performance monitoring. The beta onboarding materials and deployment runbooks ensure a smooth launch and sustainable long-term operations.

This epic represents the culmination of the 10-week production readiness journey, transitioning the platform from a development prototype to a production-grade LMS ready for the Q1 2026 beta launch with SME executive testers.

## Objectives and Scope

**In Scope:**
- Production hosting configuration on Vercel with custom domain and SSL/TLS
- Neon PostgreSQL production database with automated backups (7-day retention)
- Cloudflare R2 production storage configuration with appropriate access controls
- Sentry error tracking integration with severity-based alerting (P0/P1/P2/P3)
- Pino structured logging with Vercel log aggregation
- Better Stack uptime monitoring (3-minute checks, multiple global locations)
- Vercel Analytics for performance monitoring (Core Web Vitals, page load times)
- Deployment runbooks, incident response playbooks, and troubleshooting guides
- Beta tester onboarding materials (quick start guide, video walkthrough, feedback survey)
- Production readiness validation and go-live checklist

**Out of Scope:**
- Multi-region deployment (single region sufficient for beta scale)
- Advanced auto-scaling configuration (Vercel handles this automatically)
- APM (Application Performance Monitoring) beyond Vercel Analytics
- Log aggregation beyond Vercel Logs (no external service like Datadog for MVP)
- On-call rotation scheduling (single point of contact for beta)
- Disaster recovery testing beyond database backup/restore
- Chaos engineering or fault injection testing
- Production load testing beyond smoke tests

## System Architecture Alignment

**Architectural Boundaries (from architecture.md):**
- Vercel project configuration (production environment settings)
- `/src/lib/sentry.ts` - Sentry error tracking configuration
- `/src/lib/logger.ts` - Pino structured logging (already implemented in Epic 1)
- `/docs/` - Deployment runbooks and operational documentation
- External services: Sentry, Better Stack, Vercel Analytics

**Integration Points:**
- Sentry integrates with all application code for error capture (client + server)
- Vercel Analytics automatically tracks all pages for performance monitoring
- Better Stack pings health endpoints for uptime monitoring (`/api/health/db`)
- Neon automated backups run daily with 7-day retention (Scale plan)
- All monitoring alerts route to Slack/email for rapid response

**Technology Stack for Epic 4:**
| Service | Purpose | Cost |
|---------|---------|------|
| Vercel Pro | Production hosting, edge deployment | $20/month |
| Neon Scale | PostgreSQL with automated backups | $19/month |
| Sentry | Error tracking, session replay | Free → $29/month |
| Better Stack | Uptime monitoring, status page | Free → $18/month |
| Vercel Analytics | Performance monitoring, Core Web Vitals | Included in Pro |
| Cloudflare R2 | Production file storage | Already configured (Epic 1) |

**Constraints:**
- Must maintain 99.5%+ uptime during production (PRD NFR002)
- All monitoring must have real-time alerting capability
- Deployment must be zero-downtime (Vercel handles automatically)
- Rollback must be possible within 5 minutes of detecting issues
- All production secrets managed via Vercel environment variables

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| Vercel Project | Production hosting, edge deployment, environment management | Application code, env vars | Deployed application, preview URLs | DevOps |
| Neon Production DB | PostgreSQL hosting with automated backups, point-in-time restore | Schema, migrations | Database service, backup snapshots | DevOps |
| `/src/lib/sentry.ts` | Error tracking configuration, exception capture, session replay | Errors, user context | Sentry dashboard, alerts | Dev |
| `/src/lib/logger.ts` | Structured JSON logging with Pino (already exists from Epic 1) | Log events | Vercel Logs aggregation | Dev |
| Better Stack Monitors | Uptime monitoring, incident detection, status page | Health check endpoints | Uptime metrics, incident alerts | DevOps |
| Vercel Analytics | Performance monitoring, Core Web Vitals, real user metrics | Page views, interactions | Performance dashboard | DevOps |
| `/docs/deployment-runbook.md` | Step-by-step deployment procedures | Deployment requirements | Executable runbook | DevOps |
| `/docs/incident-response.md` | Incident classification and response procedures | Incident types | Response playbook | DevOps |
| `/docs/troubleshooting.md` | Common issues and resolution steps | Error patterns | Debug procedures | Dev |
| `/docs/beta-quick-start.md` | Beta tester onboarding guide | User requirements | Onboarding documentation | PM |

### Data Models and Contracts

**No new database models required for Epic 4.** This epic focuses on deployment and operational infrastructure.

**Environment Variables Configuration:**

```bash
# Production Environment Variables (Vercel)
# =========================================

# Database (Neon PostgreSQL - Production)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/ai-gurus-prod?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/ai-gurus-prod?sslmode=require"

# Authentication (NextAuth)
NEXTAUTH_URL="https://learn.aigurus.com"
NEXTAUTH_SECRET="<random-32-char-production-secret>"

# File Storage (Cloudflare R2 - Already configured)
CLOUDFLARE_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="<production-access-key>"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="<production-secret-key>"
R2_PUBLIC_BUCKET="ai-gurus-public-prod"
R2_PRIVATE_BUCKET="ai-gurus-private-prod"
R2_PUBLIC_CDN_URL="https://cdn.aigurus.com"

# Rate Limiting (Upstash - Already configured)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<production-token>"

# Error Tracking (Sentry - New for Epic 4)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_AUTH_TOKEN="<sentry-auth-token>"
SENTRY_ORG="ai-gurus"
SENTRY_PROJECT="ai-gurus-lms"

# Monitoring Configuration
LOG_LEVEL="info"
NODE_ENV="production"
```

**Sentry Configuration Contract:**

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

### APIs and Interfaces

**Health Check Endpoint (Already exists from Epic 1):**

```typescript
// GET /api/health/db
// Used by Better Stack for uptime monitoring

Response (200 OK):
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T10:00:00.000Z",
  "version": "1.0.0"
}

Response (503 Service Unavailable):
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection timeout",
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

**Sentry Error Capture Pattern:**

```typescript
// API Route Error Capture
export async function POST(request: Request) {
  try {
    // Business logic
  } catch (error) {
    // Capture with context
    Sentry.captureException(error, {
      tags: {
        route: '/api/instructor/courses',
        action: 'create_course',
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

**Better Stack Webhook Alerts:**

| Alert Type | Trigger | Notification |
|------------|---------|--------------|
| Down | 2 consecutive failed checks | Immediate (SMS + Email + Slack) |
| Slow | Response time > 5 seconds | Warning (Email + Slack) |
| Recovery | Service restored after incident | Immediate (Email + Slack) |
| SSL Expiry | Certificate expires in < 14 days | Warning (Email) |

### Workflows and Sequencing

**Story Execution Order:**

```
Story 4.1 (Production Hosting)
    ↓
Story 4.2 (Database Backups)     ← Depends on 4.1 (production DB)
    ↓
Story 4.3 (Error Tracking)       ← Depends on 4.1 (production deployment)
    ↓
Story 4.4 (Performance/Uptime)   ← Depends on 4.1 (production endpoints)
    ↓
Story 4.5 (Runbooks)             ← Depends on 4.2-4.4 (all ops systems)
    ↓
Story 4.6 (Beta Onboarding)      ← Depends on 4.1 (production URL)
    ↓
Story 4.7 (Launch Validation)    ← Depends on ALL previous stories
```

**Production Deployment Flow:**

```
1. Developer pushes to main branch
    ↓
2. GitHub Actions CI/CD
   - Lint → Type check → Unit tests → E2E tests
   - All tests must pass (blocking)
    ↓
3. Vercel Auto-Deploy
   - Build Next.js application
   - Deploy to edge network
   - Update production URL atomically
    ↓
4. Post-Deployment Validation
   - Health check endpoint responds 200
   - Sentry receives test event
   - Better Stack confirms uptime
    ↓
5. Monitoring Active
   - Sentry captures errors
   - Vercel Analytics tracks performance
   - Better Stack monitors uptime
```

**Incident Response Flow:**

```
1. Alert Triggered (Better Stack or Sentry)
    ↓
2. Incident Classification
   - P0: Site down, data loss risk → Immediate response
   - P1: Major feature broken → Response within 1 hour
   - P2: Minor issue → Response within 4 hours
   - P3: Cosmetic/minor → Next business day
    ↓
3. Investigation
   - Check Sentry for errors
   - Review Vercel Logs
   - Check database health
   - Review recent deployments
    ↓
4. Resolution
   - Hotfix deployment OR
   - Rollback to previous version OR
   - Configuration change
    ↓
5. Post-Incident
   - Document in incident log
   - Update runbooks if needed
   - Communicate to stakeholders
```

**Database Backup Flow (Automated):**

```
Daily (midnight UTC):
1. Neon triggers automated snapshot
2. Snapshot stored in separate availability zone
3. Previous snapshots retained per policy (7 days daily, 4 weeks weekly)
4. Health check validates backup completion
5. Alert if backup fails

Point-in-Time Recovery (Manual):
1. Access Neon dashboard
2. Select recovery point (timestamp)
3. Create new branch from backup
4. Validate data integrity
5. Promote branch to production (if needed)
```

**Beta Launch Sequence:**

```
Week 9:
1. Production hosting operational (Story 4.1)
2. Database backups configured (Story 4.2)
3. Error tracking live (Story 4.3)
4. Uptime monitoring active (Story 4.4)

Week 10:
5. Runbooks complete (Story 4.5)
6. Onboarding materials ready (Story 4.6)
7. Production validation complete (Story 4.7)
8. Beta tester accounts created
9. Welcome emails sent
10. LAUNCH 🚀
```

## Non-Functional Requirements

### Performance

**PRD NFR001 Validation Targets:**

| Metric | Target | Measurement Tool | Story |
|--------|--------|------------------|-------|
| Page load time | < 2 seconds (p95) | Vercel Analytics | 4.4 |
| API response time | < 500ms (p95) | Vercel Analytics | 4.4 |
| Lighthouse Performance | > 80 | Lighthouse CI | 4.7 |
| Time to First Byte (TTFB) | < 200ms | Vercel Analytics | 4.4 |
| First Contentful Paint (FCP) | < 1.8s | Vercel Analytics | 4.4 |
| Largest Contentful Paint (LCP) | < 2.5s | Vercel Analytics | 4.4 |
| Cumulative Layout Shift (CLS) | < 0.1 | Vercel Analytics | 4.4 |

**Performance Monitoring Implementation:**
- Vercel Analytics automatically tracks all Core Web Vitals
- Real User Monitoring (RUM) captures actual user experience
- Performance alerts configured for p95 latency exceeding thresholds
- Dashboard displays performance trends over time
- Geographic performance breakdown identifies regional issues

**Deployment Performance:**
- Zero-downtime deployments (Vercel atomic deployments)
- Rollback execution time: < 2 minutes
- Build time target: < 3 minutes
- Preview deployment time: < 2 minutes

### Security

**Production Security Configuration:**

| Control | Implementation | Validation |
|---------|---------------|------------|
| HTTPS enforcement | Vercel automatic SSL/TLS | Certificate validity check |
| Security headers | next.config.js headers | Better Stack header monitoring |
| Secrets management | Vercel environment variables | No hardcoded secrets in code |
| Database encryption | Neon TLS + encryption at rest | Connection string uses sslmode=require |
| Session security | NextAuth 30-day sessions, 7-day idle | Session expiration tested |
| Rate limiting | Upstash (already configured Epic 1) | 429 response validation |

**Sentry Security:**
- Sensitive data filtering (passwords, tokens, PII)
- Source maps uploaded securely via SENTRY_AUTH_TOKEN
- Session replay excludes sensitive form inputs
- Data retention: 90 days (configurable)

**Production Access Control:**
- Vercel team access: Principle of least privilege
- Neon database: Read-only access for monitoring, write access restricted
- Environment variables: Production secrets separate from preview/development
- Deployment permissions: Protected main branch, required reviews

**Incident Security:**
- Incident response includes security assessment
- Breach notification procedures documented
- Audit logs retained for compliance (soft deletes from Epic 1)

### Reliability/Availability

**PRD NFR002 Targets:**

| Metric | Target | Implementation |
|--------|--------|---------------|
| Uptime | 99.5%+ | Vercel SLA + Better Stack monitoring |
| Mean Time to Detect (MTTD) | < 5 minutes | 3-minute uptime checks |
| Mean Time to Recovery (MTTR) | < 1 hour | Runbooks + rollback procedures |
| Recovery Point Objective (RPO) | < 24 hours | Daily database backups |
| Recovery Time Objective (RTO) | < 1 hour | Neon point-in-time restore |

**High Availability Architecture:**
- Vercel edge network: Global distribution, automatic failover
- Neon PostgreSQL: Serverless, auto-scaling, multi-AZ backups
- Cloudflare R2: Globally distributed storage with CDN

**Failure Scenarios and Mitigation:**

| Scenario | Detection | Response | Recovery |
|----------|-----------|----------|----------|
| Application error | Sentry alert | Check logs, identify root cause | Hotfix or rollback |
| Database down | Health check fails, Better Stack | Check Neon status, failover | Restore from backup |
| Deployment failure | Vercel build fails | Review build logs | Fix and redeploy |
| Traffic spike | Vercel auto-scales | Monitor performance | No action needed |
| Storage outage | File operations fail | Check R2 status | Cloudflare handles |

**Backup Strategy:**
- Daily automated backups (Neon Scale plan)
- 7-day retention for daily backups
- 4-week retention for weekly backups
- Point-in-time recovery within retention window
- Monthly backup restore testing

### Observability

**Observability Stack:**

| Layer | Tool | Purpose | Retention |
|-------|------|---------|-----------|
| Errors | Sentry | Exception tracking, session replay | 90 days |
| Logs | Vercel Logs + Pino | Structured application logs | 7 days (Hobby), 3 months (Pro) |
| Metrics | Vercel Analytics | Performance, Core Web Vitals | Indefinite |
| Uptime | Better Stack | Availability monitoring | 1 year |
| Traces | Sentry Performance | Distributed tracing (10% sample) | 90 days |

**Alerting Configuration:**

| Alert Type | Trigger | Channel | Response |
|------------|---------|---------|----------|
| P0 Error | Critical exception (auth, data loss) | Slack + SMS + Email | Immediate |
| P1 Error | Major feature broken | Slack + Email | Within 1 hour |
| Downtime | 2 consecutive failed checks | Slack + SMS + Email | Immediate |
| Slow response | p95 > 5 seconds | Slack | Within 4 hours |
| Error spike | 10x normal error rate | Slack + Email | Within 1 hour |
| Backup failure | Daily backup incomplete | Email | Within 4 hours |

**Dashboard Configuration:**

```
Sentry Dashboard:
- Error trends (last 24h, 7d, 30d)
- Most common errors (grouped)
- Error rate by endpoint
- Session replay for debugging
- Release tracking

Vercel Analytics Dashboard:
- Core Web Vitals scores
- Page load times by page
- Geographic performance
- Device breakdown
- Traffic trends

Better Stack Dashboard:
- Uptime percentage (7d, 30d, 90d)
- Incident history
- Response time trends
- Status page (public)
```

**Log Correlation:**
- All logs include: timestamp, requestId, userId, action
- Sentry errors link to related logs via requestId
- Vercel deployment ID tracked for version correlation
- User journey reconstruction via session replay + logs

## Dependencies and Integrations

**New Dependencies Required for Epic 4:**

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| `@sentry/nextjs` | ^8.x | Error tracking, session replay, performance | 4.3 |

**Installation Command:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Existing Dependencies (No Changes Required):**

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.3.3 | Application framework |
| `@prisma/client` | ^6.9.0 | Database client (Neon PostgreSQL) |
| `@aws-sdk/client-s3` | ^3.939.0 | Cloudflare R2 storage |
| `@upstash/ratelimit` | ^2.0.7 | Rate limiting (already configured) |
| `pino` | (to install) | Structured logging (if not using console) |

**External Service Dependencies:**

| Service | Purpose | Account Required | Story |
|---------|---------|------------------|-------|
| Vercel | Production hosting, edge deployment | Yes (Pro plan for production) | 4.1 |
| Neon | PostgreSQL database, automated backups | Yes (Scale plan for backups) | 4.1, 4.2 |
| Sentry | Error tracking, session replay | Yes (Free tier sufficient for beta) | 4.3 |
| Better Stack | Uptime monitoring, status page | Yes (Free tier: 10 monitors) | 4.4 |
| Cloudflare R2 | File storage (already configured) | Yes (already set up in Epic 1) | - |
| Upstash | Rate limiting (already configured) | Yes (already set up in Epic 1) | - |
| GitHub | Repository hosting, CI/CD | Yes (already in use) | 4.1 |

**Service Integration Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Vercel    │────▶│    Neon     │     │ Cloudflare  │        │
│  │   (Host)    │     │ (PostgreSQL)│     │     R2      │        │
│  └──────┬──────┘     └─────────────┘     └─────────────┘        │
│         │                                                         │
│         │ errors                                                  │
│         ▼                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Sentry    │     │Better Stack │     │   Vercel    │        │
│  │  (Errors)   │     │  (Uptime)   │     │ (Analytics) │        │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘        │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                             │                                     │
│                             ▼                                     │
│                    ┌─────────────┐                               │
│                    │   Slack/    │                               │
│                    │   Email     │                               │
│                    │  (Alerts)   │                               │
│                    └─────────────┘                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**CI/CD Integration (GitHub Actions):**

```yaml
# Existing .github/workflows/ci.yml additions for Epic 4

# Add Sentry source map upload
- name: Upload source maps to Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ai-gurus
    SENTRY_PROJECT: ai-gurus-lms
  run: npx @sentry/cli sourcemaps upload ./next

# Add production smoke test
- name: Production smoke test
  if: github.ref == 'refs/heads/main'
  run: |
    curl -f https://learn.aigurus.com/api/health/db || exit 1
    echo "Health check passed"
```

**Vercel Project Configuration:**

```json
// vercel.json (if needed for custom configuration)
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Domain Configuration:**

| Domain | Purpose | Provider |
|--------|---------|----------|
| `learn.aigurus.com` | Production application | Vercel (custom domain) |
| `cdn.aigurus.com` | Static file CDN | Cloudflare R2 |
| `status.aigurus.com` | Public status page | Better Stack |

**SSL/TLS Configuration:**
- Automatic certificate provisioning via Vercel
- Certificate auto-renewal (Let's Encrypt)
- HSTS enabled via security headers
- TLS 1.2+ enforced

## Acceptance Criteria (Authoritative)

### Story 4.1: Production Hosting Configuration

1. Production hosting platform provisioned on Vercel (Pro plan)
2. PostgreSQL production database configured on Neon (connection pooling enabled)
3. S3/CDN production storage configured with appropriate access controls (R2 buckets)
4. Environment variables configured via Vercel secrets management
5. Custom domain configured with SSL/TLS certificates (HTTPS enforced)
6. Production deployment successful (application accessible via production URL)
7. Health check endpoint operational (`/api/health/db` returns 200 OK)
8. Database connection verified (queries execute successfully in production)
9. File upload/download verified (R2 storage operational in production)
10. Rollback procedure tested (ability to deploy previous version within 5 minutes)
11. Documentation: Production hosting setup guide and architecture diagram

### Story 4.2: Automated Database Backup & Recovery

1. Automated daily database backups configured (midnight UTC)
2. Backup retention policy implemented: 7 days for daily backups, 4 weeks for weekly
3. Backups stored in separate availability zone from primary database
4. Backup encryption configured (data at rest protection)
5. Automated backup health checks configured (verify backups complete successfully)
6. Backup restoration procedure documented and tested
7. Point-in-time recovery tested (restore database to specific timestamp)
8. Recovery time objective (RTO) measured and documented (< 1 hour target)
9. Recovery point objective (RPO) validated (< 24 hours data loss acceptable)
10. Automated alerts configured (backup failures notify team immediately)
11. Documentation: Database backup and recovery runbook

### Story 4.3: Error Tracking & Logging Infrastructure

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

### Story 4.4: Performance Monitoring & Uptime Tracking

1. Uptime monitoring service configured (Better Stack)
2. Monitors configured for critical endpoints: Homepage, Login, API health, Course catalog
3. Monitoring frequency: Every 3 minutes from multiple global locations
4. Incident detection threshold: 2 consecutive failures = downtime incident
5. Automated alerts configured (downtime → immediate, slow response → warning)
6. Performance monitoring configured (Vercel Analytics)
7. Metrics tracked: Page load times (p50, p95, p99), API response times, Core Web Vitals
8. Dashboard created: Uptime percentage, incident history, performance trends
9. SLA tracking: 99.5%+ uptime validated (7-day rolling average)
10. Performance baselines documented (current response times for comparison)
11. Documentation: Performance monitoring and incident response guide

### Story 4.5: Deployment Runbooks & Operational Procedures

1. Deployment runbook created (`docs/deployment-runbook.md`) with pre-deployment checklist, deployment steps, post-deployment validation, rollback procedure
2. Incident response playbook created (`docs/incident-response.md`) with severity classification, escalation procedures, common incidents and resolutions, post-incident review template
3. Troubleshooting guide created (`docs/troubleshooting.md`) with common errors and fixes, log access instructions, database diagnostic queries, performance debugging techniques
4. Monitoring dashboard guide created with metric interpretation, escalation thresholds, historical baseline comparisons
5. All runbooks peer-reviewed by team (ensure clarity and completeness)
6. Runbook tested via tabletop exercise (simulate incident, follow procedures)

### Story 4.6: Beta Tester Onboarding Materials

1. Beta welcome email drafted with welcome message, login credentials, timeline and expectations, support contact
2. Quick start guide created (`docs/beta-quick-start.md`) with login/navigation, course enrollment, content access, assignment submission, grade viewing, discussion participation
3. Video walkthrough recorded (5-10 minutes) with platform tour, student workflow demonstration, Q&A contact
4. Feedback survey prepared (Google Forms or Typeform) with satisfaction rating, feature usability, bug reporting, open-ended feedback
5. Beta testing checklist created with key workflows to test
6. All materials reviewed and approved by stakeholder

### Story 4.7: Production Readiness Validation & Launch

1. Production readiness checklist completed (all Epics 1-4 stories complete)
2. Pre-launch smoke tests executed in production (admin creates user, instructor creates course, student enrolls and submits, instructor grades)
3. Beta launch criteria validated: Uptime 99.5%+, page load < 2s, API < 500ms, security P0/P1 remediated, accessibility Lighthouse > 90, test coverage 70%+
4. Beta tester accounts created (1-10 student accounts, instructor accounts, admin accounts)
5. Welcome emails sent with credentials
6. Launch communication prepared (announcement, support contact, feedback process)
7. Go-live decision: Stakeholder approval obtained for beta launch

## Traceability Mapping

| AC ID | PRD Requirement | Tech Spec Section | Component/Service | Test Approach |
|-------|-----------------|-------------------|-------------------|---------------|
| 4.1.1 | NFR002 (99.5% uptime) | Architecture Alignment | Vercel Pro | Deployment verification |
| 4.1.2 | FR001 (PostgreSQL) | Data Models | Neon Production DB | Connection test |
| 4.1.3 | FR002 (S3/CDN) | Dependencies | Cloudflare R2 | Upload/download test |
| 4.1.5 | NFR004 (HTTPS) | Security | Vercel SSL/TLS | Certificate validation |
| 4.1.7 | NFR002 (reliability) | APIs | `/api/health/db` | Health check response |
| 4.1.10 | NFR002 (recovery) | Workflows | Vercel rollback | Rollback execution test |
| 4.2.1 | FR003 (daily backups) | Workflows | Neon automated | Backup completion check |
| 4.2.2 | FR003 (7-day retention) | Reliability | Neon Scale | Retention policy validation |
| 4.2.7 | FR003 (restore procedures) | Workflows | Neon PITR | Restore execution test |
| 4.2.8 | NFR002 (RTO < 1 hour) | Reliability | Neon restore | Timed restore test |
| 4.3.1 | FR022 (error tracking) | Services | Sentry | Error capture test |
| 4.3.4 | NFR005 (debugging) | Data Models | Sentry source maps | Stack trace validation |
| 4.3.6 | FR022 (alerting) | Observability | Sentry alerts | Alert trigger test |
| 4.4.1 | NFR002 (uptime monitoring) | Services | Better Stack | Monitor configuration |
| 4.4.4 | NFR002 (incident detection) | Workflows | Better Stack | Simulated downtime test |
| 4.4.6 | NFR001 (performance) | Services | Vercel Analytics | Metrics collection test |
| 4.4.8 | FR023 (dashboards) | Observability | Vercel/Better Stack | Dashboard verification |
| 4.5.1 | NFR005 (documentation) | Services | docs/deployment-runbook.md | Runbook review |
| 4.5.2 | NFR002 (incident response) | Services | docs/incident-response.md | Tabletop exercise |
| 4.6.1 | User Journey 1 (onboarding) | Services | Email template | Content review |
| 4.6.2 | User Journey 1 (enrollment) | Services | docs/beta-quick-start.md | User testing |
| 4.7.1 | All FRs/NFRs | All sections | All components | Checklist completion |
| 4.7.3 | NFR001, NFR002, NFR004 | Performance, Reliability | All monitoring | Metrics validation |
| 4.7.4 | User Journey 1 | Workflows | User accounts | Account creation test |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Vercel Pro plan costs exceed budget | Medium | Low | Monitor usage, optimize build times, use free tier for preview deployments |
| R2 | Neon Scale plan backups insufficient for compliance | Medium | Low | Validate backup retention meets requirements; upgrade to Enterprise if needed |
| R3 | Sentry free tier limits reached during beta | Low | Medium | Monitor quota usage; upgrade to Team plan ($29/mo) if 5K errors/month exceeded |
| R4 | Better Stack monitoring misses intermittent issues | Medium | Low | Configure 3-minute checks from multiple regions; add custom health checks |
| R5 | Production deployment breaks existing functionality | High | Low | Comprehensive E2E tests in CI/CD (Epic 3); rollback within 5 minutes |
| R6 | Beta testers encounter critical bugs on launch | High | Medium | Pre-launch smoke tests (Story 4.7); Sentry real-time alerting; rapid response |
| R7 | Custom domain DNS propagation delays launch | Low | Low | Configure domain 48-72 hours before launch; validate with dig/nslookup |
| R8 | Source maps expose sensitive code logic | Low | Low | Sentry access restricted to team; source maps not publicly accessible |
| R9 | Alert fatigue from too many notifications | Medium | Medium | Tune alert thresholds post-launch; implement alert grouping and deduplication |
| R10 | Database backup restore takes longer than RTO | Medium | Low | Test restore procedure monthly; document observed restore times |

### Assumptions

| ID | Assumption | Impact if Invalid |
|----|------------|-------------------|
| A1 | Vercel Pro plan sufficient for beta traffic (1-10 users) | May need to upgrade or optimize if performance issues arise |
| A2 | Neon Scale plan automated backups meet compliance needs | May need Enterprise plan or custom backup solution |
| A3 | Sentry free tier (5K errors/month) sufficient for beta | Upgrade to Team plan if error volume exceeds quota |
| A4 | Better Stack free tier (10 monitors) sufficient | Upgrade if more endpoints need monitoring |
| A5 | Custom domain `learn.aigurus.com` available and registered | Need to select alternative domain if unavailable |
| A6 | Beta testers have reliable internet and modern browsers | May need to provide system requirements or support older browsers |
| A7 | Single point of contact sufficient for beta support | May need to establish on-call rotation if issues frequent |
| A8 | Epic 1-3 stories completed before Epic 4 begins | Epic 4 cannot proceed without production-ready codebase |
| A9 | Stakeholder available for go-live approval decision | Launch may be delayed if approval not obtained |

### Open Questions

| ID | Question | Owner | Resolution Target |
|----|----------|-------|-------------------|
| Q1 | What is the exact production domain? (`learn.aigurus.com` assumed) | PM | Before Story 4.1 |
| Q2 | Who is the primary support contact for beta testers? | PM | Before Story 4.6 |
| Q3 | What is the target beta launch date? | PM | Before Story 4.7 |
| Q4 | Should we use Vercel Analytics or a third-party (Plausible, Fathom)? | Dev | Before Story 4.4 |
| Q5 | What Slack channel should receive alerts? | DevOps | Before Story 4.3 |
| Q6 | How many beta testers are confirmed (1-10 range)? | PM | Before Story 4.6 |
| Q7 | Should status page (`status.aigurus.com`) be public or private? | PM | Before Story 4.4 |
| Q8 | What is the escalation path if primary support unavailable? | PM | Before Story 4.5 |

## Test Strategy Summary

### Epic 4 Testing Approach

Epic 4 focuses on operational validation rather than feature testing (covered in Epics 1.5 and 3). Testing validates that production infrastructure is correctly configured and monitoring systems function as expected.

### Test Types by Story

| Story | Test Type | Validation Method |
|-------|-----------|-------------------|
| 4.1 | Infrastructure | Manual deployment verification, health check response |
| 4.2 | Operational | Backup completion check, restore procedure execution |
| 4.3 | Integration | Trigger test error, verify Sentry capture and alert |
| 4.4 | Operational | Simulate downtime, verify alert received within SLA |
| 4.5 | Documentation | Peer review, tabletop exercise |
| 4.6 | User Acceptance | Beta tester feedback on onboarding materials |
| 4.7 | Smoke Tests | End-to-end production workflow validation |

### Production Smoke Test Suite

```typescript
// Production smoke tests (manual execution)
// Execute after each production deployment

1. Health Check
   - GET /api/health/db → Expect 200 OK
   - Verify database connection status

2. Authentication
   - Navigate to /login
   - Login with test credentials
   - Verify dashboard loads

3. Course Access
   - View course catalog
   - Access course detail page
   - Verify content loads

4. File Upload
   - Upload test file (instructor role)
   - Verify file accessible via CDN URL

5. Grading
   - Access gradebook
   - Verify student data loads
   - Test inline grade edit

6. Error Tracking
   - Trigger test error (dev tools)
   - Verify error appears in Sentry within 5 minutes

7. Performance
   - Check Vercel Analytics dashboard
   - Verify Core Web Vitals within targets
```

### Monitoring Validation Tests

| Test | Trigger | Expected Outcome |
|------|---------|------------------|
| Uptime alert | Stop health endpoint (simulated) | Better Stack alert within 6 minutes |
| Error alert | Throw unhandled exception | Sentry notification within 5 minutes |
| Slow response alert | Introduce artificial delay (5s) | Warning notification |
| Backup validation | Check Neon dashboard | Backup present for previous day |

### Go/No-Go Criteria for Epic 4 Completion

| Criteria | Threshold | Blocking |
|----------|-----------|----------|
| Production deployment successful | Application accessible | Yes |
| Health check passing | 200 OK response | Yes |
| Database connection verified | Queries execute | Yes |
| File storage operational | Upload/download works | Yes |
| Sentry receiving errors | Test error captured | Yes |
| Uptime monitoring active | Monitors green | Yes |
| Backup configured | Daily backup visible | Yes |
| Runbooks complete | Peer-reviewed | Yes |
| Onboarding materials ready | Stakeholder approved | Yes |
| Smoke tests passing | All 7 scenarios pass | Yes |
| Stakeholder approval | Go-live decision | Yes |

### Post-Launch Validation

**Day 1 Checklist:**
- [ ] All monitoring dashboards accessible
- [ ] No P0/P1 errors in Sentry
- [ ] Uptime at 100% since launch
- [ ] Beta testers successfully logged in
- [ ] Feedback survey link working

**Week 1 Metrics:**
- Uptime: Target 99.5%+
- Error rate: Baseline established
- Page load: < 2s p95
- API response: < 500ms p95
- Beta tester engagement: Track daily active users

---

**Document Status:** Complete
**Generated:** 2025-11-27
**Epic:** 4 - Production Deployment & Monitoring
**Next Steps:** Validate against checklist, mark epic as contexted in sprint-status.yaml
