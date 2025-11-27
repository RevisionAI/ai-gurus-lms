# Epic Technical Specification: Infrastructure Foundation & Security Hardening

Date: 2025-11-24
Author: Ed
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 transforms the AI Gurus LMS from a development prototype into a production-ready platform by replacing development-grade infrastructure (SQLite database, local file storage) with enterprise-grade solutions (PostgreSQL, S3/CDN) and implementing essential security protections. This epic establishes the mandatory foundation for safe beta deployment, addressing the critical production blockers that currently prevent the platform from reliably serving even 10 SME executive testers. The work encompasses 10 stories spanning database migration with full data integrity validation, scalable file storage with CDN delivery, and comprehensive security hardening (rate limiting, input validation, soft deletes) required to achieve the PRD's target of 99.5%+ uptime and zero security incidents.

## Objectives and Scope

**In Scope:**
- ✅ PostgreSQL database provisioning and configuration with connection pooling
- ✅ Complete Prisma schema migration from SQLite to PostgreSQL (10 models, 25 relations)
- ✅ Data integrity validation suite with rollback procedures
- ✅ S3-compatible cloud storage setup with CDN (Cloudflare R2)
- ✅ File upload API migration and existing file migration to S3
- ✅ API rate limiting implementation (100 req/min per IP, 200 req/min per user)
- ✅ Input validation with Zod schemas for all POST/PUT/DELETE endpoints
- ✅ Soft deletes with audit trail (User, Course, Assignment, Grade, Discussion models)
- ✅ Security audit preparation (OWASP Top 10 review, secrets audit, CSP headers)
- ✅ Comprehensive documentation (setup guides, rollback procedures, troubleshooting)

**Out of Scope:**
- ❌ Complete gradebook grid view (Epic 2: Feature Completion)
- ❌ GPA calculation implementation (Epic 2)
- ❌ Admin dashboard enhancements (Epic 2)
- ❌ E2E testing infrastructure (Epic 1.5: Testing Infrastructure, runs concurrent)
- ❌ Performance optimization (Epic 3/4: addressed during testing and deployment)
- ❌ Accessibility compliance validation (Epic 3: E2E Testing & Quality Validation)
- ❌ Production deployment to Vercel (Epic 4: Production Deployment & Monitoring)

**Success Criteria:**
- PostgreSQL operational with 100% data integrity validated
- All uploaded files stored in S3/CDN with zero local filesystem dependencies
- Rate limiting active preventing DoS attacks (validated via load testing)
- Input validation preventing injection attacks (validated via security tests)
- Soft deletes maintaining audit trail for compliance
- Development environment fully functional on production infrastructure
- Zero P0/P1 security vulnerabilities identified in security audit preparation

## System Architecture Alignment

**Database Architecture (Architecture Section 6):**
- Aligns with Neon PostgreSQL decision (serverless, auto-scaling, free tier for beta)
- Implements Prisma ORM with connection pooling (`connection_limit` configuration)
- Supports 10 existing data models with 25 relations without schema redesign
- Maintains existing soft delete pattern with `deletedAt` timestamp field

**File Storage Architecture (Architecture Section 9):**
- Aligns with Cloudflare R2 decision (S3-compatible, zero egress fees, 10GB free tier)
- Implements signed URL generation for secure direct uploads (client → S3)
- Supports CDN delivery for fast global content distribution
- Maintains existing file metadata storage pattern in Prisma (filename, size, MIME type, S3 key)

**Security Architecture (Architecture Section 8):**
- Implements rate limiting via Upstash Rate Limit (serverless Redis, Vercel Edge compatible)
- Implements input validation via Zod schemas (TypeScript-first, prevents injection attacks)
- Maintains existing NextAuth authentication with database sessions (Prisma adapter)
- Implements OWASP Top 10 protections (CSP headers, HTTPS enforcement, secrets management)

**Constraints:**
- Must preserve existing Next.js 15 + React 19 + Prisma codebase (brownfield constraint)
- Must achieve zero downtime migration (requires careful data migration and rollback planning)
- Must fit within free tier costs for beta ($0/month across Neon, R2, Upstash, Vercel)
- Must complete within 3-week timeline (Weeks 1-3 of 10-week schedule)
- Must enable concurrent Epic 1.5 (Testing Infrastructure) starting Week 2

## Detailed Design

### Services and Modules

| Module/Service | Responsibility | Inputs | Outputs | Owner/Story |
|----------------|----------------|--------|---------|-------------|
| **Prisma Client** (`/src/lib/prisma.ts`) | Database connection management, query execution, connection pooling | Database URL, connection options | PrismaClient instance | Story 1.1, 1.2 |
| **R2 Storage Client** (`/src/lib/r2.ts`) | S3-compatible file storage operations, signed URL generation | R2 credentials, bucket name | Upload URLs, file keys, CDN URLs | Story 1.4, 1.5 |
| **Rate Limiter** (`/src/lib/rate-limit.ts`) | Request throttling, abuse prevention | IP address, user ID, route | Allow/deny decision, remaining quota | Story 1.7 |
| **Input Validators** (`/src/validators/`) | API request validation, sanitization | Request body/query | Validated data or error | Story 1.8 |
| **Logger** (`/src/lib/logger.ts`) | Structured logging, error tracking | Log level, message, context | Formatted logs to stdout | Story 1.1 |
| **Migration Scripts** (`/scripts/`) | Data migration automation | Source DB, target DB | Migration status, validation results | Story 1.3, 1.6 |
| **Health Check API** (`/src/app/api/health/`) | System health monitoring | - | Database status, service status | Story 1.1 |
| **Upload API** (`/src/app/api/upload/`) | File upload coordination | Files, metadata | S3 keys, CDN URLs | Story 1.5 |
| **Middleware Pipeline** (`/src/middleware.ts`) | Request preprocessing, rate limiting, logging | HTTP request | Modified request or rejection | Story 1.7 |

**Module Interactions:**
- All API routes → Prisma Client (database queries)
- Upload API → R2 Storage Client (file operations)
- Middleware → Rate Limiter (every request)
- API routes → Input Validators (POST/PUT/DELETE)
- All modules → Logger (error/info logging)

### Data Models and Contracts

**Updated Prisma Models (Story 1.2, 1.9):**

```prisma
// User model with soft delete
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(STUDENT)
  password      String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Story 1.9: Soft delete field

  // Relations
  enrollments   Enrollment[]
  submissions   Submission[]
  grades        Grade[]      @relation("GradedByUser")
  posts         DiscussionPost[]
  courses       Course[]     @relation("Instructor")

  @@index([email])
  @@index([deletedAt]) // Story 1.9: Index for filtering soft-deleted
}

// Course model with soft delete
model Course {
  id            String    @id @default(cuid())
  code          String    @unique
  title         String
  description   String
  semester      String
  active        Boolean   @default(true)
  thumbnailUrl  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Story 1.9: Soft delete field

  instructorId  String
  instructor    User      @relation("Instructor", fields: [instructorId], references: [id])

  // Relations
  enrollments   Enrollment[]
  content       CourseContent[]
  assignments   Assignment[]
  discussions   Discussion[]
  announcements Announcement[]

  @@index([instructorId])
  @@index([deletedAt])
}

// Assignment model with soft delete
model Assignment {
  id            String    @id @default(cuid())
  title         String
  description   String
  dueDate       DateTime
  points        Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Story 1.9: Soft delete field

  courseId      String
  course        Course    @relation(fields: [courseId], references: [id])

  // Relations
  submissions   Submission[]

  @@index([courseId])
  @@index([deletedAt])
}

// Grade model with soft delete
model Grade {
  id            String    @id @default(cuid())
  score         Float
  feedback      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Story 1.9: Soft delete field

  submissionId  String    @unique
  submission    Submission @relation(fields: [submissionId], references: [id])

  gradedById    String
  gradedBy      User      @relation("GradedByUser", fields: [gradedById], references: [id])

  @@index([gradedById])
  @@index([deletedAt])
}
```

**File Metadata Schema (Story 1.5):**

```typescript
interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  cdnUrl: string;
  uploadedAt: Date;
  uploadedById: string;
}
```

**Database Connection Configuration (Story 1.1):**

```typescript
// /src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Story 1.1: Connection pooling configuration
  connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### APIs and Interfaces

**New/Modified API Endpoints:**

| Endpoint | Method | Purpose | Request Schema | Response Schema | Story |
|----------|--------|---------|----------------|-----------------|-------|
| `/api/health/db` | GET | Database health check | - | `{ status: "healthy" \| "unhealthy", latency: number }` | 1.1 |
| `/api/upload` | POST | Generate signed upload URL | `{ filename: string, mimeType: string, size: number }` | `{ uploadUrl: string, key: string }` | 1.5 |
| `/api/upload/callback` | POST | Finalize upload after S3 | `{ key: string, metadata: FileMetadata }` | `{ cdnUrl: string, id: string }` | 1.5 |
| `/api/files/[key]` | GET | Retrieve file metadata | - | `FileMetadata` | 1.5 |
| All POST/PUT/DELETE | * | Input validation | Validated via Zod | `400 Bad Request` on validation failure | 1.8 |

**Zod Validation Schemas (Story 1.8):**

```typescript
// /src/validators/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
});

export const updateUserSchema = createUserSchema.partial();

// /src/validators/course.ts
export const createCourseSchema = z.object({
  code: z.string().regex(/^[A-Z]{2,4}-\d{3,4}$/),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  semester: z.string().regex(/^(Spring|Summer|Fall|Winter) \d{4}$/),
  thumbnailUrl: z.string().url().optional(),
});

// /src/validators/assignment.ts
export const createAssignmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  dueDate: z.string().datetime(),
  points: z.number().int().min(1).max(1000),
  courseId: z.string().cuid(),
});
```

**Rate Limiting Configuration (Story 1.7):**

```typescript
// /src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Per-IP rate limit: 100 requests/minute
export const ipRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ip',
});

// Per-user rate limit: 200 requests/minute
export const userRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(200, '1 m'),
  analytics: true,
  prefix: 'ratelimit:user',
});

// Strict login rate limit: 5 attempts per 15 minutes
export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});
```

### Workflows and Sequencing

**Database Migration Workflow (Stories 1.1-1.3):**

```
1. Story 1.1: PostgreSQL Setup
   ├─ Provision Neon PostgreSQL instance
   ├─ Configure environment variables (DATABASE_URL, DIRECT_URL)
   ├─ Test connection from development environment
   └─ Create health check endpoint

2. Story 1.2: Schema Migration
   ├─ Update prisma/schema.prisma (provider: "postgresql")
   ├─ Generate migration files (prisma migrate dev)
   ├─ Apply migrations to PostgreSQL
   ├─ Verify schema integrity (tables, indexes, constraints)
   └─ Update local development to use PostgreSQL

3. Story 1.3: Data Migration & Validation
   ├─ Create migration script (scripts/migrate-to-postgres.ts)
   ├─ Backup SQLite database
   ├─ Migrate data model-by-model (User → Course → Enrollment → ...)
   ├─ Validate data integrity (row counts, checksums)
   ├─ Test rollback procedure
   └─ Document go/no-go criteria
```

**File Storage Migration Workflow (Stories 1.4-1.6):**

```
1. Story 1.4: S3 Storage Setup
   ├─ Provision Cloudflare R2 bucket
   ├─ Configure CORS and access policies
   ├─ Configure CDN distribution
   ├─ Store credentials in environment variables
   └─ Test basic upload/download

2. Story 1.5: Upload API Migration
   ├─ Create R2 client (/src/lib/r2.ts)
   ├─ Implement signed URL generation
   ├─ Update file upload API routes
   ├─ Add file metadata storage in database
   ├─ Test upload workflows (course content, assignments)
   └─ Verify CDN URL generation

3. Story 1.6: Existing File Migration
   ├─ Create file migration script (scripts/migrate-files-to-r2.ts)
   ├─ Scan local uploads directory
   ├─ Upload files to R2 with progress tracking
   ├─ Update database file references
   ├─ Verify all files accessible via CDN URLs
   ├─ Archive local files as backup
   └─ Test file retrieval in application
```

**Security Hardening Workflow (Stories 1.7-1.10):**

```
1. Story 1.7: Rate Limiting
   ├─ Install Upstash Rate Limit library
   ├─ Configure Redis connection (Upstash)
   ├─ Create rate limit utilities (/src/lib/rate-limit.ts)
   ├─ Add middleware for IP and user rate limiting
   ├─ Implement strict login rate limiting
   ├─ Test rate limits with load testing tool
   └─ Configure monitoring/alerting

2. Story 1.8: Input Validation
   ├─ Install Zod library
   ├─ Create validation schemas (/src/validators/)
   ├─ Integrate validators into API routes
   ├─ Test validation with invalid inputs
   ├─ Verify XSS prevention (HTML sanitization)
   └─ Document validation patterns

3. Story 1.9: Soft Deletes
   ├─ Add deletedAt fields to models (User, Course, Assignment, Grade, Discussion)
   ├─ Generate migration for schema changes
   ├─ Update all Prisma queries to filter deletedAt: null
   ├─ Replace hard deletes with soft deletes
   ├─ Implement cascade soft delete logic
   ├─ Add admin UI for viewing deleted records
   └─ Document data retention policy

4. Story 1.10: Security Audit Preparation
   ├─ Complete OWASP Top 10 checklist
   ├─ Audit authentication/authorization flows
   ├─ Scan for hardcoded secrets
   ├─ Configure CSP headers
   ├─ Verify HTTPS enforcement
   ├─ Prepare security audit scope document
   └─ Document all security controls
```

**Parallel Execution (Week 2-3):**
- Epic 1 Stories 1.7-1.10 can run concurrently after database/storage migrations complete
- Epic 1.5 (Testing Infrastructure) starts Week 2, runs parallel to Epic 1 completion

## Non-Functional Requirements

### Performance

**NFR001 Targets (PRD):**
- Page load time: < 2 seconds (p95)
- API response time: < 500ms (p95)
- Lighthouse score: > 80 across all metrics

**Epic 1 Performance Considerations:**

| Component | Performance Requirement | Implementation | Measurement |
|-----------|------------------------|----------------|-------------|
| **Database Queries** | < 100ms query latency (p95) | Neon PostgreSQL with connection pooling, indexed queries | Prisma query logs, Neon dashboard |
| **File Upload** | < 5 seconds for 10MB file | Direct S3 upload via signed URLs (client → R2, bypassing server) | Upload completion time tracking |
| **Rate Limiter** | < 10ms overhead per request | Upstash Redis on Vercel Edge (co-located with app) | Middleware timing logs |
| **Input Validation** | < 5ms validation overhead | Zod schema validation (TypeScript-native, no runtime parsing) | API route timing logs |
| **Connection Pooling** | Reuse connections, avoid cold starts | Prisma connection pool (limit: 10 connections) | Connection metrics in Neon |

**Architecture Section 17 Alignment:**
- Image optimization via Next.js Image component (not Epic 1 scope)
- Code splitting for large components (not Epic 1 scope)
- Database query optimization (N+1 prevention via Prisma includes)

**Performance Baselines (Story 1.3):**
- Establish baseline query response times during data migration validation
- Document baseline for comparison during Epic 3 performance testing

### Security

**NFR004 Targets (PRD):**
- Pass external security audit (all P0/P1 vulnerabilities remediated)
- OWASP Top 10 protections implemented
- Encryption for data at rest and in transit

**Epic 1 Security Implementation:**

| Security Control | OWASP Category | Implementation | Story |
|------------------|----------------|----------------|-------|
| **Rate Limiting** | A05: Security Misconfiguration | 100 req/min per IP, 200 req/min per user, 5 login attempts per 15 min | 1.7 |
| **Input Validation** | A03: Injection | Zod schemas on all POST/PUT/DELETE, XSS prevention via sanitization | 1.8 |
| **Authentication** | A07: Identification & Authentication | NextAuth with database sessions, 30-day session, 7-day idle timeout | Existing |
| **Authorization** | A01: Broken Access Control | Role-based access control (Student, Instructor, Admin) via middleware | Existing |
| **Soft Deletes** | A09: Security Logging Failures | Audit trail via deletedAt timestamps, 1-year retention | 1.9 |
| **Secrets Management** | A02: Cryptographic Failures | Environment variables only, no hardcoded credentials | 1.10 |
| **HTTPS Enforcement** | A02: Cryptographic Failures | Vercel auto-redirects HTTP → HTTPS | 1.10 |
| **CSP Headers** | A05: Security Misconfiguration | Content Security Policy headers configured in next.config.js | 1.10 |
| **File Upload Security** | A04: Insecure Design | MIME type validation, size limits, signed URLs with expiration | 1.5 |
| **SQL Injection** | A03: Injection | Prisma parameterized queries (ORM prevents raw SQL) | Existing |

**Security Audit Preparation (Story 1.10):**
- OWASP Top 10 checklist completed
- Security audit scope document prepared
- Authentication/authorization flows reviewed
- Secrets audit conducted (no hardcoded credentials)

**Data Encryption:**
- **In Transit:** TLS 1.3 via Vercel (automatic)
- **At Rest:** Neon PostgreSQL encrypts data at rest (automatic), R2 server-side encryption (automatic)

### Reliability/Availability

**NFR002 Targets (PRD):**
- 99.5%+ uptime during production operation
- Automated monitoring and alerting for critical errors

**Epic 1 Reliability Design:**

| Component | Availability Target | Failure Mode | Mitigation |
|-----------|-------------------|--------------|------------|
| **PostgreSQL Database** | 99.99% (Neon SLA) | Database unavailable | Connection retry logic, health check endpoint (`/api/health/db`) |
| **File Storage** | 99.9% (Cloudflare R2 SLA) | File uploads fail | Signed URL expiration handling, client-side retry |
| **Rate Limiter** | 99.9% (Upstash SLA) | Rate limit checks fail | Fail-open (allow request if Redis unavailable, log error) |
| **Application Server** | 99.95% (Vercel SLA) | Server crash/restart | Stateless design, no in-memory session storage |

**Rollback Procedures (Story 1.3):**
- **Database Migration Rollback:** Documented step-by-step restore to SQLite
- **File Migration Rollback:** Script to restore files from S3 to local filesystem
- **Schema Rollback:** Prisma migration rollback commands documented

**Data Integrity Validation (Story 1.3):**
- Row count validation for each model (SQLite count == PostgreSQL count)
- Checksum validation for critical data (User, Course, Assignment)
- Foreign key integrity validation (all relations intact)
- Go/no-go criteria: 100% data integrity validated before production migration

**Backup Strategy (Epic 4, documented here for completeness):**
- Automated daily PostgreSQL backups (Neon)
- Point-in-time restore capability (6-hour retention on free tier, 7-day on Scale plan)
- File storage has versioning disabled (cost optimization, files rarely change)

### Observability

**NFR005 Alignment (PRD):**
- Comprehensive documentation (deployment runbooks, incident response, troubleshooting)
- 70%+ test coverage for critical paths

**Epic 1 Observability Implementation:**

| Signal Type | Tool/Method | What's Logged | Story |
|-------------|-------------|---------------|-------|
| **Application Logs** | Pino (structured logging) | Request/response, errors, warnings, database queries | 1.1 |
| **Database Logs** | Prisma query logging | Query text, duration, params | 1.1 |
| **Rate Limit Events** | Upstash analytics | Rate limit hits, violations, top offenders | 1.7 |
| **Validation Errors** | API error responses | Invalid inputs, validation failures | 1.8 |
| **Migration Progress** | Script output logs | Row counts, checksums, errors | 1.3, 1.6 |
| **Health Checks** | `/api/health/db` endpoint | Database connectivity, latency | 1.1 |

**Log Format (Pino structured logging):**
```typescript
// /src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Usage example
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, userId }, 'Database query failed');
```

**Documentation (Story 1.1, 1.3, 1.5, 1.7, 1.8):**
- Database setup and configuration guide
- Migration rollback procedures
- File upload API migration guide
- Rate limiting configuration and troubleshooting
- Input validation patterns and adding new schemas

**Monitoring Foundation:**
- Logs written to stdout (Vercel auto-aggregates to Vercel Logs)
- Error tracking deferred to Epic 4 (Sentry integration)
- Performance monitoring deferred to Epic 4 (Vercel Analytics)
- Uptime monitoring deferred to Epic 4 (Better Stack)

## Dependencies and Integrations

### New Dependencies (Epic 1)

| Dependency | Version | Purpose | Story | License |
|------------|---------|---------|-------|---------|
| **@neondatabase/serverless** | ^0.9.0 | Neon PostgreSQL driver for serverless environments | 1.1 | Apache-2.0 |
| **@aws-sdk/client-s3** | ^3.700.0 | S3-compatible client for Cloudflare R2 operations | 1.4 | Apache-2.0 |
| **@aws-sdk/s3-request-presigner** | ^3.700.0 | Generate signed URLs for direct S3 uploads | 1.5 | Apache-2.0 |
| **@upstash/ratelimit** | ^2.0.4 | Serverless rate limiting via Upstash Redis | 1.7 | MIT |
| **@upstash/redis** | ^1.37.0 | Serverless Redis client for rate limiting | 1.7 | MIT |
| **zod** | ^3.24.1 | TypeScript-first schema validation | 1.8 | MIT |
| **pino** | ^9.6.0 | Fast structured logging library | 1.1 | MIT |
| **pino-pretty** | ^13.0.0 | Pretty-print logs in development | 1.1 | MIT |

### Existing Dependencies (Preserved)

**Core Framework:**
- `next@15.3.3` - React framework with App Router, server components, API routes
- `react@19.0.0` - UI library
- `react-dom@19.0.0` - React DOM renderer
- `typescript@5` - Type-safe JavaScript

**Database & ORM:**
- `@prisma/client@6.9.0` - Prisma ORM client (updated for PostgreSQL)
- `prisma@6.9.0` - Prisma CLI and schema management
- `@next-auth/prisma-adapter@1.0.7` - NextAuth Prisma adapter

**Authentication:**
- `next-auth@4.24.11` - Authentication library with JWT/database sessions
- `bcryptjs@3.0.2` - Password hashing

**UI Components:**
- `@radix-ui/react-dialog@1.1.14` - Accessible modal dialogs
- `@radix-ui/react-dropdown-menu@2.1.15` - Accessible dropdown menus
- `@radix-ui/react-tabs@1.1.12` - Accessible tabs component
- `tailwindcss@4` - Utility-first CSS framework
- `lucide-react@0.514.0` - Icon library

**Content Management:**
- `@dnd-kit/core@6.3.1` - Drag-and-drop library core
- `@dnd-kit/sortable@10.0.0` - Sortable drag-and-drop
- `@dnd-kit/utilities@3.2.2` - Drag-and-drop utilities
- `@tinymce/tinymce-react@6.2.1` - Rich text editor (React wrapper)
- `tinymce@7.9.1` - Rich text editor core

**Utilities:**
- `date-fns@4.1.0` - Date formatting and manipulation
- `react-hot-toast@2.5.2` - Toast notifications

### External Service Integrations

**Database (Story 1.1):**
- **Service:** Neon PostgreSQL
- **Integration:** Prisma ORM via `@neondatabase/serverless` driver
- **Credentials:** `DATABASE_URL` (connection pooling), `DIRECT_URL` (migrations)
- **Endpoint:** `*.neon.tech:5432`
- **Failover:** Connection retry logic in Prisma client

**File Storage (Story 1.4, 1.5):**
- **Service:** Cloudflare R2 (S3-compatible)
- **Integration:** AWS SDK S3 client
- **Credentials:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- **Endpoints:** `https://<account>.r2.cloudflarestorage.com` (uploads), `https://cdn.<domain>` (CDN)
- **Operations:** Signed URL generation, direct uploads, file metadata storage

**Rate Limiting (Story 1.7):**
- **Service:** Upstash Redis (serverless)
- **Integration:** `@upstash/ratelimit` library
- **Credentials:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Edge Compatibility:** Runs on Vercel Edge Runtime (co-located with application)
- **Analytics:** Built-in rate limit analytics dashboard

**Authentication (Existing):**
- **Service:** NextAuth (self-hosted)
- **Integration:** Database sessions via Prisma adapter
- **Storage:** PostgreSQL (Session, Account, VerificationToken models)
- **Session Duration:** 30 days max, 7-day idle timeout

### Environment Variables

**Required for Epic 1:**

```bash
# Database (Story 1.1)
DATABASE_URL="postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require"
DB_CONNECTION_LIMIT="10"

# File Storage (Story 1.4)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="ai-gurus-lms-uploads"
R2_PUBLIC_URL="https://cdn.aigurus.com" # CDN domain

# Rate Limiting (Story 1.7)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Logging (Story 1.1)
LOG_LEVEL="info" # debug, info, warn, error
NODE_ENV="development" # development, production

# File Upload Limits (Story 1.5)
MAX_FILE_SIZE="52428800" # 50MB in bytes
ALLOWED_MIME_TYPES="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Existing (preserved)
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Integration Points

**Internal Integrations:**

| From | To | Interface | Data Flow | Story |
|------|----|-----------|-----------| ------|
| All API Routes | Prisma Client | TypeScript function calls | CRUD operations | 1.2 |
| Upload API | R2 Storage Client | AWS SDK S3 API | File upload/download | 1.5 |
| Middleware | Rate Limiter | Upstash Redis | Rate limit checks | 1.7 |
| API Routes | Input Validators | Zod schemas | Request validation | 1.8 |
| All Modules | Logger | Pino API | Structured logging | 1.1 |
| Health Check | Prisma Client | Database query | Connection validation | 1.1 |

**External Integrations:**

| Service | Protocol | Authentication | Data Format | Purpose |
|---------|----------|----------------|-------------|---------|
| Neon PostgreSQL | PostgreSQL wire protocol (TCP/5432) | Username/password in connection string | SQL queries | Database operations |
| Cloudflare R2 | S3 API (HTTPS) | Access key + secret key | Binary (files) | File storage |
| Upstash Redis | REST API (HTTPS) | Bearer token | JSON | Rate limiting |
| Vercel (hosting) | HTTPS | Automatic (platform) | HTTP/JSON | Application hosting |

**Migration Dependencies:**

| Migration Script | Dependencies | Input | Output | Story |
|------------------|--------------|-------|--------|-------|
| `migrate-to-postgres.ts` | Prisma Client (SQLite + PostgreSQL) | SQLite DB file | PostgreSQL populated | 1.3 |
| `migrate-files-to-r2.ts` | R2 Client, filesystem | Local uploads directory | R2 bucket populated | 1.6 |

**Testing Dependencies (Epic 1.5):**
- See Epic 1.5 tech spec for Jest, Playwright, and testing library dependencies

## Acceptance Criteria (Authoritative)

### Epic-Level Acceptance Criteria

**Epic 1 Complete When:**

1. ✅ PostgreSQL database operational with validated connection pooling (10 connections)
2. ✅ All 10 Prisma models migrated to PostgreSQL with 100% data integrity validated
3. ✅ Rollback procedures documented and tested for database and file migrations
4. ✅ All uploaded files stored in Cloudflare R2 with CDN delivery
5. ✅ Existing local files migrated to R2 with zero data loss
6. ✅ Rate limiting active: 100 req/min per IP, 200 req/min per user, 5 login attempts per 15 min
7. ✅ Input validation implemented on all POST/PUT/DELETE endpoints via Zod schemas
8. ✅ Soft deletes operational on User, Course, Assignment, Grade, Discussion models
9. ✅ Security audit preparation complete: OWASP Top 10 reviewed, zero P0/P1 gaps identified
10. ✅ Development environment fully functional on production infrastructure
11. ✅ Comprehensive documentation complete: setup guides, rollback procedures, troubleshooting

### Story-Level Acceptance Criteria

**Story 1.1: PostgreSQL Setup & Configuration**
1. PostgreSQL instance provisioned (Neon)
2. Database connection credentials stored securely in environment variables
3. Connection pooling configured in Prisma (`connection_limit` set)
4. Database accessible from development environment
5. Health check endpoint created (`/api/health/db`)
6. Documentation: Database setup and configuration guide created

**Story 1.2: Database Schema Migration to PostgreSQL**
1. Prisma schema updated for PostgreSQL provider
2. All 10 models migrated successfully
3. All 25 relations maintained with correct foreign keys and cascade behaviors
4. Migration script executed successfully
5. Database schema validated (tables, indexes, constraints present)
6. Development environment connected to PostgreSQL and functional
7. Rollback procedure documented and tested

**Story 1.3: Data Integrity Validation & Rollback Plan**
1. Data validation script created (checksums, row counts)
2. Sample data migrated from SQLite to PostgreSQL
3. Validation script confirms 100% data integrity
4. Rollback procedure documented (step-by-step restore to SQLite)
5. Rollback procedure tested successfully
6. Performance baseline established (query response times)
7. Go/no-go criteria documented

**Story 1.4: S3-Compatible Storage Setup**
1. S3-compatible storage provisioned (Cloudflare R2)
2. CDN configured for fast content delivery
3. Storage bucket created with appropriate access controls
4. API credentials stored securely in environment variables
5. Storage client library integrated (AWS SDK)
6. Basic file upload test successful
7. CDN URL generation working (signed URLs)
8. Cost monitoring configured (alerts if costs exceed $50)

**Story 1.5: File Upload API Migration to S3**
1. File upload API updated to use S3 instead of local filesystem
2. Signed URL generation for secure direct uploads
3. File metadata stored in database (filename, size, MIME type, S3 key)
4. File size limits enforced (configurable)
5. MIME type validation implemented
6. Existing file upload workflows functional
7. Upload error handling implemented
8. Documentation: File upload API changes

**Story 1.6: Existing File Migration to S3**
1. File migration script created
2. All existing files migrated with integrity validation (checksums)
3. Database records updated with S3 keys
4. File retrieval URLs updated to use CDN URLs
5. Local files archived as backup (30 days retention)
6. Verification: All files accessible via new URLs
7. Rollback capability: Script to restore files from S3

**Story 1.7: Rate Limiting Implementation**
1. Rate limiting middleware implemented (per-IP and per-user)
2. Per-IP rate limit: 100 requests/minute
3. Per-user rate limit: 200 requests/minute
4. Login endpoint: 5 failed attempts → 15-minute lockout
5. Rate limit exceeded returns HTTP 429 with retry-after header
6. Rate limiting tested with load testing tool
7. Monitoring: Rate limit violations logged
8. Documentation: Rate limiting configuration

**Story 1.8: Input Validation with Zod Schemas**
1. Zod schemas defined for all POST/PUT/DELETE endpoints
2. Input validation middleware integrated
3. Invalid requests return HTTP 400 with clear errors
4. Critical endpoints validated (user registration, course creation, assignment submission, grading)
5. XSS prevention validated (HTML/script tags sanitized)
6. SQL injection prevention validated (Prisma parameterized queries)
7. Validation tests written for each schema
8. Documentation: Validation patterns

**Story 1.9: Soft Deletes Implementation**
1. `deletedAt` field added to User, Course, Assignment, Grade, Discussion models
2. Prisma queries updated to filter out soft-deleted records
3. Admin UI includes option to view soft-deleted records
4. Hard delete operations replaced with soft delete
5. Cascade soft deletes implemented
6. Soft delete restoration capability added
7. Data retention policy documented (1 year)
8. Migration script created

**Story 1.10: Security Audit Preparation**
1. Security checklist completed (OWASP Top 10 review)
2. All P0/P1 security gaps identified and documented
3. Security audit scope document prepared
4. Code review completed for auth/authz logic
5. Secrets audit: No hardcoded credentials
6. HTTPS enforcement validated
7. CSP headers configured

## Traceability Mapping

| AC # | Acceptance Criteria | Spec Section | Component(s) | Test Idea |
|------|---------------------|--------------|--------------|-----------|
| **1.1.1** | PostgreSQL provisioned | Dependencies - Database | Neon account, database instance | Manual: Verify Neon dashboard shows database |
| **1.1.2** | Credentials in env vars | Dependencies - Environment Variables | `.env.local` | Manual: Check `.env.local` has `DATABASE_URL`, `DIRECT_URL` |
| **1.1.3** | Connection pooling configured | Detailed Design - Data Models | `/src/lib/prisma.ts` | Unit: Verify `connection_limit: 10` in Prisma config |
| **1.1.4** | Database accessible | Overview | Development environment | Integration: Execute test query from dev env |
| **1.1.5** | Health check endpoint created | APIs and Interfaces | `/src/app/api/health/db/route.ts` | Integration: GET `/api/health/db` returns 200 |
| **1.1.6** | Setup guide created | Observability | `/docs/database-setup.md` | Manual: Verify documentation exists |
| **1.2.1** | Schema updated for PostgreSQL | Detailed Design - Data Models | `prisma/schema.prisma` | Manual: Verify `provider = "postgresql"` |
| **1.2.2** | 10 models migrated | Detailed Design - Data Models | Prisma schema | Unit: Count models in schema == 10 |
| **1.2.3** | 25 relations maintained | Detailed Design - Data Models | Prisma schema | Unit: Count relations in schema == 25 |
| **1.2.4** | Migrations applied | Workflows | `prisma/migrations/` | Integration: Run `prisma migrate status` |
| **1.2.5** | Schema validated | Workflows | PostgreSQL database | Integration: Query `information_schema` tables |
| **1.2.6** | Dev env on PostgreSQL | Overview | Local development | Manual: Run app locally, verify queries work |
| **1.2.7** | Rollback documented | Reliability | `/docs/rollback-procedures.md` | Manual: Verify rollback steps documented |
| **1.3.1** | Validation script created | Services and Modules | `/scripts/migrate-to-postgres.ts` | Manual: Verify script exists with validation logic |
| **1.3.2** | Sample data migrated | Workflows | PostgreSQL database | Integration: Run migration on test data |
| **1.3.3** | 100% data integrity | Reliability | Validation script output | Integration: Run validation script, verify 100% match |
| **1.3.4** | Rollback documented | Reliability | `/docs/rollback-procedures.md` | Manual: Verify SQLite restore steps |
| **1.3.5** | Rollback tested | Reliability | Test environment | Integration: Migrate → rollback → verify SQLite intact |
| **1.3.6** | Performance baseline | Performance | Logs/metrics | Manual: Document query response times |
| **1.3.7** | Go/no-go criteria | Reliability | Documentation | Manual: Verify criteria documented |
| **1.4.1** | R2 storage provisioned | Dependencies - File Storage | Cloudflare account, R2 bucket | Manual: Verify R2 bucket exists in Cloudflare dashboard |
| **1.4.2** | CDN configured | Dependencies - File Storage | Cloudflare CDN | Manual: Verify CDN domain configured |
| **1.4.3** | Bucket access controls | Security | R2 bucket settings | Manual: Verify bucket is private by default |
| **1.4.4** | Credentials in env vars | Dependencies - Environment Variables | `.env.local` | Manual: Check R2 credentials present |
| **1.4.5** | Storage client integrated | Services and Modules | `/src/lib/r2.ts` | Unit: Verify R2 client instantiation |
| **1.4.6** | Upload test successful | Workflows | R2 bucket | Integration: Upload test file via SDK |
| **1.4.7** | Signed URL working | APIs and Interfaces | `/src/lib/r2.ts` | Integration: Generate signed URL, upload file |
| **1.4.8** | Cost monitoring configured | NFR - Reliability | Cloudflare alerts | Manual: Verify alert configured |
| **1.5.1** | Upload API uses S3 | APIs and Interfaces | `/src/app/api/upload/route.ts` | Integration: POST `/api/upload`, verify S3 key returned |
| **1.5.2** | Signed URL generation | APIs and Interfaces | `/src/lib/r2.ts` | Unit: Test `generateSignedUploadUrl()` function |
| **1.5.3** | Metadata stored in DB | Detailed Design - Data Models | FileMetadata interface, Prisma | Integration: Upload file, verify DB record created |
| **1.5.4** | Size limits enforced | Security | Upload API validation | Integration: Upload 100MB file, expect 400 error |
| **1.5.5** | MIME type validation | Security | Upload API validation | Integration: Upload .exe file, expect 400 error |
| **1.5.6** | Workflows functional | Overview | Course content, assignments | E2E: Upload course content, verify accessible |
| **1.5.7** | Error handling | Workflows | Upload API | Integration: Simulate network failure, verify error response |
| **1.5.8** | Documentation | Observability | `/docs/file-upload-migration.md` | Manual: Verify migration guide exists |
| **1.6.1** | Migration script created | Services and Modules | `/scripts/migrate-files-to-r2.ts` | Manual: Verify script exists |
| **1.6.2** | Files migrated with checksums | Reliability | Migration script output | Integration: Run script, verify checksums match |
| **1.6.3** | DB records updated | Workflows | PostgreSQL database | Integration: Verify file records have S3 keys |
| **1.6.4** | URLs updated to CDN | Workflows | Application | Integration: Verify file URLs use CDN domain |
| **1.6.5** | Local files archived | Workflows | Filesystem | Manual: Verify local files backed up |
| **1.6.6** | All files accessible | Workflows | Application | E2E: Open all files, verify accessible |
| **1.6.7** | Rollback capability | Reliability | Rollback script | Integration: Test S3 → local restore script |
| **1.7.1** | Middleware implemented | Services and Modules | `/src/middleware.ts` | Unit: Verify middleware exports rate limit function |
| **1.7.2** | 100 req/min per IP | Security | Rate limiter config | Integration: Send 101 requests, expect 429 on 101st |
| **1.7.3** | 200 req/min per user | Security | Rate limiter config | Integration: Send 201 auth requests, expect 429 |
| **1.7.4** | Login: 5 attempts lockout | Security | Login rate limiter | Integration: 6 failed logins, expect 429 + 15min wait |
| **1.7.5** | HTTP 429 with retry-after | APIs and Interfaces | Rate limit response | Integration: Trigger rate limit, verify 429 + header |
| **1.7.6** | Load testing validated | Performance | Load test tool | Integration: Use `k6` or `artillery` to test limits |
| **1.7.7** | Violations logged | Observability | Upstash analytics + logs | Manual: Verify logs show rate limit violations |
| **1.7.8** | Documentation | Observability | `/docs/rate-limiting.md` | Manual: Verify config guide exists |
| **1.8.1** | Zod schemas defined | Detailed Design - APIs | `/src/validators/` | Unit: Verify schemas for user, course, assignment |
| **1.8.2** | Middleware integrated | Services and Modules | API routes | Integration: POST invalid data, expect 400 |
| **1.8.3** | 400 with clear errors | APIs and Interfaces | API responses | Integration: Verify error messages include field names |
| **1.8.4** | Critical endpoints validated | Security | User, course, assignment, grade APIs | Integration: Test validation on each endpoint |
| **1.8.5** | XSS prevention | Security | Validation logic | Integration: POST `<script>alert('xss')</script>`, verify sanitized |
| **1.8.6** | SQL injection prevention | Security | Prisma queries | Integration: POST `'; DROP TABLE users;--`, verify rejected |
| **1.8.7** | Validation tests written | Test Strategy | `/__tests__/unit/validators/` | Unit: Run validator test suite |
| **1.8.8** | Documentation | Observability | `/docs/input-validation.md` | Manual: Verify patterns documented |
| **1.9.1** | `deletedAt` fields added | Detailed Design - Data Models | Prisma schema | Unit: Verify 5 models have `deletedAt` field |
| **1.9.2** | Queries filter deleted | Detailed Design - Data Models | Prisma queries | Unit: Verify queries include `where: { deletedAt: null }` |
| **1.9.3** | Admin UI for deleted records | Workflows | Admin dashboard | E2E: Login as admin, view deleted records |
| **1.9.4** | Hard deletes replaced | Workflows | Application code | Unit: Verify no `.delete()` calls, only `.update({ deletedAt })` |
| **1.9.5** | Cascade soft deletes | Workflows | Delete operations | Integration: Soft delete course, verify content soft deleted |
| **1.9.6** | Restoration capability | Workflows | Admin API | Integration: Soft delete user, restore, verify `deletedAt = null` |
| **1.9.7** | Retention policy documented | Reliability | Documentation | Manual: Verify 1-year policy documented |
| **1.9.8** | Migration script | Workflows | Prisma migrations | Integration: Run migration, verify fields added |
| **1.10.1** | OWASP Top 10 reviewed | Security | Security checklist | Manual: Verify checklist completed |
| **1.10.2** | P0/P1 gaps documented | Security | Security report | Manual: Verify gap analysis document exists |
| **1.10.3** | Audit scope prepared | Security | Security audit scope | Manual: Verify scope document prepared |
| **1.10.4** | Auth/authz reviewed | Security | Code review notes | Manual: Verify review notes exist |
| **1.10.5** | No hardcoded secrets | Security | Codebase | Integration: Run secrets scanner (e.g., `trufflehog`) |
| **1.10.6** | HTTPS enforced | Security | Vercel config | Integration: Access via HTTP, verify redirects to HTTPS |
| **1.10.7** | CSP headers configured | Security | `next.config.js` | Integration: Check response headers include CSP |

## Risks, Assumptions, Open Questions

### Risks

**R1: Data Loss During PostgreSQL Migration** (Severity: High)
- Database schema migration or data transfer could corrupt records if validation fails
- **Mitigation**: Implement comprehensive validation suite (Story 1.3) before cutover; maintain SQLite backup for 2 weeks post-migration; test migration on copy of production data first

**R2: Service Downtime During Cutover** (Severity: Medium)
- Database and file storage migration requires maintenance window
- **Mitigation**: Schedule migration during low-traffic period; communicate downtime window to beta testers 48 hours in advance; target < 2 hour cutover window

**R3: File Migration Failures to S3** (Severity: Medium)
- Large file transfers (videos, PDFs) could fail mid-migration due to network issues
- **Mitigation**: Implement resumable uploads using multipart upload API; validate each file transfer with checksum comparison; maintain local backup until migration verified

**R4: Rate Limiting False Positives** (Severity: Medium)
- Legitimate users on shared IPs (corporate VPNs, school networks) could trigger IP-based rate limits
- **Mitigation**: Implement tiered rate limiting (IP + authenticated user); provide clear 429 error messages with retry-after headers; monitor rate limit violations during first week

**R5: Third-Party Service Availability** (Severity: Medium)
- Neon PostgreSQL, Cloudflare R2, or Upstash Redis outages could block development/testing
- **Mitigation**: Review SLA commitments for each service; implement graceful degradation where possible; maintain fallback SQLite database for local development

**R6: Schema Migration Complexity** (Severity: Low)
- 10 models with 25 relations could have hidden dependencies causing migration failures
- **Mitigation**: Use Prisma's built-in migration preview; test migration on staging environment first; document all schema changes in migration notes

**R7: Cost Overruns on Free Tiers** (Severity: Low)
- S3 storage, database capacity, or rate limiting could exceed free tier limits during beta
- **Mitigation**: Set up billing alerts at 50% and 80% of free tier limits; monitor usage weekly; plan upgrade path if approaching limits

### Assumptions

**A1: Current Data Volume**
- Assume SQLite database contains < 10K total records (users, courses, assignments, grades)
- Assume existing uploaded files total < 10GB
- **Validation**: Query SQLite for record counts; measure total file storage size before migration

**A2: Beta Testing Load**
- Assume < 50 concurrent users during beta phase
- Assume < 1000 total requests/minute across all users
- **Validation**: Monitor actual usage during first week; adjust rate limits if needed

**A3: Service Capacity**
- Assume Neon free tier (10 concurrent connections, 3GB storage) sufficient for beta
- Assume Cloudflare R2 free tier (10GB storage, 10 million Class A operations/month) sufficient for beta
- Assume Upstash Redis free tier (10K commands/day) sufficient for rate limiting
- **Validation**: Review usage metrics weekly; plan upgrade trigger points

**A4: Existing Codebase Quality**
- Assume current Prisma usage follows best practices (no raw SQL, proper relation handling)
- Assume existing file upload code is centralized (minimal refactoring needed for S3 migration)
- Assume current auth implementation compatible with rate limiting middleware
- **Validation**: Code review during Story 1.1 (database setup) and Story 1.4 (file storage setup)

**A5: Security Baseline**
- Assume no P0/P1 security vulnerabilities currently exist in codebase
- Assume current auth implementation provides adequate session management
- Assume environment variables properly secured (not committed to git)
- **Validation**: Security audit preparation (Story 1.10) will surface any critical gaps

**A6: Data Retention Policy**
- Assume soft-deleted records retained for 1 year before hard deletion
- Assume no regulatory compliance requirements (GDPR right-to-erasure) during beta
- **Validation**: Confirm with product team before implementing soft delete retention logic

**A7: Development Environment**
- Assume all developers can access cloud services (Neon, Cloudflare R2, Upstash) from dev machines
- Assume local development environment can be configured with production-like infrastructure
- **Validation**: Test environment setup on clean machine before rollout to team

### Open Questions

**Q1: Migration Downtime Window**
- What is the acceptable downtime window for database/file migration? (Target: < 2 hours)
- Should we schedule migration during weekend/evening?
- **Action**: Confirm with product team; communicate to beta testers

**Q2: Blue-Green Deployment**
- Should we implement blue-green deployment strategy for zero-downtime migration?
- Does added complexity justify zero-downtime goal for beta phase?
- **Action**: Evaluate effort vs. benefit; defer to Epic 4 if not critical for beta

**Q3: Data Retention and Hard Deletion**
- What is the final policy for soft-deleted record retention? (Proposed: 1 year)
- Should we implement automated hard deletion job, or manual admin-triggered deletion?
- **Action**: Confirm policy with product/legal team; document in Story 1.9

**Q4: Rate Limit Overages During Traffic Spikes**
- How should we handle legitimate traffic spikes (e.g., assignment deadline rush)?
- Should we implement temporary rate limit increases for known events?
- **Action**: Monitor first 2 weeks of beta; implement dynamic rate limiting if needed (defer to Epic 2)

**Q5: Pre-Migration Monitoring**
- What monitoring/alerting must be in place before migration? (Database health, file storage capacity, error rates)
- Should we set up staging environment with production-like monitoring first?
- **Action**: Define minimum monitoring requirements in Story 1.1; full monitoring in Epic 4

**Q6: Database Backup Automation**
- Should we implement automated database backup/restore before migration?
- What is the required backup retention period?
- **Action**: Implement basic Neon point-in-time recovery configuration in Story 1.1; comprehensive backup strategy in Epic 4

**Q7: Migration Rollback SLA**
- What is the maximum acceptable time to rollback to SQLite if PostgreSQL migration fails? (Target: < 30 minutes)
- Should we maintain parallel SQLite/PostgreSQL operation during transition period?
- **Action**: Document rollback procedure in Story 1.3; test rollback in staging environment

**Q8: File Migration Verification**
- How should we verify file integrity after S3 migration? (Checksum comparison, spot checks, comprehensive validation)
- What is acceptable failure rate for file migration? (Target: 0% data loss)
- **Action**: Implement checksum validation in Story 1.6; maintain local backup for 2 weeks post-migration

## Test Strategy Summary

### Test Levels and Coverage

Epic 1 requires comprehensive testing across multiple levels to validate infrastructure stability, security hardening, and data integrity. The test strategy ensures all 77 acceptance criteria are validated before marking stories as complete.

### Unit Testing

**Scope**: Individual functions, validators, utilities, and business logic components

**Framework**: Jest (configured in Epic 1.5)

**Coverage Targets**:
- Zod validation schemas: 100% coverage (all validators must be tested)
- Soft delete utilities: 100% coverage (critical for audit trail)
- Rate limiting logic: 90%+ coverage (core security feature)
- Database query helpers: 80%+ coverage

**Key Test Areas**:
- **Story 1.8**: Validator functions (`/src/validators/user.ts`, `course.ts`, `assignment.ts`, `grade.ts`)
  - Valid input acceptance
  - Invalid input rejection with correct error messages
  - Edge cases (empty strings, SQL injection attempts, XSS attempts)

- **Story 1.9**: Soft delete functions (`/src/lib/soft-delete.ts`)
  - Soft delete operations set `deletedAt` timestamp
  - Queries correctly filter out soft-deleted records
  - Cascade delete operations work correctly

- **Story 1.7**: Rate limiting utilities (`/src/lib/rate-limit.ts`)
  - Rate limiter initialization with correct configuration
  - Request counting logic
  - Retry-after header calculation

**Test Files Location**: `/__tests__/unit/` (organized by module)

### Integration Testing

**Scope**: API endpoints, database operations, external service integrations, middleware chains

**Framework**: Jest with Supertest for API testing

**Coverage Targets**:
- All POST/PUT/DELETE endpoints: 100% coverage (security critical)
- All GET endpoints with query parameters: 90%+ coverage
- Database migration validation: 100% coverage
- File upload/download operations: 100% coverage

**Key Test Areas**:
- **Story 1.1-1.3**: Database operations
  - Prisma client connection to PostgreSQL
  - CRUD operations on all 10 models
  - Transaction rollback on errors
  - Connection pooling under load
  - Data integrity validation queries

- **Story 1.4-1.6**: File storage operations
  - File upload to Cloudflare R2
  - File download via CDN URL
  - Multipart upload for large files
  - File metadata storage in database
  - File deletion (from S3 and database)

- **Story 1.7**: Rate limiting middleware
  - IP-based rate limiting (100 req/min)
  - User-based rate limiting (200 req/min)
  - Login endpoint lockout (5 attempts)
  - HTTP 429 response with retry-after header
  - Rate limit bypass for whitelisted IPs (if implemented)

- **Story 1.8**: Input validation middleware
  - POST requests with invalid data return 400
  - Error messages include specific field validation failures
  - XSS attempts are sanitized/rejected
  - SQL injection attempts are blocked by Prisma

- **Story 1.9**: Soft delete operations
  - Soft delete updates `deletedAt` timestamp
  - Queries exclude soft-deleted records by default
  - Admin can view soft-deleted records
  - Restoration sets `deletedAt` to null
  - Cascade soft deletes work correctly (e.g., deleting course soft-deletes modules)

**Test Files Location**: `/__tests__/integration/` (organized by story)

### Load Testing

**Scope**: Rate limiting validation, database connection pooling, concurrent file uploads

**Framework**: k6 or Artillery (configured in Epic 1.5)

**Coverage Targets**:
- Rate limiting thresholds validated under load
- Database connection pool handles concurrent requests
- File upload performance under concurrent uploads

**Key Test Scenarios**:
- **Story 1.7**: Rate limiting validation
  - Simulate 101 requests from single IP in 1 minute, verify 101st returns 429
  - Simulate 201 authenticated requests from single user in 1 minute, verify 201st returns 429
  - Simulate 6 failed login attempts, verify 6th returns 429 with 15-minute lockout

- **Story 1.1**: Database connection pooling
  - Simulate 20 concurrent database queries (exceeds 10-connection limit)
  - Verify queue management and no connection errors

- **Story 1.5**: File upload performance
  - Simulate 10 concurrent file uploads (10MB each)
  - Verify successful uploads and no timeouts

**Test Files Location**: `/__tests__/load/` (k6 scripts)

### Security Testing

**Scope**: OWASP Top 10 validation, secrets scanning, CSP header validation

**Framework**: Manual testing + automated security scanners

**Coverage Targets**:
- OWASP Top 10 checklist: 100% reviewed
- Secrets scanning: Zero hardcoded secrets
- Security headers: All configured correctly

**Key Test Areas**:
- **Story 1.8**: Injection attack prevention
  - SQL injection: POST `'; DROP TABLE users;--` to user creation endpoint, verify rejected
  - XSS: POST `<script>alert('xss')</script>` to name fields, verify sanitized
  - Command injection: POST `; rm -rf /` to file upload fields, verify rejected

- **Story 1.10**: Security audit preparation
  - Run TruffleHog or GitGuardian to scan for hardcoded secrets
  - Verify `.env` file is gitignored and not committed
  - Test HTTP → HTTPS redirect
  - Verify CSP headers in response (check `next.config.js`)
  - Review authentication/authorization logic for bypasses

- **Story 1.7**: DoS attack prevention
  - Verify rate limiting prevents DoS attacks
  - Test graceful degradation under rate limiting

**Test Files Location**: `/__tests__/security/` (security test scripts)

### End-to-End Testing

**Scope**: Critical user journeys impacted by Epic 1 changes (deferred to Epic 3 for comprehensive E2E testing)

**Framework**: Playwright (configured in Epic 1.5)

**Coverage Targets** (Epic 1 specific):
- User registration with PostgreSQL backend
- File upload/download via S3/CDN
- Admin viewing soft-deleted records

**Key Test Flows**:
- **Student uploads assignment**: Login → Navigate to assignment → Upload PDF → Verify file stored in S3 → Verify CDN URL in database
- **Instructor grades assignment**: Login → Navigate to gradebook → Enter grade → Verify grade stored in PostgreSQL
- **Admin views deleted users**: Login as admin → Navigate to user management → Toggle "Show deleted" → Verify soft-deleted users displayed

**Test Files Location**: `/__tests__/e2e/` (Playwright specs, configured in Epic 1.5)

### Manual Testing

**Scope**: Security audit checklist, documentation review, infrastructure validation

**Coverage Targets**:
- All documentation complete and accurate
- Security audit preparation checklist 100% reviewed
- Rollback procedures validated in staging environment

**Key Manual Tests**:
- **Story 1.3**: Data integrity validation
  - Run data integrity validation queries after migration
  - Compare SQLite record counts vs. PostgreSQL record counts
  - Spot-check 10 random records for data accuracy

- **Story 1.6**: Existing file migration
  - Verify all files migrated to S3 (checksum comparison)
  - Test file download from CDN URLs
  - Verify local file storage emptied

- **Story 1.10**: Security audit preparation
  - Complete OWASP Top 10 checklist
  - Review authentication/authorization code
  - Document P0/P1 security gaps (if any)
  - Prepare audit scope document

### Test Data Management

**Approach**: Use separate test databases and S3 buckets for each test level

**Test Databases**:
- **Unit tests**: In-memory SQLite or mocked Prisma client
- **Integration tests**: Dedicated PostgreSQL test database (reset before each test run)
- **Load tests**: Staging PostgreSQL database (isolated from development)
- **E2E tests**: Staging environment with realistic data (Epic 1.5)

**Test File Storage**:
- **Integration tests**: Dedicated R2 bucket (`ai-gurus-lms-test`)
- **E2E tests**: Staging R2 bucket (`ai-gurus-lms-staging`)

**Test Data Seeding**:
- Use Prisma seed scripts to create test users, courses, assignments (Epic 1.5)
- Reset test database before each integration test run
- Create realistic test files (1KB, 1MB, 10MB) for file upload tests

### Test Execution Strategy

**Development Phase** (Stories 1.1-1.10):
- Developers run unit tests locally before committing (`npm run test:unit`)
- Developers run integration tests for modified endpoints (`npm run test:integration -- --testNamePattern="user"`)
- CI/CD pipeline (Epic 1.5) runs all tests on pull requests

**Story Completion** (Before marking story as "done"):
- All unit tests for story pass
- All integration tests for story pass
- Relevant load tests pass (for Stories 1.1, 1.5, 1.7)
- Relevant security tests pass (for Stories 1.7, 1.8, 1.10)
- Manual testing checklist complete (for Stories 1.3, 1.6, 1.10)

**Epic Completion** (Before marking Epic 1 as "done"):
- All 77 acceptance criteria validated (see Traceability Mapping)
- All unit tests pass (target: 90%+ coverage)
- All integration tests pass
- Load tests validate rate limiting and connection pooling
- Security tests validate OWASP Top 10 protections
- Manual testing confirms data integrity and security audit readiness
- Retrospective conducted (Epic 1 retrospective)

### Edge Cases and Error Conditions

**Database Migration Edge Cases**:
- Partial migration failure: Verify rollback procedure
- Connection timeout during migration: Verify resumable migration
- Foreign key constraint violations: Verify migration preview catches these

**File Migration Edge Cases**:
- Network timeout during large file upload: Verify multipart upload resumption
- File corruption during transfer: Verify checksum validation catches this
- S3 bucket capacity exceeded: Verify graceful error handling

**Rate Limiting Edge Cases**:
- Burst traffic (100 requests in 1 second): Verify rate limiter handles burst correctly
- Distributed clients behind single IP: Verify user-based rate limiting reduces false positives
- Rate limit key expiration: Verify Redis key TTL set correctly

**Validation Edge Cases**:
- Empty strings: Verify validators reject empty required fields
- Extremely long strings: Verify validators enforce max length
- Unicode characters: Verify validators handle UTF-8 correctly
- Null vs. undefined: Verify validators handle both consistently

### Regression Testing

**Scope**: Ensure existing functionality not broken by Epic 1 changes

**Approach**:
- Run existing test suite before starting Epic 1 (establish baseline)
- Run existing test suite after each story completion (detect regressions)
- Pay special attention to:
  - Authentication flows (ensure rate limiting doesn't break login)
  - File operations (ensure S3 migration doesn't break uploads/downloads)
  - Database queries (ensure PostgreSQL behaves identically to SQLite)

### Test Documentation

**Required Documentation** (Story 1.10):
- **Rate Limiting Configuration Guide** (`/docs/rate-limiting.md`): Rate limit thresholds, configuration, monitoring
- **Input Validation Patterns** (`/docs/input-validation.md`): Zod schema examples, validation middleware usage
- **Database Migration Runbook** (`/docs/database-migration.md`): Step-by-step migration procedure, rollback steps
- **File Migration Runbook** (`/docs/file-migration.md`): Step-by-step file migration procedure, checksum validation
- **Security Audit Preparation** (`/docs/security-audit.md`): OWASP Top 10 checklist, gap analysis, audit scope

---

**Test Strategy Owner**: SM (Scrum Master) validates test coverage before marking stories as "done"

**Test Execution Owner**: Developer implements tests alongside feature code

**Test Review**: Code review workflow (Epic 1.5) validates test quality and coverage
