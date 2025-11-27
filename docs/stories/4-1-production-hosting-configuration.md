# Story 4.1: Production Hosting Configuration

Status: ready-for-dev

## Story

As a DevOps engineer,
I want production hosting infrastructure configured and operational,
so that the platform can serve beta users with enterprise-grade reliability.

## Acceptance Criteria

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

## Tasks / Subtasks

### Task 1: Provision Vercel Pro Production Environment (AC: #1, #4, #5)

- [ ] **Subtask 1.1:** Upgrade Vercel project from Hobby to Pro plan
  - Navigate to Vercel project settings → Billing
  - Upgrade to Pro plan ($20/month)
  - Verify Pro features enabled (Analytics, enhanced compute)
- [ ] **Subtask 1.2:** Configure production environment variables in Vercel dashboard
  - Navigate to Settings → Environment Variables
  - Set variables for "Production" environment only:
    - `DATABASE_URL` (Neon production connection string)
    - `DIRECT_URL` (Neon direct connection for migrations)
    - `NEXTAUTH_URL` (https://learn.aigurus.com)
    - `NEXTAUTH_SECRET` (generate new 32-char secret for production)
    - `CLOUDFLARE_R2_ENDPOINT` (production endpoint)
    - `CLOUDFLARE_R2_ACCESS_KEY_ID` (production key)
    - `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (production secret)
    - `R2_PUBLIC_BUCKET` (ai-gurus-public-prod)
    - `R2_PRIVATE_BUCKET` (ai-gurus-private-prod)
    - `R2_PUBLIC_CDN_URL` (production CDN URL)
    - `UPSTASH_REDIS_REST_URL` (production Upstash instance)
    - `UPSTASH_REDIS_REST_TOKEN` (production token)
    - `NODE_ENV=production`
    - `LOG_LEVEL=info`
- [ ] **Subtask 1.3:** Configure custom domain and SSL/TLS
  - Navigate to Settings → Domains
  - Add custom domain: `learn.aigurus.com`
  - Configure DNS records (A/CNAME records per Vercel instructions)
  - Verify SSL certificate auto-provisioned (Let's Encrypt)
  - Enable HTTPS redirect (HTTP → HTTPS automatic)
  - Verify HSTS header configuration in `next.config.js`
- [ ] **Subtask 1.4:** Verify Vercel project configuration
  - Framework preset: Next.js
  - Build command: `npm run build` (default)
  - Output directory: `.next` (default)
  - Install command: `npm ci` (default)
  - Node.js version: 20.x
  - Region: Washington, D.C., USA (iad1) or closest to target users

### Task 2: Provision Neon PostgreSQL Production Database (AC: #2, #8)

- [ ] **Subtask 2.1:** Create Neon production instance
  - Navigate to Neon dashboard → Create New Project
  - Project name: `ai-gurus-lms-production`
  - Region: Select same region as Vercel (iad1 - US East)
  - Compute tier: Scale plan ($19/month for automated backups)
  - Storage: Auto-scaling (starts at minimum, grows as needed)
- [ ] **Subtask 2.2:** Configure connection pooling
  - Neon automatically provides connection pooling
  - Verify connection string format: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`
  - Note: Neon uses `?sslmode=require` for TLS encryption
  - Copy "Pooled connection" string for `DATABASE_URL`
  - Copy "Direct connection" string for `DIRECT_URL` (used for migrations)
- [ ] **Subtask 2.3:** Apply database migrations to production
  - Set production `DATABASE_URL` in local environment (temporarily)
  - Run: `npx prisma migrate deploy` (applies all pending migrations)
  - Verify all migrations applied successfully
  - Check migration status: `npx prisma migrate status`
  - Remove temporary production `DATABASE_URL` from local environment
- [ ] **Subtask 2.4:** Verify database connection and queries
  - Use Neon SQL Editor to test connection
  - Run test query: `SELECT COUNT(*) FROM "User";` (should return 0 or existing count)
  - Verify all tables exist per Prisma schema
  - Test query execution time (should be < 100ms for simple queries)

### Task 3: Configure Cloudflare R2 Production Storage (AC: #3, #9)

- [ ] **Subtask 3.1:** Create production R2 buckets
  - Navigate to Cloudflare dashboard → R2 → Create Bucket
  - Create public bucket: `ai-gurus-public-prod`
  - Create private bucket: `ai-gurus-private-prod`
  - Configure CORS for public bucket (allow GET from custom domain)
  - Disable CORS for private bucket (signed URLs only)
- [ ] **Subtask 3.2:** Generate production R2 access credentials
  - Navigate to R2 → Manage R2 API Tokens
  - Create new API token: `ai-gurus-lms-production`
  - Permissions: Read and Write
  - Scope: Buckets `ai-gurus-public-prod` and `ai-gurus-private-prod`
  - Copy Access Key ID and Secret Access Key (store securely)
  - Add credentials to Vercel environment variables
- [ ] **Subtask 3.3:** Configure public CDN domain (optional for MVP)
  - Option A: Use default R2 domain (`https://pub-xxxxx.r2.dev`)
  - Option B: Configure custom domain (`https://cdn.aigurus.com`)
  - If custom domain: Add CNAME record, enable in R2 settings
  - Set `R2_PUBLIC_CDN_URL` environment variable
- [ ] **Subtask 3.4:** Test R2 storage access
  - Upload test file to public bucket (via R2 dashboard)
  - Verify file accessible via CDN URL
  - Upload test file to private bucket
  - Generate signed URL (using `/api/upload/signed-url` endpoint)
  - Verify file accessible via signed URL
  - Verify signed URL expires after configured time

### Task 4: Deploy Application to Production (AC: #6, #7)

- [ ] **Subtask 4.1:** Trigger production deployment
  - Option A: Push to main branch (automatic deployment via GitHub integration)
  - Option B: Manual deploy via Vercel CLI: `vercel --prod`
  - Monitor deployment logs in Vercel dashboard
  - Verify build completes successfully (no errors)
  - Note deployment URL and timestamp
- [ ] **Subtask 4.2:** Verify production deployment
  - Navigate to production URL: `https://learn.aigurus.com`
  - Verify homepage loads successfully
  - Check browser console for errors (should be none)
  - Verify assets load (images, fonts, CSS)
  - Test navigation to key pages: `/login`, `/courses`, `/dashboard`
- [ ] **Subtask 4.3:** Test health check endpoint
  - Navigate to: `https://learn.aigurus.com/api/health/db`
  - Verify response:
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2025-11-27T10:00:00.000Z",
      "responseTime": "XXms"
    }
    ```
  - Verify HTTP status: 200 OK
  - Verify response time < 500ms
  - Test multiple times to ensure consistency
- [ ] **Subtask 4.4:** Validate database connection in production
  - Login to application with test credentials
  - Create test user (admin or instructor role)
  - Verify user appears in database (Neon SQL Editor)
  - Test course creation (if instructor account)
  - Verify course data persisted in database
  - Delete test data if needed (keep environment clean)

### Task 5: Test Production File Upload/Download (AC: #9)

- [ ] **Subtask 5.1:** Test file upload flow
  - Login as instructor
  - Navigate to course content editor
  - Upload test file (image or PDF)
  - Verify file upload completes successfully
  - Verify file stored in R2 bucket (check R2 dashboard)
  - Note R2 key and file size
- [ ] **Subtask 5.2:** Test file download flow
  - Access uploaded file via application
  - Verify file downloads successfully
  - Verify correct MIME type and file size
  - Test private file access (assignment submission)
  - Verify signed URL generates correctly
  - Verify signed URL expires after configured time (1 hour)

### Task 6: Test Rollback Procedure (AC: #10)

- [ ] **Subtask 6.1:** Document current deployment state
  - Note current deployment ID (from Vercel dashboard)
  - Note git commit hash
  - Take screenshot of production homepage
  - Record timestamp
- [ ] **Subtask 6.2:** Execute rollback to previous deployment
  - Navigate to Vercel dashboard → Deployments
  - Find previous successful deployment
  - Click "⋯" menu → "Promote to Production"
  - Monitor rollback progress
  - Verify rollback completes successfully
- [ ] **Subtask 6.3:** Verify rollback functionality
  - Navigate to production URL
  - Verify application still functional
  - Test health check endpoint
  - Measure rollback time (target: < 5 minutes)
  - Document rollback procedure in runbook
- [ ] **Subtask 6.4:** Restore to latest deployment
  - Promote latest deployment back to production
  - Verify application returns to current state
  - Confirm rollback procedure works in both directions

### Task 7: Create Production Hosting Documentation (AC: #11)

- [ ] **Subtask 7.1:** Create production hosting setup guide
  - Document file: `/docs/production-hosting-setup.md`
  - Include sections:
    - Prerequisites (accounts, credentials)
    - Vercel Pro setup instructions
    - Neon production database setup
    - Cloudflare R2 configuration
    - Environment variables checklist
    - Custom domain configuration
    - SSL/TLS certificate validation
    - Deployment procedures (manual and automatic)
    - Rollback procedures
    - Troubleshooting common issues
- [ ] **Subtask 7.2:** Create production architecture diagram
  - Create diagram showing:
    - User → Vercel Edge Network → Next.js App
    - Next.js App → Neon PostgreSQL (connection pooling)
    - Next.js App → Cloudflare R2 (file storage)
    - Next.js App → Upstash Redis (rate limiting)
    - Monitoring services: Sentry, Vercel Analytics, Better Stack
  - Save as: `/docs/diagrams/production-architecture.svg` (or .png)
  - Include in production hosting setup guide
- [ ] **Subtask 7.3:** Document environment variables
  - Create: `/docs/environment-variables-production.md`
  - List all required variables with descriptions
  - Mark sensitive variables (never commit to repo)
  - Document how to rotate secrets safely
  - Include examples (with placeholder values)
  - Document differences between dev/preview/production environments

## Dev Notes

### Architecture Patterns and Constraints

**Hosting Architecture:**
- Vercel edge deployment with automatic scaling
- Zero-downtime deployments (atomic deployments)
- Automatic preview deployments for all PRs
- Production deployments from main branch only
- Custom domain with automatic SSL/TLS (Let's Encrypt)

**Database Architecture:**
- Neon serverless PostgreSQL with connection pooling
- Separate connection strings for application queries (`DATABASE_URL`) and migrations (`DIRECT_URL`)
- TLS encryption enforced (`?sslmode=require`)
- Database branching available for testing (not used for production deployment)
- Point-in-time restore available (configured in Story 4.2)

**File Storage Architecture:**
- Cloudflare R2 S3-compatible storage
- Public bucket for course content (CDN-enabled)
- Private bucket for submissions (signed URLs only)
- Zero egress fees (unlimited downloads)
- CORS configured for public bucket only

**Security Configuration:**
- All secrets managed via Vercel environment variables (encrypted at rest)
- HTTPS enforced (automatic redirect from HTTP)
- Security headers configured in `next.config.js` (HSTS, CSP, X-Frame-Options)
- No hardcoded secrets in codebase
- Production secrets separate from preview/development

### Source Tree Components to Touch

**Files to Review (No Changes Required):**
- `/src/app/api/health/db/route.ts` - Health check endpoint (already implemented)
- `/src/lib/prisma.ts` - Prisma client with connection pooling
- `/src/lib/r2.ts` - Cloudflare R2 client configuration
- `/next.config.js` - Security headers configuration
- `/prisma/schema.prisma` - Database schema
- `/prisma/migrations/` - All migration files (apply to production)

**Files to Create:**
- `/docs/production-hosting-setup.md` - Production setup guide
- `/docs/environment-variables-production.md` - Environment variables reference
- `/docs/diagrams/production-architecture.svg` - Architecture diagram

**External Configurations:**
- Vercel project settings (via dashboard)
- Neon database configuration (via dashboard)
- Cloudflare R2 buckets and credentials (via dashboard)
- DNS configuration for custom domain (registrar/Cloudflare)

### Testing Standards Summary

**Smoke Tests (Manual):**
1. **Health Check Test:**
   - GET `/api/health/db` → 200 OK
   - Verify database connection status
   - Check response time < 500ms

2. **Authentication Test:**
   - Navigate to `/login`
   - Login with test credentials
   - Verify dashboard loads
   - Verify session persists

3. **Course Access Test:**
   - Navigate to `/courses`
   - View course catalog
   - Access course detail page
   - Verify content loads

4. **File Upload Test:**
   - Upload test file (instructor role)
   - Verify file accessible via CDN
   - Test private file signed URL

5. **Database Query Test:**
   - Create test user
   - Verify data persisted
   - Query from Neon SQL Editor

**Performance Tests:**
- Page load time < 2 seconds (p95)
- API response time < 500ms (p95)
- Health check response time < 200ms

**Rollback Test:**
- Rollback to previous deployment
- Verify application still functional
- Measure rollback time (target: < 5 minutes)
- Restore to latest deployment

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Follows architecture.md deployment architecture (Vercel + Neon + R2)
- Uses existing health check endpoint from Epic 1
- Environment variables match tech-spec-epic-4.md specifications
- Production URL matches PRD requirements: `learn.aigurus.com`
- Security headers configuration per architecture.md

**Detected Conflicts or Variances:**
- None detected. Story aligns with existing infrastructure from Epic 1.
- Health check endpoint already operational (Story 1.1)
- Database schema migrations already exist (Story 1.2)
- R2 storage already configured (Stories 1.4-1.6)
- Rate limiting already configured (Story 1.7)

**Notes on Production vs. Development:**
- Development uses free tiers or local alternatives (SQLite)
- Production uses paid tiers for reliability (Vercel Pro, Neon Scale)
- Environment variables differ between environments (managed via Vercel)
- Production enforces HTTPS, development runs HTTP on localhost
- Production uses production R2 buckets with separate credentials

### References

- [Source: docs/tech-spec-epic-4.md#Story 4.1: Production Hosting Configuration]
  - Production hosting platform: Vercel Pro ($20/month)
  - PostgreSQL: Neon Scale ($19/month)
  - File storage: Cloudflare R2 (production buckets)
  - Custom domain: learn.aigurus.com
  - Environment variables configuration

- [Source: docs/tech-spec-epic-4.md#Environment Variables Configuration]
  - Complete list of required environment variables
  - Database connection strings (pooled and direct)
  - Authentication secrets (NEXTAUTH_URL, NEXTAUTH_SECRET)
  - R2 credentials and bucket names
  - Monitoring configuration (Sentry DSN)

- [Source: docs/tech-spec-epic-4.md#Deployment Workflow]
  - Production deployment flow (GitHub → Vercel)
  - Post-deployment validation checklist
  - Rollback procedure (Vercel dashboard)

- [Source: docs/architecture.md#Deployment Architecture]
  - Hosting: Vercel (makers of Next.js)
  - Database: Neon PostgreSQL (serverless)
  - File Storage: Cloudflare R2 (S3-compatible)
  - Environment tiers: Development, Preview, Production
  - Deployment workflow: Automatic via GitHub integration

- [Source: docs/architecture.md#Security Architecture]
  - Security headers configuration (next.config.js)
  - HTTPS enforcement (Vercel automatic)
  - Secrets management (Vercel environment variables)
  - TLS encryption (database and storage)

- [Source: src/app/api/health/db/route.ts]
  - Health check endpoint implementation
  - Returns status, database connection, timestamp, response time
  - Returns 200 OK when healthy, 503 when unhealthy

## Dev Agent Record

### Context Reference

`/Users/eddyh/Documents/2025/Q3/Projects/Vibe Tribe/Vibe Tribe/AI GURUS v12claude/ai-gurus-lms/docs/stories/4-1-production-hosting-configuration.context.xml`

### Agent Model Used

<!-- To be filled by dev agent when work begins -->

### Debug Log References

<!-- To be filled by dev agent during implementation -->

### Completion Notes List

<!-- To be filled by dev agent upon completion -->
- [ ] Vercel Pro plan activated and production environment configured
- [ ] Neon production database created and migrations applied
- [ ] Cloudflare R2 production buckets configured with access controls
- [ ] Environment variables set in Vercel for production
- [ ] Custom domain configured with SSL/TLS certificates (HTTPS enforced)
- [ ] Production deployment successful and application accessible
- [ ] Health check endpoint operational and returning 200 OK
- [ ] Database connection verified and queries executing successfully
- [ ] File upload/download verified in production environment
- [ ] Rollback procedure tested and documented (< 5 minutes)
- [ ] Production hosting setup guide created
- [ ] Production architecture diagram created

### File List

<!-- To be filled by dev agent - list of files created/modified -->
**Created Files:**
- `/docs/production-hosting-setup.md` - Production hosting setup guide
- `/docs/environment-variables-production.md` - Environment variables reference
- `/docs/diagrams/production-architecture.svg` - Production architecture diagram

**Modified Files:**
- None (infrastructure configuration only)

**External Configurations:**
- Vercel project: Upgraded to Pro plan, environment variables configured
- Neon database: Production instance created, migrations applied
- Cloudflare R2: Production buckets created, credentials generated
- DNS: Custom domain configured for learn.aigurus.com
