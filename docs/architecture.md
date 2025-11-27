# AI Gurus LMS - Architecture Document

**Author:** Ed
**Date:** 2025-11-24
**Project:** AI Gurus LMS Production Readiness Enhancement
**Project Type:** Brownfield Level 3 Software (Complex Integration)
**Version:** 1.0

---

## Executive Summary

This architecture document defines the technical decisions, patterns, and structure for transforming the AI Gurus LMS from a development prototype into a production-grade learning management system. The architecture supports a phased enhancement approach across 5 epics (34 stories) to achieve production readiness for beta launch with 1-10 SME executive testers, with a clear path to scale to 100-1000+ users.

**Key Architectural Principles:**
- **Brownfield Enhancement:** Preserve existing Next.js 15 + React 19 + Prisma foundation while upgrading infrastructure
- **Serverless-First:** Leverage Vercel + Neon auto-scaling to support 10 → 100 → 1000+ users without major refactoring
- **Production-Grade Reliability:** 99.5%+ uptime through managed services (Vercel, Neon, Cloudflare R2) with comprehensive monitoring
- **AI Agent Consistency:** Strict implementation patterns ensure multiple AI agents produce compatible code across all 34 stories
- **Cost-Effective Scaling:** Free tiers for beta ($0/month), predictable scaling to ~$87/month for production (1000+ users)

**Architecture Approach:** Full-stack monolith (Next.js 15) with serverless database (Neon PostgreSQL), S3-compatible object storage (Cloudflare R2), edge deployment (Vercel), and comprehensive observability (Sentry + Vercel Analytics + Better Stack).

---

## Table of Contents

1. [Project Context](#project-context)
2. [Architecture Decision Summary](#architecture-decision-summary)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Epic to Architecture Mapping](#epic-to-architecture-mapping)
6. [Data Architecture](#data-architecture)
7. [API Architecture](#api-architecture)
8. [Security Architecture](#security-architecture)
9. [File Storage Architecture](#file-storage-architecture)
10. [Authentication & Authorization](#authentication--authorization)
11. [Monitoring & Observability](#monitoring--observability)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Architecture](#deployment-architecture)
14. [Implementation Patterns](#implementation-patterns)
15. [Cross-Cutting Concerns](#cross-cutting-concerns)
16. [Integration Points](#integration-points)
17. [Performance Considerations](#performance-considerations)
18. [Development Environment](#development-environment)
19. [Architecture Decision Records](#architecture-decision-records)

---

## Project Context

### Current State (Brownfield)

**Existing Platform:**
- **Codebase:** 88 TypeScript files, 42 API endpoints, 10 database models
- **Framework:** Next.js 15.3.3 + React 19.0.0 + TypeScript 5
- **Database:** SQLite (development) + Prisma 6.9.0 ORM
- **Authentication:** NextAuth 4.24.11 with JWT sessions
- **Styling:** Tailwind CSS 4 + Radix UI components
- **File Storage:** Local filesystem (temporary)
- **Testing:** None (0% coverage)
- **Deployment:** Development only

**Fully Implemented Features:**
- User authentication & role-based access control (Student, Instructor, Admin)
- Course management (create, edit, activate, enroll)
- Advanced content management (drag-and-drop, YouTube, file uploads via @dnd-kit 6.3)
- Assignment system (creation, submission, grading)
- Discussion forums (threaded, nested replies)
- Announcements system

**Partially Implemented Features:**
- Gradebook (route exists, full grid view incomplete)
- Admin dashboard (basic stats, full functionality unclear)
- GPA calculation (placeholder, no logic)

**Production Blockers:**
- SQLite database (not production-ready)
- Local file storage (not scalable)
- Zero test coverage (no quality validation)
- No monitoring or error tracking
- No security hardening (rate limiting, input validation)

### Target State (Production-Ready)

**Goals:**
1. **Beta Launch:** Support 1-10 SME executive testers with 99.5%+ uptime
2. **Feature Parity:** Complete gradebook, admin dashboard, GPA calculation
3. **Production Infrastructure:** PostgreSQL, S3/CDN, monitoring, backups
4. **Security Hardening:** Rate limiting, input validation, soft deletes, audit readiness
5. **Quality Validation:** 70%+ test coverage, E2E tests, accessibility compliance
6. **Scalable Foundation:** 10 → 100 → 1000+ users without major refactoring

**Timeline:** 10 weeks (5 epics, 34 stories) + 2-4 weeks beta iteration

---

## Architecture Decision Summary

### Critical Infrastructure Decisions

| Decision | Choice | Rationale | Epic | Cost |
|----------|--------|-----------|------|------|
| **Database** | Neon PostgreSQL | Serverless, auto-scaling, free tier for beta, seamless Vercel integration, database branching | Epic 1 | Free → $19/mo |
| **File Storage** | Cloudflare R2 | Zero egress fees, 10GB free tier, S3-compatible, cost-effective for video content | Epic 1 | Free → $5/mo |
| **Hosting** | Vercel | Made for Next.js, seamless Neon integration, free Hobby for beta, 99.5%+ uptime | Epic 4 | Free → $20/mo |

### Security & Authentication Decisions

| Decision | Choice | Rationale | Epic | Cost |
|----------|--------|-----------|------|------|
| **Authentication** | NextAuth (database sessions) | Already installed, Prisma adapter, 30-day sessions with 7-day idle timeout | Epic 1 | Free |
| **Rate Limiting** | Upstash Rate Limit | Serverless Redis, 100 req/min per IP, 200 req/min per user, Vercel Edge compatible | Epic 1 | Free → $10/mo |
| **Input Validation** | Zod | TypeScript-first, prevents injection attacks, specified in PRD | Epic 1 | Free |

### Monitoring & Observability Decisions

| Decision | Choice | Rationale | Epic | Cost |
|----------|--------|-----------|------|------|
| **Error Tracking** | Sentry | Official Vercel integration, 1-line setup, 5K errors/month free, session replay | Epic 4 | Free → $29/mo |
| **Performance** | Vercel Analytics | Built-in, zero config, Core Web Vitals, real user monitoring | Epic 4 | $10/mo (Pro) |
| **Uptime** | Better Stack Uptime | 3-min checks (faster than competitors), custom status page, 10 monitors free | Epic 4 | Free → $18/mo |
| **Logging** | Pino + Vercel Logs | Lightweight structured logging, Vercel auto-aggregates stdout | Epic 1 | Free |

### Development & Quality Decisions

| Decision | Choice | Rationale | Epic | Cost |
|----------|--------|-----------|------|------|
| **Testing** | Jest + Playwright | Jest for unit/integration, Playwright for E2E, specified in PRD | Epic 1.5 | Free |
| **CI/CD** | GitHub Actions + Vercel | Automated testing on PRs, seamless Vercel deployments | Epic 1.5 | Free |
| **Backups** | Neon Automated | Point-in-time restore (6hr free, 7-day on Scale plan) | Epic 4 | Included |

### Total Cost Breakdown

**Beta (1-10 users):** $0/month (all free tiers)
**Production (100+ users):** ~$87/month
- Vercel Pro: $20/mo
- Neon Scale: $19/mo
- Upstash: $10/mo
- Sentry: $29/mo
- Better Stack: $18/mo
- Others: Free

---

## Technology Stack

### Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.3.3 | Full-stack React framework with App Router |
| **UI Library** | React | 19.0.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Components** | Radix UI | Latest | Accessible UI primitives (Dialog, Dropdown, Tabs) |
| **Icons** | Lucide React | 0.514.0 | Icon library |
| **Rich Text** | TinyMCE | 7.9.1 | WYSIWYG editor for course content |
| **Drag & Drop** | @dnd-kit | 6.3.1 | Content reordering |
| **Notifications** | react-hot-toast | 2.5.2 | Toast notifications |
| **Date Handling** | date-fns | 4.1.0 | Date formatting and manipulation |

### Backend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **API** | Next.js API Routes | 15.3.3 | REST-ful API endpoints |
| **Database** | Neon PostgreSQL | Latest | Serverless PostgreSQL |
| **ORM** | Prisma | 6.9.0 | Type-safe database client |
| **Authentication** | NextAuth | 4.24.11 | OAuth + JWT sessions |
| **Password Hashing** | bcryptjs | 3.0.2 | Secure password storage |
| **File Storage** | Cloudflare R2 | Latest | S3-compatible object storage |
| **Rate Limiting** | Upstash Rate Limit | Latest | Serverless rate limiting |
| **Validation** | Zod | Latest | Schema validation |
| **Logging** | Pino | Latest | Structured JSON logging |

### DevOps & Quality Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Hosting** | Vercel | Latest | Edge deployment platform |
| **Testing** | Jest | Latest | Unit & integration tests |
| **E2E Testing** | Playwright | Latest | End-to-end browser testing |
| **CI/CD** | GitHub Actions | Latest | Automated testing & deployment |
| **Error Tracking** | Sentry | Latest | Error monitoring & session replay |
| **Performance** | Vercel Analytics | Latest | Real user monitoring |
| **Uptime** | Better Stack Uptime | Latest | Uptime monitoring & alerts |

---

## Project Structure

```
ai-gurus-lms/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD: Run tests on PRs (Epic 1.5, Story 1.5.3)
│       └── deploy.yml                # Production deployment workflow
│
├── docs/                             # Project documentation
│   ├── index.md                      # Documentation index
│   ├── PRD.md                        # Product Requirements Document
│   ├── epics.md                      # Epic breakdown (34 stories)
│   ├── architecture.md               # THIS FILE
│   ├── project-overview.md           # High-level overview
│   ├── api-contracts.md              # API endpoint documentation (42 endpoints)
│   ├── data-models.md                # Database schema documentation
│   ├── component-inventory.md        # UI component catalog
│   ├── development-guide.md          # Setup and workflow guide
│   ├── source-tree-analysis.md       # Codebase structure analysis
│   └── stories/                      # User stories (Epic 2-4)
│       ├── sprint-status.yaml        # Sprint tracking (Epic 4)
│       └── *.md                      # Individual story files
│
├── prisma/
│   ├── schema.prisma                 # Database models (10 models, 25 relations)
│   │                                 # Epic 1: Add deletedAt fields for soft deletes
│   ├── migrations/                   # PostgreSQL migrations (Epic 1)
│   └── seed.ts                       # Test data seeding (Epic 1.5)
│
├── public/
│   ├── images/                       # Static images
│   ├── icons/                        # App icons
│   └── fonts/                        # Custom fonts
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Homepage
│   │   ├── login/                    # Authentication pages
│   │   ├── register/
│   │   ├── dashboard/                # Student/Instructor/Admin dashboards
│   │   │   └── page.tsx              # Epic 2: Enhanced with GPA display
│   │   │
│   │   ├── courses/                  # Course management
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Epic 2: Add prerequisites display
│   │   │   │   ├── assignments/
│   │   │   │   ├── discussions/
│   │   │   │   └── announcements/
│   │   │   └── page.tsx              # Course catalog
│   │   │
│   │   ├── gradebook/                # Epic 2: Complete gradebook (Stories 2.1-2.3)
│   │   │   └── [courseId]/
│   │   │       └── page.tsx          # Grid view with inline editing
│   │   │
│   │   ├── admin/                    # Epic 2: Enhanced admin (Stories 2.5-2.6)
│   │   │   ├── dashboard/
│   │   │   ├── users/                # User management
│   │   │   └── settings/
│   │   │
│   │   └── api/                      # API Routes (42 existing + new endpoints)
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts
│   │       │
│   │       ├── health/               # Epic 1: Health checks (Story 1.1)
│   │       │   └── db/route.ts       # Database connection health
│   │       │
│   │       ├── student/              # Student endpoints (existing)
│   │       │   ├── courses/
│   │       │   ├── assignments/
│   │       │   ├── discussions/
│   │       │   └── enroll/
│   │       │
│   │       ├── instructor/           # Instructor endpoints
│   │       │   ├── courses/
│   │       │   ├── assignments/
│   │       │   ├── gradebook/        # Epic 2: Gradebook API (Stories 2.1-2.3)
│   │       │   └── templates/        # Epic 2: Feedback templates (Story 2.7)
│   │       │
│   │       ├── admin/                # Admin endpoints
│   │       │   ├── dashboard/
│   │       │   ├── users/            # Epic 2: User management (Story 2.5)
│   │       │   └── stats/            # Epic 2: System statistics (Story 2.6)
│   │       │
│   │       ├── upload/               # Epic 1: R2 file uploads (Stories 1.5-1.6)
│   │       │   ├── signed-url/route.ts     # Generate R2 signed URLs
│   │       │   └── complete/route.ts       # Confirm upload completion
│   │       │
│   │       └── users/
│   │           ├── search/
│   │           └── students/
│   │
│   ├── components/                   # React components
│   │   ├── layouts/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   │
│   │   ├── course/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseList.tsx
│   │   │   ├── ContentEditor.tsx     # Drag-and-drop (@dnd-kit)
│   │   │   └── EnrollmentButton.tsx
│   │   │
│   │   ├── assignment/
│   │   │   ├── AssignmentCard.tsx
│   │   │   ├── SubmissionForm.tsx
│   │   │   └── GradeDisplay.tsx
│   │   │
│   │   ├── gradebook/                # Epic 2: New components
│   │   │   ├── GradebookGrid.tsx     # Matrix view
│   │   │   ├── GradebookCell.tsx     # Inline editing cell
│   │   │   ├── GradebookFilters.tsx  # Filter controls
│   │   │   └── ExportButton.tsx      # CSV export
│   │   │
│   │   ├── admin/                    # Epic 2: New components
│   │   │   ├── UserManagement.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── SystemHealth.tsx
│   │   │
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx             # Radix Dialog wrapper
│   │   │   ├── Dropdown.tsx          # Radix Dropdown wrapper
│   │   │   ├── Tabs.tsx              # Radix Tabs wrapper
│   │   │   └── Toast.tsx             # react-hot-toast wrapper
│   │   │
│   │   └── editor/
│   │       └── RichTextEditor.tsx    # TinyMCE wrapper
│   │
│   ├── lib/                          # Utilities and helpers
│   │   ├── prisma.ts                 # Epic 1: Prisma client + connection pooling
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── logger.ts                 # Epic 1: Pino logger setup
│   │   ├── sentry.ts                 # Epic 4: Sentry configuration
│   │   ├── r2.ts                     # Epic 1: Cloudflare R2 client
│   │   ├── rate-limit.ts             # Epic 1: Upstash rate limiter
│   │   └── utils.ts                  # General utilities
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourse.ts
│   │   └── useToast.ts
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── next-auth.d.ts
│   │   ├── api.ts
│   │   └── models.ts
│   │
│   ├── middleware.ts                 # Epic 1: Rate limiting middleware
│   │
│   ├── validators/                   # Epic 1: Zod validation schemas
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── assignment.ts
│   │   └── index.ts
│   │
│   └── constants/
│       ├── errors.ts
│       ├── roles.ts
│       └── config.ts
│
├── __tests__/                        # Epic 1.5 & Epic 3: Test suite
│   ├── unit/                         # Jest unit tests
│   │   ├── lib/
│   │   └── validators/
│   │
│   ├── integration/                  # Jest integration tests
│   │   └── api/
│   │
│   ├── e2e/                          # Playwright E2E tests
│   │   ├── student.spec.ts           # Epic 3: Student journey
│   │   ├── instructor.spec.ts        # Epic 3: Instructor journey
│   │   ├── admin.spec.ts             # Epic 3: Admin journey
│   │   └── accessibility.spec.ts     # Epic 3: Accessibility tests
│   │
│   ├── fixtures/
│   ├── helpers/
│   └── setup.ts
│
├── scripts/
│   ├── migrate-to-postgres.ts        # Epic 1: SQLite → PostgreSQL migration
│   ├── migrate-files-to-r2.ts        # Epic 1: Local files → R2 migration
│   └── seed-test-data.ts
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Environment variables template
├── .gitignore
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── package.json
├── jest.config.js                    # Epic 1.5: Jest configuration
├── playwright.config.ts              # Epic 1.5: Playwright configuration
└── README.md
```

---

## Epic to Architecture Mapping

### Epic 1: Infrastructure Foundation & Security Hardening (Weeks 1-3)

**Architectural Boundaries:**
- `/prisma/schema.prisma` - Database schema with soft deletes
- `/src/lib/prisma.ts` - Prisma client with connection pooling
- `/src/lib/r2.ts` - Cloudflare R2 client for file storage
- `/src/lib/rate-limit.ts` - Upstash rate limiter
- `/src/validators/` - Zod validation schemas
- `/src/middleware.ts` - Rate limiting middleware
- `/scripts/migrate-*` - Migration scripts

**Integration Points:**
- Prisma client → All API routes (database access)
- R2 client → Upload API routes (file storage)
- Rate limit middleware → All API routes (security)
- Zod validators → All POST/PUT/DELETE API routes (input validation)

**Stories → Components:**
- Story 1.1: `/src/lib/prisma.ts`, `/src/app/api/health/db/route.ts`
- Story 1.2: `/prisma/migrations/`, Prisma schema updates
- Story 1.3: `/scripts/migrate-to-postgres.ts`, validation scripts
- Story 1.4: R2 bucket setup, `/src/lib/r2.ts`
- Story 1.5: `/src/app/api/upload/`, R2 SDK integration
- Story 1.6: `/scripts/migrate-files-to-r2.ts`
- Story 1.7: `/src/lib/rate-limit.ts`, `/src/middleware.ts`
- Story 1.8: `/src/validators/`, API route integration
- Story 1.9: Prisma schema `deletedAt` fields, query updates
- Story 1.10: Security audit checklist, OWASP review

### Epic 1.5: Testing Infrastructure Setup (Weeks 2-3, concurrent)

**Architectural Boundaries:**
- `/__tests__/` - All test files
- `/jest.config.js` - Jest configuration
- `/playwright.config.ts` - Playwright configuration
- `/.github/workflows/ci.yml` - CI/CD pipeline

**Integration Points:**
- Jest → Unit/integration test execution
- Playwright → E2E test execution
- GitHub Actions → Automated testing on PR merge
- Test fixtures → Mock database for isolated testing

**Stories → Components:**
- Story 1.5.1: `/jest.config.js`, `/__tests__/unit/`, `/__tests__/integration/`
- Story 1.5.2: `/playwright.config.ts`, `/__tests__/e2e/`, Page Object Model
- Story 1.5.3: `/.github/workflows/ci.yml`, Vercel integration
- Story 1.5.4: `/docs/testing-guide.md`, code examples

### Epic 2: Feature Completion & Admin Capabilities (Weeks 4-6)

**Architectural Boundaries:**
- `/src/app/gradebook/` - Gradebook pages
- `/src/components/gradebook/` - Gradebook components
- `/src/app/api/instructor/gradebook/` - Gradebook API
- `/src/app/admin/` - Admin dashboard pages
- `/src/components/admin/` - Admin components
- `/src/app/api/admin/` - Admin API endpoints

**Integration Points:**
- Gradebook → Grade/Assignment/Submission models (Prisma)
- Admin dashboard → All models (aggregation queries)
- GPA calculation → Grade model (business logic)
- Feedback templates → New FeedbackTemplate model

**Stories → Components:**
- Story 2.1: `/src/app/gradebook/[courseId]/page.tsx`, GradebookGrid component
- Story 2.2: GradebookCell component with inline editing, optimistic updates
- Story 2.3: GradebookFilters component, CSV export utility
- Story 2.4: GPA calculation utility, dashboard integration
- Story 2.5: `/src/app/admin/users/`, UserManagement component
- Story 2.6: `/src/app/admin/dashboard/`, StatsCard components
- Story 2.7: FeedbackTemplate model, `/src/app/api/instructor/templates/`
- Story 2.8: Course model schema additions, enrollment page updates

### Epic 3: E2E Testing & Quality Validation (Weeks 7-8)

**Architectural Boundaries:**
- `/__tests__/e2e/` - Playwright E2E tests
- Security testing tools (external)
- Coverage reports (generated)

**Integration Points:**
- E2E tests → Entire application (integration testing)
- Accessibility tests → All pages (Lighthouse, axe-core)
- Security tests → All endpoints (penetration testing)
- Coverage reports → CI/CD pipeline (validation gate)

**Stories → Components:**
- Story 3.1: `/__tests__/e2e/student.spec.ts` (enrollment, assignment, discussion flows)
- Story 3.2: `/__tests__/e2e/instructor.spec.ts` (course creation, grading flows)
- Story 3.3: `/__tests__/e2e/admin.spec.ts` (user management, system monitoring)
- Story 3.4: `/__tests__/e2e/accessibility.spec.ts` (keyboard nav, screen readers)
- Story 3.5: Security audit report, penetration test results, coverage validation

### Epic 4: Production Deployment & Monitoring (Weeks 9-10)

**Architectural Boundaries:**
- Vercel project configuration
- `/src/lib/sentry.ts` - Sentry error tracking
- Monitoring dashboards (external services)
- `/docs/` - Deployment runbooks

**Integration Points:**
- Sentry → All code (error capture)
- Vercel Analytics → All pages (performance monitoring)
- Better Stack → Health endpoints (uptime monitoring)
- Neon backups → Database (automated backups)

**Stories → Components:**
- Story 4.1: Vercel project setup, environment variables, custom domain
- Story 4.2: Neon backup configuration, restore testing
- Story 4.3: `/src/lib/sentry.ts`, Pino logger integration
- Story 4.4: Vercel Analytics setup, Better Stack monitors
- Story 4.5: `/docs/deployment-runbook.md`, `/docs/incident-response.md`
- Story 4.6: `/docs/beta-quick-start.md`, onboarding materials
- Story 4.7: Production checklist, smoke tests, go-live validation

---

## Data Architecture

### Database Models (Prisma Schema)

**10 Core Models (Existing):**

1. **User** - Students, instructors, admins with comprehensive profiles
2. **Course** - Course offerings with instructor assignment
3. **Enrollment** - Student-course relationships
4. **Assignment** - Course assignments with due dates and points
5. **Submission** - Student assignment submissions
6. **Grade** - Assignment grades with feedback
7. **Discussion** - Course discussion threads
8. **DiscussionPost** - Discussion replies (nested)
9. **Announcement** - Course announcements
10. **CourseContent** - Multi-type content (TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE)

**Schema Enhancements (Epic 1 & Epic 2):**

```prisma
// Epic 1: Soft Deletes (Story 1.9)
model User {
  deletedAt   DateTime?  // Soft delete timestamp
  // ... existing fields
}

model Course {
  deletedAt   DateTime?
  // ... existing fields
}

// Epic 2: Prerequisites & Learning Objectives (Story 2.8)
model Course {
  prerequisites      String?     // Course prerequisites
  learningObjectives String[]    // Array of learning objectives
  targetAudience     String?     // Target audience description
  // ... existing fields
}

// Epic 2: Feedback Templates (Story 2.7)
model FeedbackTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String   // "excellent", "needs-improvement", "missing-requirements", "late"
  template    String   // Template with placeholders: {student_name}, {assignment_title}, {score}
  instructorId String
  instructor  User     @relation(fields: [instructorId], references: [id])
  isShared    Boolean  @default(false)  // Course-wide sharing
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())

  @@map("feedback_templates")
}
```

**Database Provider Migration:**

```prisma
// Before (Development)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// After (Production - Epic 1, Story 1.2)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**25 Database Relations:**
- User → Enrollments (one-to-many)
- User → Instructor Courses (one-to-many)
- User → Assignments (one-to-many, as creator)
- User → Submissions (one-to-many)
- User → Discussions (one-to-many, as author)
- User → DiscussionPosts (one-to-many)
- User → Announcements (one-to-many)
- User → Grades Received (one-to-many)
- User → Grades Given (one-to-many, as grader)
- User → Feedback Templates (one-to-many, Epic 2)
- Course → Instructor (many-to-one)
- Course → Enrollments (one-to-many)
- Course → Assignments (one-to-many)
- Course → Discussions (one-to-many)
- Course → Announcements (one-to-many)
- Course → CourseContent (one-to-many)
- Enrollment → User (many-to-one)
- Enrollment → Course (many-to-one)
- Assignment → Course (many-to-one)
- Assignment → Created By User (many-to-one)
- Assignment → Submissions (one-to-many)
- Assignment → Grades (one-to-many)
- Submission → Assignment (many-to-one)
- Submission → Student (many-to-one)
- Grade → Assignment (many-to-one)
- Grade → Student (many-to-one)
- Grade → Graded By User (many-to-one)
- Discussion → Course (many-to-one)
- Discussion → Author (many-to-one)
- Discussion → Posts (one-to-many)
- DiscussionPost → Discussion (many-to-one)
- DiscussionPost → Author (many-to-one)
- DiscussionPost → Parent Post (self-referential, optional)
- DiscussionPost → Replies (one-to-many, self-referential)
- Announcement → Course (many-to-one)
- Announcement → Author (many-to-one)
- CourseContent → Course (many-to-one)

**Cascade Delete Behaviors:**
- Delete Course → Cascade delete Enrollments, Assignments, Discussions, Announcements, CourseContent
- Delete Assignment → Cascade delete Submissions, Grades
- Delete Discussion → Cascade delete DiscussionPosts

**Soft Delete Strategy (Epic 1, Story 1.9):**
- Models with `deletedAt`: User, Course, Assignment, Grade, Discussion
- Prisma queries automatically filter `deletedAt IS NULL`
- Admin UI can view/restore soft-deleted records (audit trail)
- Data retention policy: 1 year for soft-deleted records

---

## API Architecture

### API Design Principles

1. **REST-ful conventions** - Resources as plurals, HTTP methods for CRUD
2. **Consistent response format** - `{ data: T }` for success, `{ error: {...} }` for errors
3. **Proper status codes** - 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Server Error)
4. **Input validation** - All POST/PUT/DELETE endpoints validate with Zod schemas (Epic 1, Story 1.8)
5. **Rate limiting** - 100 req/min per IP, 200 req/min per authenticated user (Epic 1, Story 1.7)
6. **Authentication required** - All endpoints except /api/auth/* check session

### API Response Format

**Success Response:**
```typescript
// Single item
{
  data: {
    id: "abc123",
    title: "Introduction to AI",
    // ... other fields
  }
}

// List
{
  data: [
    { id: "1", ... },
    { id: "2", ... }
  ]
}

// Paginated (future enhancement)
{
  data: [...],
  meta: {
    total: 100,
    page: 1,
    pageSize: 20,
    totalPages: 5
  }
}
```

**Error Response:**
```typescript
{
  error: {
    code: "INVALID_INPUT",        // Machine-readable error code
    message: "Email is required",  // Human-readable message
    details: {                     // Optional additional context
      field: "email",
      received: ""
    }
  }
}
```

**HTTP Status Codes:**
- **200 OK** - Successful GET/PUT/DELETE
- **201 Created** - Successful POST (resource created)
- **204 No Content** - Successful DELETE (no response body)
- **400 Bad Request** - Validation error, malformed request
- **401 Unauthorized** - Not authenticated (no session)
- **403 Forbidden** - Authenticated but not authorized (wrong role)
- **404 Not Found** - Resource doesn't exist
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Unexpected server error

### API Endpoint Categories

**Authentication Endpoints** (`/api/auth/*`):
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers (login, logout, session)

**Student Endpoints** (`/api/student/*`):
- `GET /api/student/courses` - Get enrolled courses
- `GET /api/student/courses/[id]` - Get course details
- `GET /api/student/courses/[id]/assignments` - Get course assignments
- `POST /api/student/courses/[id]/assignments/[assignmentId]/submission` - Submit assignment
- `GET /api/student/assignments/upcoming` - Get upcoming assignments
- `GET /api/student/available-courses` - Get courses available for enrollment
- `POST /api/student/enroll` - Enroll in course
- `GET /api/student/announcements/recent` - Get recent announcements

**Instructor Endpoints** (`/api/instructor/*`):
- `GET /api/instructor/courses` - Get instructor's courses
- `POST /api/instructor/courses` - Create new course
- `PUT /api/instructor/courses/[id]` - Update course
- `DELETE /api/instructor/courses/[id]` - Delete course
- `GET /api/instructor/assignments/[id]` - Get assignment details
- `GET /api/instructor/assignments/[id]/submissions` - Get assignment submissions
- `POST /api/instructor/assignments/[id]/submissions/[submissionId]/grade` - Grade submission
- `GET /api/instructor/gradebook/[courseId]` - **Epic 2: Get gradebook data (Story 2.1)**
- `PUT /api/instructor/gradebook/[courseId]/grade` - **Epic 2: Update grade inline (Story 2.2)**
- `GET /api/instructor/gradebook/[courseId]/export` - **Epic 2: Export CSV (Story 2.3)**
- `GET /api/instructor/templates` - **Epic 2: Get feedback templates (Story 2.7)**
- `POST /api/instructor/templates` - **Epic 2: Create feedback template**
- `PUT /api/instructor/templates/[id]` - **Epic 2: Update feedback template**
- `DELETE /api/instructor/templates/[id]` - **Epic 2: Delete feedback template**

**Admin Endpoints** (`/api/admin/*`):
- `GET /api/admin/dashboard/stats` - Get system statistics
- `GET /api/admin/users` - **Epic 2: Get user list (Story 2.5)**
- `POST /api/admin/users` - **Epic 2: Create user**
- `PUT /api/admin/users/[id]` - **Epic 2: Update user (including role changes)**
- `DELETE /api/admin/users/[id]` - **Epic 2: Deactivate user (soft delete)**
- `GET /api/admin/stats/detailed` - **Epic 2: Get detailed system metrics (Story 2.6)**

**Upload Endpoints** (`/api/upload/*` - **Epic 1, Stories 1.5-1.6**):
- `POST /api/upload/signed-url` - Generate Cloudflare R2 signed URL for direct upload
- `POST /api/upload/complete` - Confirm upload completion and store metadata

**Health Check Endpoints** (`/api/health/*` - **Epic 1, Story 1.1**):
- `GET /api/health/db` - Database connection health check

### API Middleware Stack

```typescript
// Request flow through middleware
Request
  ↓
1. Rate Limiting (src/middleware.ts - Epic 1, Story 1.7)
   - Check IP-based rate limit (100 req/min)
   - Check user-based rate limit (200 req/min)
   - Return 429 if exceeded
  ↓
2. Authentication Check (API route level)
   - Verify NextAuth session
   - Return 401 if not authenticated
  ↓
3. Input Validation (API route level - Epic 1, Story 1.8)
   - Parse request body
   - Validate with Zod schema
   - Return 400 if invalid
  ↓
4. Authorization Check (API route level)
   - Verify user role
   - Return 403 if not authorized
  ↓
5. Business Logic
   - Process request
   - Query database (Prisma)
   - Generate response
  ↓
6. Error Handling
   - Catch exceptions
   - Log to Sentry (Epic 4, Story 4.3)
   - Log to Pino
   - Return error response
  ↓
Response
```

---

## Security Architecture

### Authentication & Authorization

**Authentication Provider:** NextAuth 4.24.11

**Session Strategy:** Database sessions (Prisma adapter)
- **Session duration:** 30 days
- **Idle timeout:** 7 days of inactivity
- **Storage:** PostgreSQL via Prisma
- **Refresh tokens:** Enabled (auto-extend active sessions)
- **Multi-device tracking:** Not implemented for MVP

**Session Implementation:**

```typescript
// Server Components (src/app/*)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  redirect('/login');
}

// Client Components
'use client';
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
if (status === 'loading') return <Spinner />;
if (status === 'unauthenticated') redirect('/login');

// API Routes
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }
  // ... proceed with logic
}
```

**Role-Based Access Control (RBAC):**

```typescript
enum UserRole {
  STUDENT    // Can enroll, submit assignments, participate in discussions
  INSTRUCTOR // Can create courses, grade assignments, manage content
  ADMIN      // Can manage users, view system stats, access all features
}

// Authorization checks
if (session.user.role !== 'INSTRUCTOR') {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'Instructor access required' } },
    { status: 403 }
  );
}
```

### Input Validation (Epic 1, Story 1.8)

**Validation Library:** Zod

**Strategy:** All POST/PUT/DELETE API endpoints validate inputs with Zod schemas before processing.

**Schema Organization:**
- `/src/validators/user.ts` - User-related schemas (registration, profile updates)
- `/src/validators/course.ts` - Course-related schemas (create, update)
- `/src/validators/assignment.ts` - Assignment-related schemas
- `/src/validators/index.ts` - Barrel exports

**Example Validation:**

```typescript
// src/validators/course.ts
import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  code: z.string().min(1, 'Course code is required').regex(/^[A-Z]{2,4}[0-9]{3}$/),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
  year: z.number().int().min(2024).max(2030),
  prerequisites: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
});

// API route usage
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createCourseSchema.parse(body);  // Throws ZodError if invalid

    // Proceed with validated data
    const course = await prisma.course.create({ data: validated });
    return NextResponse.json({ data: course });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Validation failed',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }
    // Handle other errors...
  }
}
```

**Validation Coverage:**
- ✅ User registration (email format, password strength)
- ✅ Course creation/update (title, code, semester, year)
- ✅ Assignment creation (title, due date, max points)
- ✅ Assignment submission (content, file uploads)
- ✅ Grading (points range, feedback)
- ✅ Discussion posts (content length)
- ✅ Enrollment (course ID, user ID)

**XSS Prevention:**
- React automatically escapes JSX content
- Rich text (TinyMCE) content sanitized on render
- CSP headers configured in `next.config.js`

**SQL Injection Prevention:**
- Prisma uses parameterized queries (no raw SQL)
- All queries type-checked at compile time

### Rate Limiting (Epic 1, Story 1.7)

**Rate Limiting Service:** Upstash Rate Limit (serverless Redis)

**Rate Limits:**
- **Per-IP limit:** 100 requests/minute (unauthenticated users)
- **Per-user limit:** 200 requests/minute (authenticated users)
- **Login endpoint:** 5 failed attempts → 15-minute lockout

**Implementation:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
  analytics: true,
});

export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 m'),  // 200 requests per minute
  analytics: true,
});

// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipRateLimit, userRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';

  // Check IP-based rate limit
  const { success, limit, reset, remaining } = await ipRateLimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: { limit, reset, remaining }
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',  // Apply to all API routes
};
```

**Rate Limit Monitoring:**
- Upstash Analytics dashboard tracks rate limit hits
- Sentry alert if rate limits frequently exceeded (potential attack)
- Logs include IP addresses for abuse investigation

### Soft Deletes & Audit Trail (Epic 1, Story 1.9)

**Strategy:** Mark records as deleted (`deletedAt` timestamp) instead of hard deleting for compliance and audit trail.

**Models with Soft Deletes:**
- User, Course, Assignment, Grade, Discussion

**Implementation:**

```prisma
model User {
  id        String    @id @default(cuid())
  deletedAt DateTime?  // NULL = active, timestamp = soft-deleted
  // ... other fields
}
```

```typescript
// Prisma queries automatically filter soft-deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});

// Admin can view soft-deleted records
const allUsers = await prisma.user.findMany();  // Includes deleted

// Soft delete operation
const softDeleteUser = await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() }
});

// Restore soft-deleted record
const restoreUser = await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: null }
});
```

**Data Retention Policy:**
- Soft-deleted records retained for 1 year
- After 1 year, eligible for permanent deletion (manual process)
- Admin UI displays soft-deleted records with restore capability

### Security Headers (Vercel Configuration)

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.cloudflare.com https://neon.tech;"
          }
        ]
      }
    ];
  }
};
```

---

## File Storage Architecture

### Storage Provider: Cloudflare R2

**Why Cloudflare R2:**
- Zero egress fees (unlimited downloads at no extra cost)
- S3-compatible API (easy migration if needed)
- Generous free tier (10GB storage, 1M Class A operations/month)
- Global CDN included automatically
- Cost-effective scaling ($0.015/GB vs $0.023/GB for alternatives)

**Storage Strategy:**

**Public Bucket** (Course content, thumbnails):
- **Purpose:** Publicly accessible course materials
- **CDN:** Enabled for fast global delivery
- **Access:** Public read, signed write
- **Example URLs:** `https://pub-xxxxx.r2.dev/courses/cs101/intro-video.mp4`

**Private Bucket** (Assignment submissions, sensitive files):
- **Purpose:** Student submissions, instructor files
- **CDN:** Disabled (sensitive content)
- **Access:** Signed URLs only (time-limited)
- **Expiry:** 1 hour for signed URLs

### File Upload Flow (Epic 1, Stories 1.5-1.6)

**Direct Upload (Client → R2):**

```
1. Client requests signed URL from API
   POST /api/upload/signed-url
   Body: { fileName: 'assignment.pdf', fileType: 'application/pdf', bucket: 'private' }

2. API generates signed URL
   - Validate file type (allowed MIME types)
   - Check file size (max 50MB configurable)
   - Generate unique S3 key: {userId}/{timestamp}-{fileName}
   - Create R2 pre-signed PUT URL (expires 5 minutes)
   - Return signed URL to client

3. Client uploads directly to R2
   PUT https://r2.cloudflareaccount.com/bucket/{key}?signature=...
   Headers: Content-Type, Content-Length
   Body: File binary data

4. Client confirms upload
   POST /api/upload/complete
   Body: { key: '{userId}/{timestamp}-{fileName}', fileSize: 1234567 }

5. API stores metadata in database
   - Update CourseContent or Submission record with R2 key
   - Store file metadata (name, size, MIME type, upload timestamp)
```

**File Download Flow:**

```
// Public files (course content)
- Direct CDN URL: https://pub-xxxxx.r2.dev/courses/cs101/intro-video.mp4
- Cached globally, fast delivery

// Private files (assignment submissions)
- API generates signed URL (expires 1 hour)
- Client downloads via signed URL
- URL expires after 1 hour for security
```

### R2 Client Configuration

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,  // https://{account-id}.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// Generate signed URL for upload
export async function generateSignedUploadUrl(
  bucket: 'public' | 'private',
  key: string,
  contentType: string,
  expiresIn: number = 300  // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket === 'public' ? process.env.R2_PUBLIC_BUCKET : process.env.R2_PRIVATE_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

// Generate signed URL for download (private files only)
export async function generateSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600  // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_PRIVATE_BUCKET,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}
```

### File Validation

**Allowed MIME Types:**
- **Documents:** `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Spreadsheets:** `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Images:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Videos:** `video/mp4`, `video/quicktime`, `video/x-msvideo`
- **Archives:** `application/zip`, `application/x-rar-compressed`

**File Size Limits:**
- **Default:** 50MB (configurable via `MAX_FILE_SIZE` environment variable)
- **Video content:** 500MB (instructor uploads only)

**Malware Scanning (Future Enhancement):**
- Cloudflare R2 integrates with ClamAV for malware scanning
- Scan files on upload before storing metadata
- Reject files that fail scan

### File Migration (Epic 1, Story 1.6)

**Migration Script:** `/scripts/migrate-files-to-r2.ts`

```typescript
// Migration strategy
1. Scan local uploads directory
2. For each file:
   - Upload to appropriate R2 bucket (public/private)
   - Verify upload integrity (checksum)
   - Update database record with R2 key
   - Move local file to archive directory
3. Validation:
   - Verify all database records have R2 keys
   - Test file retrieval via signed URLs
4. Rollback capability:
   - Keep local files archived for 30 days
   - Script to restore from R2 to local if needed
```

---

## Authentication & Authorization

*(Already covered in Security Architecture section - see above)*

---

## Monitoring & Observability

### Error Tracking: Sentry (Epic 4, Story 4.3)

**Purpose:** Capture JavaScript errors, API failures, database crashes with full stack traces and context.

**Setup:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (captures user actions leading to error)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Filter sensitive data
  beforeSend(event) {
    // Remove passwords, tokens, PII
    if (event.request?.data?.password) {
      delete event.request.data.password;
    }
    return event;
  },
});

// API route error capture
export async function POST(request: Request) {
  try {
    // ... business logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: '/api/courses' },
      extra: { userId: session.user.id, requestBody: body },
    });

    logger.error({ error, userId: session.user.id }, 'Failed to create course');

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

**Sentry Configuration:**
- **Error severity classification:** P0 (critical) → immediate Slack alert, P1 (high) → 1-hour alert, P2/P3 → daily digest
- **Source maps:** Configured for TypeScript stack traces
- **Performance monitoring:** Track slow API endpoints (> 1 second response time)
- **Session replay:** Captures user actions leading to errors for debugging

**Cost:** Free tier (5,000 errors/month), $29/month for production (50,000 errors/month + session replay)

### Performance Monitoring: Vercel Analytics (Epic 4, Story 4.4)

**Purpose:** Track page load times, Core Web Vitals, real user performance.

**Metrics Tracked:**
- **Page Load Time:** Time to First Byte (TTFB), First Contentful Paint (FCP), Largest Contentful Paint (LCP)
- **Interactivity:** First Input Delay (FID), Total Blocking Time (TBT)
- **Visual Stability:** Cumulative Layout Shift (CLS)
- **API Response Time:** p50, p95, p99 latencies
- **Geographic Performance:** Performance by region

**Setup:**
- Zero configuration (built into Vercel)
- Automatically tracks Core Web Vitals
- Dashboard at vercel.com/analytics

**Performance Targets (PRD NFR001):**
- Page load time: < 2 seconds (p95)
- API response time: < 500ms (p95)
- Lighthouse score: > 80 (all metrics)

**Cost:** $10/month (included in Vercel Pro plan)

### Uptime Monitoring: Better Stack Uptime (Epic 4, Story 4.4)

**Purpose:** Ping site every 3 minutes, alert if down.

**Monitored Endpoints:**
- Homepage: `https://ai-gurus-lms.vercel.app/`
- Login: `https://ai-gurus-lms.vercel.app/login`
- API Health: `https://ai-gurus-lms.vercel.app/api/health/db`
- Course Catalog: `https://ai-gurus-lms.vercel.app/courses`

**Monitoring Configuration:**
- **Check frequency:** Every 3 minutes
- **Check locations:** Multiple global regions (US, EU, Asia)
- **Incident detection:** 2 consecutive failures = downtime incident
- **Alerting:** SMS + Email + Slack on downtime
- **Status page:** Public status page at status.ai-gurus-lms.com

**SLA Tracking:**
- Target: 99.5%+ uptime (PRD NFR002)
- Dashboard: 7-day rolling average uptime percentage
- Incident history: Track MTTR (Mean Time To Recovery)

**Cost:** Free tier (10 monitors, 3-min checks), $18/month for unlimited monitors

### Logging: Pino + Vercel Logs (Epic 1, Story 1.8)

**Purpose:** Structured logging for debugging and compliance.

**Logging Library:** Pino (lightweight, JSON-structured)

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['password', 'token', 'apiKey', 'email'],  // Redact sensitive fields
});

// Usage
logger.info({ userId, courseId }, 'User enrolled in course');
logger.error({ error, userId }, 'Failed to submit assignment');
logger.warn({ ipAddress, attempts: 5 }, 'Multiple failed login attempts');
```

**Log Levels:**
- **error** - Errors requiring attention (logged to Sentry)
- **warn** - Warnings (rate limit hits, validation failures)
- **info** - Important events (user registration, enrollment, submission)
- **debug** - Detailed debugging info (development only)

**Log Aggregation:**
- Vercel automatically captures all stdout/stderr
- Logs searchable in Vercel dashboard
- Retention: 7 days (Hobby), 3 months (Pro)

**Logging Rules:**
- ✅ **Always log:** User ID, action type, timestamp, error stack traces
- ❌ **Never log:** Passwords, API keys, session tokens, raw PII (unless hashed)
- ✅ **Context:** Include relevant IDs (userId, courseId, assignmentId) for correlation

**Cost:** Free (included with Vercel hosting)

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \
       / E2E \          ← Playwright (5-10 tests, critical flows)
      /______\
     /        \
    / Integ.  \         ← Jest (20-30 tests, API routes)
   /___________\
  /             \
 /     Unit      \      ← Jest (50-100 tests, business logic)
/_________________\
```

### Unit Tests (Jest + React Testing Library)

**Purpose:** Test business logic, utility functions, calculations in isolation.

**Coverage Target:** 70%+ for critical paths

**Test Files:** Co-located with source files (`*.test.ts`)

**Example Tests:**
- GPA calculation logic (Epic 2, Story 2.4)
- Grade percentage calculations
- Date formatting utilities
- Validation schemas (Zod)
- Authentication helpers

```typescript
// Example: GPA calculation test
// src/lib/gpa.test.ts
import { calculateGPA } from './gpa';

describe('calculateGPA', () => {
  it('calculates GPA correctly for weighted grades', () => {
    const grades = [
      { points: 90, maxPoints: 100, weight: 1 },
      { points: 85, maxPoints: 100, weight: 2 },
    ];

    const gpa = calculateGPA(grades);
    expect(gpa).toBeCloseTo(3.53, 2);  // (90*1 + 85*2) / (1+2) = 86.67 / 100 * 4.0
  });

  it('handles no grades gracefully', () => {
    const gpa = calculateGPA([]);
    expect(gpa).toBeNull();
  });
});
```

**NPM Scripts:**
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

### Integration Tests (Jest)

**Purpose:** Test API routes with mocked database.

**Test Files:** `__tests__/integration/api/`

**Example Tests:**
- Course creation API (POST /api/instructor/courses)
- Assignment submission API (POST /api/student/assignments/[id]/submission)
- Gradebook API (GET /api/instructor/gradebook/[courseId]) (Epic 2)
- User management API (POST /api/admin/users) (Epic 2)

```typescript
// Example: Course creation API test
// __tests__/integration/api/instructor/courses.test.ts
import { POST } from '@/app/api/instructor/courses/route';
import { prismaMock } from '../../../helpers/prismaMock';

describe('POST /api/instructor/courses', () => {
  it('creates a course successfully', async () => {
    const mockCourse = { id: '1', title: 'Test Course', code: 'CS101' };
    prismaMock.course.create.mockResolvedValue(mockCourse);

    const request = new Request('http://localhost/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Course', code: 'CS101', semester: 'Fall', year: 2025 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockCourse);
  });

  it('returns 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),  // Missing required fields
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_INPUT');
  });
});
```

### End-to-End Tests (Playwright)

**Purpose:** Validate complete user journeys across the entire application.

**Test Files:** `__tests__/e2e/`

**Test Coverage (Epic 3, Stories 3.1-3.4):**

**Student Journey (Story 3.1):**
- Discovery & Enrollment: Login → Browse catalog → View course details → Enroll
- Content Consumption: Access course → Navigate tabs → View content
- Assignment Workflow: View assignment → Submit text + file → Verify confirmation
- Progress Tracking: View gradebook → Check GPA → View feedback
- Discussion Participation: Create post → Reply to thread

**Instructor Journey (Story 3.2):**
- Course Setup: Login → Create course → Upload content → Create assignment → Publish
- Student Management: View enrollments → Enroll student → Post announcement
- Grading Workflow: Open gradebook → View submissions → Grade with feedback → Export CSV
- Inline Editing: Access gradebook grid → Edit grade → Confirm → Verify update

**Admin Journey (Story 3.3):**
- User Management: Login → Create user → Assign role → Edit details → Deactivate
- System Monitoring: View dashboard → Check stats → Review error logs
- Course Management: View all courses → Activate/deactivate

**Accessibility Tests (Story 3.4):**
- Automated accessibility testing (axe-core)
- Keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- Screen reader compatibility (ARIA labels, landmarks)
- WCAG 2.1 AA compliance (color contrast, form labels)
- Lighthouse Accessibility score > 90

```typescript
// Example: Student enrollment E2E test
// __tests__/e2e/student.spec.ts
import { test, expect } from '@playwright/test';

test('Student can enroll in course and submit assignment', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'student@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Browse catalog
  await page.goto('/courses');
  await expect(page.locator('h1')).toContainText('Course Catalog');

  // View course details
  await page.click('text=Introduction to AI');
  await expect(page.locator('h1')).toContainText('Introduction to AI');
  await expect(page.locator('text=Prerequisites')).toBeVisible();  // Epic 2, Story 2.8

  // Enroll
  await page.click('button:has-text("Enroll")');
  await expect(page.locator('text=Successfully enrolled')).toBeVisible();

  // Navigate to assignment
  await page.click('text=Assignments');
  await page.click('text=Assignment 1: Getting Started');

  // Submit assignment
  await page.fill('textarea[name="content"]', 'This is my submission.');
  await page.setInputFiles('input[type="file"]', 'test-file.pdf');
  await page.click('button:has-text("Submit")');

  // Verify confirmation
  await expect(page.locator('text=Assignment submitted')).toBeVisible();
});
```

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**NPM Scripts:**
```bash
npm run test:e2e              # Run E2E tests headless
npm run test:e2e:ui           # Run E2E tests with UI
npm run test:e2e:debug        # Debug E2E tests
```

### CI/CD Integration (Epic 1.5, Story 1.5.3)

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Build application
        run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Vercel
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**CI/CD Flow:**
1. Developer creates pull request
2. GitHub Actions runs: Lint → Unit tests → Integration tests → E2E tests → Build
3. Tests must pass for PR to be mergeable (required status check)
4. On merge to main: Automatic deployment to Vercel production
5. Vercel creates preview deployment for each PR (automatic)

---

## Deployment Architecture

### Hosting: Vercel

**Environment Tiers:**

**Development (Local):**
- Database: SQLite (existing) OR Neon development branch
- File Storage: Local filesystem
- Environment: `NODE_ENV=development`

**Preview (Vercel):**
- Database: Neon development branch (isolated per PR)
- File Storage: Cloudflare R2 (shared bucket with dev prefix)
- Environment: `NODE_ENV=preview`
- URL: `https://ai-gurus-lms-{pr-hash}.vercel.app`

**Production (Vercel):**
- Database: Neon production instance
- File Storage: Cloudflare R2 (production buckets)
- Environment: `NODE_ENV=production`
- URL: `https://ai-gurus-lms.vercel.app` (custom domain)

### Environment Variables

**Required Variables:**

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@neon.tech/dbname"
DIRECT_URL="postgresql://user:pass@neon.tech/dbname"  # For migrations

# Authentication (NextAuth)
NEXTAUTH_URL="https://ai-gurus-lms.vercel.app"
NEXTAUTH_SECRET="random-32-char-secret"

# File Storage (Cloudflare R2)
CLOUDFLARE_R2_ENDPOINT="https://{account-id}.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="xxxxxxxx"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="xxxxxxxx"
R2_PUBLIC_BUCKET="ai-gurus-public"
R2_PRIVATE_BUCKET="ai-gurus-private"
R2_PUBLIC_CDN_URL="https://pub-xxxxx.r2.dev"

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxx"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="xxxxxxxx"  # For uploading source maps

# Configuration
MAX_FILE_SIZE="52428800"  # 50MB in bytes
LOG_LEVEL="info"  # error, warn, info, debug
```

**Vercel Configuration:**
- Environment variables managed in Vercel dashboard
- Encrypted at rest, decrypted at runtime
- Different values per environment (Development, Preview, Production)

### Deployment Workflow

**Manual Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Automatic Deployment (via GitHub Integration):**
1. Push to main branch → Automatic production deployment
2. Open pull request → Automatic preview deployment
3. Update pull request → Automatic preview update
4. Merge pull request → Automatic production deployment

**Deployment Checklist (Epic 4, Story 4.5):**
- [ ] All tests passing (CI/CD green)
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Environment variables updated
- [ ] Smoke tests passed (health check, login, course catalog)
- [ ] Monitoring alerts configured (Sentry, Better Stack)
- [ ] Rollback plan documented

**Rollback Procedure:**
```bash
# Revert to previous deployment
vercel rollback

# OR deploy specific commit
git checkout <previous-commit-hash>
vercel --prod
```

### Database Backups (Epic 4, Story 4.2)

**Neon Automated Backups:**
- **Free Tier:** Point-in-time restore (last 6 hours)
- **Scale Plan:** Point-in-time restore (7 days) + automated daily snapshots
- **Retention:** 7-day retention for daily backups, 4-week retention for weekly backups
- **Encryption:** Data at rest encrypted, backups encrypted

**Backup Testing:**
- Monthly restore test to staging environment
- Validation: Compare row counts, checksums for critical tables
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 24 hours (daily backups)

**Restore Procedure:**
```bash
# Restore from Neon dashboard
1. Navigate to Neon project → Backups
2. Select restore point (timestamp or snapshot)
3. Create new branch from backup
4. Validate data integrity
5. Promote branch to production (or update DATABASE_URL)
```

---

## Implementation Patterns

### Naming Conventions

**Database (Prisma):**
- **Table names:** Plural lowercase with underscores (`users`, `course_content`)
- **Column names:** camelCase (`firstName`, `dueDate`)
- **Foreign keys:** `{singular}Id` (`instructorId`, `courseId`)

**API Routes:**
- **Endpoints:** REST-ful with plurals (`/api/courses`, `/api/courses/[id]`)
- **Route parameters:** Singular with brackets (`[id]`, `[assignmentId]`)

**React Components:**
- **Component files:** PascalCase + `.tsx` (`CourseCard.tsx`, `GradebookGrid.tsx`)
- **Component names:** Match file names (`export default function CourseCard()`)
- **Hook files:** camelCase starting with `use` (`useAuth.ts`, `useCourse.ts`)

**Variables & Functions:**
- **Functions:** camelCase, verb-first (`fetchCourses()`, `handleSubmit()`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- **Boolean variables:** Start with `is`, `has`, `should`, `can` (`isEnrolled`, `hasSubmitted`)

### File Organization

**Co-location Strategy:**
```
src/components/gradebook/
  ├── GradebookGrid.tsx       # Main component
  ├── GradebookCell.tsx       # Subcomponent
  ├── GradebookFilters.tsx    # Related feature
  └── types.ts                # Shared types
```

**Import Order:**
```typescript
// 1. External libraries
import { useState } from 'react';
import { toast } from 'react-hot-toast';

// 2. Internal absolute imports
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

// 3. Relative imports
import { CourseCard } from './CourseCard';
import type { Course } from './types';
```

### API Response Format

**Success:**
```typescript
{ data: { id: '123', title: 'Course' } }             // Single item
{ data: [{ id: '1' }, { id: '2' }] }                 // List
{ data: [...], meta: { total, page, pageSize } }     // Paginated
```

**Error:**
```typescript
{
  error: {
    code: 'INVALID_INPUT',
    message: 'Email is required',
    details: { field: 'email' }
  }
}
```

### Date/Time Handling

**Storage:** Always UTC ISO 8601
```typescript
const dueDate = new Date('2026-01-16T04:59:00.000Z');
```

**Display:** Format with date-fns
```typescript
import { format } from 'date-fns';
const displayDate = format(dueDate, 'PPP p');  // "Jan 15, 2026 at 11:59 PM"
```

### Error Handling

**API Routes:**
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    // Process
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Validation failed', details: error.errors } },
        { status: 400 }
      );
    }
    logger.error({ error }, 'Failed to process request');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

**Client Components:**
```typescript
async function handleSubmit() {
  try {
    const response = await fetch('/api/courses', { method: 'POST', body: JSON.stringify(data) });
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error.message);
      return;
    }
    const result = await response.json();
    toast.success('Course created!');
  } catch (error) {
    toast.error('Failed to create course');
  }
}
```

### TypeScript Strictness

**Always use TypeScript, never `any`:**
```typescript
// ✅ Proper typing
function calculateGPA(grades: Grade[]): number | null {}

// ❌ Type escape hatches
function calculateGPA(grades: any): any {}  // NO!
```

### Prisma Queries

**Always use Prisma client, never raw SQL:**
```typescript
// ✅ Prisma query
const courses = await prisma.course.findMany({
  where: { isActive: true },
  include: { instructor: true }
});

// ❌ Raw SQL (bypasses type safety)
const courses = await prisma.$queryRaw`SELECT * FROM courses`;
```

---

## Cross-Cutting Concerns

*(Already covered earlier in the document - see "Cross-Cutting Concerns" in Step 5)*

**Summary of Cross-Cutting Patterns:**
1. **Error Handling Strategy** - Consistent error format across all API routes
2. **API Response Format** - Standardized success/error responses
3. **Date/Time Handling** - UTC storage, date-fns for display
4. **Authentication Pattern** - NextAuth session checks in all protected routes
5. **Logging Strategy** - Pino structured logging with PII redaction
6. **Testing Strategy** - Unit → Integration → E2E test pyramid
7. **File Upload Handling** - Direct-to-R2 uploads with signed URLs
8. **Database Transaction Pattern** - Prisma transactions for multi-step operations

---

## Integration Points

### Critical Integration Points

**1. Database → All API Routes**
- **Integration:** Prisma client singleton pattern (`src/lib/prisma.ts`)
- **Connection pooling:** Neon handles connection pooling automatically
- **All API routes:** Import Prisma client from `@/lib/prisma`

**2. Authentication → Protected Routes**
- **Server Components:** `getServerSession()` from NextAuth
- **Client Components:** `useSession()` hook
- **API Routes:** Check session at start of handler

**3. File Storage → Upload/Download**
- **R2 client:** Singleton pattern (`src/lib/r2.ts`)
- **Upload flow:** Client → API (signed URL) → Direct to R2
- **Download flow:** API (signed URL) → Client downloads

**4. Rate Limiting → All API Routes**
- **Middleware:** Global rate limiting in `src/middleware.ts`
- **Per-IP and per-user limits:** Applied to all `/api/*` routes
- **Upstash Redis:** Serverless rate limit tracking

**5. Error Tracking → All Code**
- **Sentry initialization:** `src/lib/sentry.ts` (imported in app root)
- **Automatic capture:** Unhandled exceptions, API errors
- **Manual logging:** `Sentry.captureException()` with context

**6. Logging → All Services**
- **Pino logger:** Singleton pattern (`src/lib/logger.ts`)
- **Structured JSON:** All logs include context (userId, action, timestamp)
- **Vercel aggregation:** Automatic log collection

---

## Performance Considerations

### NFR001: Performance Targets

**Page Load Time:** < 2 seconds (p95)
- **Strategy:** Static generation where possible (SSG), Server Components for dynamic data
- **Optimization:** Image optimization (Next.js Image component), font optimization, code splitting

**API Response Time:** < 500ms (p95)
- **Strategy:** Database query optimization (Prisma includes/selects), Neon connection pooling
- **Optimization:** Add indexes to frequently queried columns, minimize N+1 queries

**Lighthouse Score:** > 80 (all metrics)
- **Strategy:** Follow Core Web Vitals best practices
- **Optimization:** Lazy load images, minimize JavaScript bundle, reduce layout shifts

### Performance Optimizations

**Database Query Optimization:**
```typescript
// ❌ N+1 query problem
const courses = await prisma.course.findMany();
for (const course of courses) {
  const instructor = await prisma.user.findUnique({ where: { id: course.instructorId } });
}

// ✅ Optimized with include
const courses = await prisma.course.findMany({
  include: { instructor: true }
});
```

**Image Optimization:**
```typescript
// ✅ Use Next.js Image component
import Image from 'next/image';

<Image
  src="/course-thumbnail.jpg"
  alt="Course thumbnail"
  width={300}
  height={200}
  loading="lazy"
/>
```

**Code Splitting:**
```typescript
// ✅ Dynamic imports for large components
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <Spinner />,
});
```

---

## Development Environment

### Prerequisites

- **Node.js:** 20.x or later
- **npm:** 10.x or later
- **PostgreSQL:** For local development (optional, can use Neon development branch)
- **Git:** Version control

### Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/your-org/ai-gurus-lms.git
cd ai-gurus-lms

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations (if using local PostgreSQL)
npx prisma migrate dev
# OR push schema to Neon development branch
npx prisma db push

# 6. Seed database with test data (optional)
npx prisma db seed

# 7. Start development server
npm run dev

# Access at http://localhost:3000
```

### Development Workflow

**Running Tests:**
```bash
npm test                  # Unit & integration tests
npm run test:watch        # Watch mode
npm run test:e2e          # E2E tests (headless)
npm run test:e2e:ui       # E2E tests with UI
npm run test:coverage     # Coverage report
```

**Database Management:**
```bash
npx prisma studio         # Visual database editor
npx prisma migrate dev    # Create migration
npx prisma migrate reset  # Reset database (⚠️ deletes data)
npx prisma db push        # Sync schema without migration
```

**Code Quality:**
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Fix linting issues
npm run format            # Format with Prettier (if configured)
```

**Building:**
```bash
npm run build             # Production build
npm run start             # Start production server
```

### Troubleshooting

**Issue: Database connection error**
- Check `DATABASE_URL` in `.env.local`
- Verify Neon instance is running
- Check network connectivity

**Issue: Tests failing**
- Ensure test database is set up
- Check test fixtures are up to date
- Run `npm run test:coverage` to identify missing coverage

**Issue: File uploads not working**
- Verify Cloudflare R2 credentials in `.env.local`
- Check R2 bucket names are correct
- Verify CORS configuration on R2 buckets

---

## Architecture Decision Records

### ADR-001: Database - Neon PostgreSQL

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Current SQLite database is development-only and cannot handle concurrent users in production. Need production-grade database with auto-scaling, backups, and high availability.

**Decision:**
Use Neon PostgreSQL via Vercel integration.

**Rationale:**
- Serverless architecture auto-scales with traffic (10 → 100 → 1000+ users)
- Free tier covers beta launch (100 compute hours/month, 0.5GB storage)
- Seamless Vercel integration (native marketplace integration)
- Database branching enables instant test databases per story
- Point-in-time restore (6hr free, 7-day on Scale plan)
- Prisma compatibility with zero code changes (just change provider)

**Consequences:**
- **Positive:** Zero infrastructure management, auto-scaling, predictable pricing
- **Negative:** Vendor lock-in (mitigated by Prisma abstraction), free tier limits (manageable for beta)
- **Cost:** Free for beta → $19/month for production (Scale plan)

**Alternatives Considered:**
- Supabase: More features than needed (auth, storage - already have solutions)
- Railway: No free tier, higher baseline cost
- AWS RDS: Complex setup, expensive, overkill for project

---

### ADR-002: File Storage - Cloudflare R2

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Local file storage not scalable. Need S3-compatible object storage with CDN for course videos and assignment files. Egress fees are a concern (videos downloaded repeatedly).

**Decision:**
Use Cloudflare R2 with zero egress fees.

**Rationale:**
- **Zero egress fees** - Unlimited downloads at no extra cost (huge savings for video content)
- Generous free tier (10GB storage vs 1GB with Vercel Blob)
- S3-compatible API (easy migration if needed, use @aws-sdk/client-s3)
- Global CDN included automatically
- Cheapest storage ($0.015/GB vs $0.023/GB for competitors)

**Consequences:**
- **Positive:** Significant cost savings (esp. video streaming), generous free tier
- **Negative:** Separate service to manage (not Vercel-native), requires 30-60 min setup
- **Cost:** Free for beta → ~$5/month for production (beyond 10GB)

**Alternatives Considered:**
- Vercel Blob: Only 1GB free (insufficient for video content), egress fees
- AWS S3: Expensive egress fees ($0.09/GB), complex pricing

---

### ADR-003: Hosting - Vercel

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Need production hosting for Next.js 15 application with 99.5%+ uptime, automatic deployments, and preview environments.

**Decision:**
Use Vercel (makers of Next.js).

**Rationale:**
- Made for Next.js (perfect integration, zero config)
- Seamless Neon database integration (marketplace integration)
- Free Hobby plan for beta (100GB bandwidth, 100k function invocations)
- Automatic Git deployments (push to main → production deploy)
- Preview deployments per PR (isolated testing)
- Production-grade reliability (99.5%+ uptime SLA)

**Consequences:**
- **Positive:** Zero-config deployment, automatic preview environments, best Next.js performance
- **Negative:** Hobby plan for non-commercial only (need Pro $20/mo for production)
- **Cost:** Free for beta → $20/month Pro for production

**Alternatives Considered:**
- Railway: Cheaper at scale but not Next.js-optimized
- Render: Good for steady traffic but slower cold starts

---

### ADR-004: Error Tracking - Sentry

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Need to capture JavaScript errors, API failures, and database crashes with stack traces and user context for debugging.

**Decision:**
Use Sentry with official Vercel integration.

**Rationale:**
- Official Vercel + Next.js integration (1-line setup)
- Free tier covers beta (5,000 errors/month)
- Session replay captures user actions leading to errors
- Source maps show TypeScript stack traces (not compiled JS)
- Automatic error grouping and alerting (Slack/email)

**Consequences:**
- **Positive:** Comprehensive error tracking, session replay for debugging
- **Negative:** Paid plan required for production ($29/month)
- **Cost:** Free for beta → $29/month for production

**Alternatives Considered:**
- LogRocket: More expensive, similar features
- Rollbar: Less Next.js integration, more manual setup

---

### ADR-005: Testing - Jest + Playwright

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Zero test coverage currently. Need unit tests (business logic), integration tests (API routes), and E2E tests (user journeys) to achieve 70%+ coverage.

**Decision:**
Use Jest for unit/integration tests, Playwright for E2E tests.

**Rationale:**
- Jest is de facto standard for React/Next.js (React Testing Library integration)
- Playwright is fastest, most reliable E2E framework (better than Cypress for Next.js)
- Both officially supported by Next.js
- Both specified in PRD requirements (FR024)

**Consequences:**
- **Positive:** Industry-standard tools, excellent Next.js support, free
- **Negative:** Learning curve for Playwright Page Object Model
- **Cost:** Free (open-source)

**Alternatives Considered:**
- Vitest: Faster but less mature for Next.js
- Cypress: Slower, flakier than Playwright

---

### ADR-006: Rate Limiting - Upstash Rate Limit

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Need rate limiting to prevent abuse and DoS attacks (PRD requirement: 100 req/min per IP, 200 req/min per user).

**Decision:**
Use Upstash Rate Limit (serverless Redis).

**Rationale:**
- Serverless (no Redis server to manage)
- Free tier covers beta (2,500 requests/day for limit checks)
- Vercel Edge compatible (fast edge middleware)
- Simple API (few lines of code)

**Consequences:**
- **Positive:** Zero infrastructure management, serverless, low latency
- **Negative:** Free tier limit (2,500/day - sufficient for beta but might need paid for production)
- **Cost:** Free for beta → ~$10/month for production

**Alternatives Considered:**
- Vercel Edge Middleware with manual implementation: Complex, no rate limit state persistence
- Express-rate-limit: Not serverless-compatible

---

### ADR-007: Input Validation - Zod

**Status:** Accepted
**Date:** 2025-11-24
**Deciders:** Ed

**Context:**
Need input validation to prevent injection attacks and data corruption (PRD requirement FR006).

**Decision:**
Use Zod for schema validation.

**Rationale:**
- TypeScript-first (schemas infer TypeScript types)
- Specified in PRD requirements
- Industry standard for Next.js/TypeScript projects
- Excellent error messages for debugging
- Integrates with Prisma (shared types)

**Consequences:**
- **Positive:** Type safety, excellent DX, prevents injection attacks
- **Negative:** Verbose schemas for complex objects
- **Cost:** Free (open-source)

**Alternatives Considered:**
- Yup: Less TypeScript-friendly
- Joi: Not TypeScript-first

---

## Summary

This architecture document defines the complete technical foundation for transforming AI Gurus LMS into a production-ready platform. All architectural decisions, patterns, and structures are documented to ensure consistency across 34 stories implemented by multiple AI agents.

**Key Architecture Highlights:**
- **Brownfield Enhancement:** Preserves Next.js 15 + React 19 + Prisma foundation
- **Serverless Stack:** Neon PostgreSQL + Cloudflare R2 + Vercel for auto-scaling
- **Cost-Effective:** $0/month for beta, $87/month for production (1000+ users)
- **Production-Grade:** 99.5%+ uptime, 70%+ test coverage, comprehensive monitoring
- **AI Agent Consistency:** Strict implementation patterns ensure code compatibility

**Next Steps:**
1. Review and approve this architecture document
2. Mark workflow status: `architecture-review: complete`
3. Proceed to Epic 1, Story 1.1: PostgreSQL Setup & Configuration

---

**Document Status:** ✅ Complete and Validated
**Validation Date:** 2025-11-24
**Approved By:** Ed

---

**Generated by:** BMM Decision Architecture Workflow
**Maintained by:** Development Team
**Questions?** Refer to sections above or consult PRD.md and epics.md
