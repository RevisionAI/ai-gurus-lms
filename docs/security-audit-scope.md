# Security Audit Scope Document

**Prepared For:** External Security Auditor
**Application:** AI Gurus LMS
**Version:** MVP Beta
**Date:** 2025-11-25
**Contact:** AI Gurus Dev Team

---

## 1. Executive Summary

AI Gurus LMS is a Learning Management System built with Next.js 15, designed for educational institutions to manage courses, assignments, and student engagement. This document provides the scope and technical details for a security audit.

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 15.x |
| Runtime | Node.js | 18+ |
| Authentication | NextAuth.js | 4.x |
| Database | PostgreSQL (Neon) | 15 |
| ORM | Prisma | 5.x |
| File Storage | Cloudflare R2 (S3-compatible) | - |
| Rate Limiting | Upstash Redis | - |
| Hosting | Vercel | - |

### Application Type

- Multi-tenant web application
- Three user roles: Student, Instructor, Admin
- File upload functionality (assignments, course content)
- Rich text content editing

---

## 2. API Endpoints (47 endpoints)

### 2.1 Authentication Endpoints

| Endpoint | Methods | Auth Required | Description |
|----------|---------|---------------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | No | NextAuth.js handler (login, logout, session) |
| `/api/auth/register` | POST | No | User registration |

### 2.2 Health Check Endpoints

| Endpoint | Methods | Auth Required | Description |
|----------|---------|---------------|-------------|
| `/api/health/db` | GET | No | Database connectivity check |

### 2.3 Upload Endpoints

| Endpoint | Methods | Auth Required | Description |
|----------|---------|---------------|-------------|
| `/api/upload/signed-url` | POST | Yes (Any) | Generate pre-signed URL for S3 upload |
| `/api/upload/complete` | POST | Yes (Any) | Confirm upload completion |

### 2.4 Student Endpoints

| Endpoint | Methods | Auth Required | Role | Description |
|----------|---------|---------------|------|-------------|
| `/api/student/courses` | GET | Yes | STUDENT | List enrolled courses |
| `/api/student/courses/[id]` | GET | Yes | STUDENT | View course details |
| `/api/student/courses/[id]/content` | GET | Yes | STUDENT | View course content |
| `/api/student/courses/[id]/assignments` | GET | Yes | STUDENT | List course assignments |
| `/api/student/courses/[id]/announcements` | GET | Yes | STUDENT | List course announcements |
| `/api/student/courses/[id]/discussions` | GET | Yes | STUDENT | List course discussions |
| `/api/student/courses/[id]/discussions/[discussionId]` | GET | Yes | STUDENT | View discussion details |
| `/api/student/courses/[id]/discussions/[discussionId]/posts` | GET, POST | Yes | STUDENT | List/create discussion posts |
| `/api/student/courses/[id]/discussions/[discussionId]/posts/[postId]` | PUT, DELETE | Yes | STUDENT | Edit/delete own posts |
| `/api/student/available-courses` | GET | Yes | STUDENT | List courses available for enrollment |
| `/api/student/enroll` | POST | Yes | STUDENT | Enroll in a course |
| `/api/student/assignments/upcoming` | GET | Yes | STUDENT | List upcoming assignments |
| `/api/student/assignments/[id]` | GET | Yes | STUDENT | View assignment details |
| `/api/student/assignments/[id]/submission` | GET, POST | Yes | STUDENT | View/submit assignment |
| `/api/student/assignments/[id]/upload` | POST | Yes | STUDENT | Upload assignment file |
| `/api/student/assignments/[id]/grade` | GET | Yes | STUDENT | View grade for assignment |
| `/api/student/announcements/recent` | GET | Yes | STUDENT | List recent announcements |

### 2.5 Instructor Endpoints

| Endpoint | Methods | Auth Required | Role | Description |
|----------|---------|---------------|------|-------------|
| `/api/instructor/courses` | GET, POST | Yes | INSTRUCTOR | List/create courses |
| `/api/instructor/courses/[id]` | GET, PUT, DELETE | Yes | INSTRUCTOR | View/update/delete course |
| `/api/instructor/courses/[id]/content` | GET, POST | Yes | INSTRUCTOR | List/add course content |
| `/api/instructor/courses/[id]/content/[contentId]` | PUT, DELETE | Yes | INSTRUCTOR | Edit/delete content |
| `/api/instructor/courses/[id]/content/reorder` | POST | Yes | INSTRUCTOR | Reorder content items |
| `/api/instructor/courses/[id]/assignments` | GET, POST | Yes | INSTRUCTOR | List/create assignments |
| `/api/instructor/courses/[id]/announcements` | GET, POST | Yes | INSTRUCTOR | List/create announcements |
| `/api/instructor/courses/[id]/announcements/[announcementId]` | PUT, DELETE | Yes | INSTRUCTOR | Edit/delete announcement |
| `/api/instructor/courses/[id]/discussions` | GET, POST | Yes | INSTRUCTOR | List/create discussions |
| `/api/instructor/courses/[id]/discussions/[discussionId]` | PUT, DELETE | Yes | INSTRUCTOR | Edit/delete discussion |
| `/api/instructor/courses/[id]/enrollments` | GET, POST, DELETE | Yes | INSTRUCTOR | Manage course enrollments |
| `/api/instructor/courses/[id]/upload` | POST | Yes | INSTRUCTOR | Upload course file |
| `/api/instructor/courses/[id]/upload-thumbnail` | POST | Yes | INSTRUCTOR | Upload course thumbnail |
| `/api/instructor/courses/[id]/youtube-info` | GET | Yes | INSTRUCTOR | Fetch YouTube video info |
| `/api/instructor/assignments/recent` | GET | Yes | INSTRUCTOR | List recent assignments |
| `/api/instructor/assignments/[id]` | GET, PUT, DELETE | Yes | INSTRUCTOR | View/update/delete assignment |
| `/api/instructor/assignments/[id]/submissions` | GET | Yes | INSTRUCTOR | List assignment submissions |
| `/api/instructor/assignments/[id]/submissions/[submissionId]` | GET | Yes | INSTRUCTOR | View submission details |
| `/api/instructor/assignments/[id]/submissions/[submissionId]/grade` | POST, PUT | Yes | INSTRUCTOR | Grade submission |

### 2.6 Admin Endpoints

| Endpoint | Methods | Auth Required | Role | Description |
|----------|---------|---------------|------|-------------|
| `/api/admin/dashboard/stats` | GET | Yes | ADMIN | System statistics |
| `/api/admin/deleted-records` | GET | Yes | ADMIN | List soft-deleted records |
| `/api/admin/deleted-records/[id]/restore` | POST | Yes | ADMIN | Restore deleted record |

### 2.7 Shared Endpoints

| Endpoint | Methods | Auth Required | Description |
|----------|---------|---------------|-------------|
| `/api/courses` | GET | No | List all courses (public) |
| `/api/users/search` | GET | Yes | Search users |
| `/api/users/students` | GET | Yes | List students |

---

## 3. Authentication Flow

### 3.1 User Registration

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John",
  "surname": "Doe",
  "cellNumber": "+1234567890",
  "company": "ABC Corp",
  "position": "Developer",
  "workAddress": "123 Main St"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### 3.2 Login Flow (NextAuth Credentials)

```
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=SecurePass123
```

**Rate Limiting:** 5 failed attempts per email per 15 minutes

### 3.3 Session Management

- **Strategy:** JWT tokens
- **Storage:** Browser memory (httpOnly cookies)
- **Validation:** `getServerSession()` on API routes
- **Client Hook:** `useSession()` for React components

### 3.4 Session Token Structure

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "STUDENT"
}
```

---

## 4. Authorization Patterns

### 4.1 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| STUDENT | View enrolled courses, submit assignments, participate in discussions |
| INSTRUCTOR | Manage own courses, grade assignments, create content |
| ADMIN | System administration, view/restore deleted records |

### 4.2 Authorization Code Pattern

**Server-Side (API Routes):**
```typescript
const session = await getServerSession(authOptions)

// Authentication check
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Role check
if (session.user.role !== 'INSTRUCTOR') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Resource ownership check (instructors)
const course = await prisma.course.findUnique({ where: { id } })
if (course.instructorId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Client-Side:**
```typescript
const { data: session, status } = useSession()
if (status === 'unauthenticated') {
  router.push('/login')
}
```

---

## 5. File Upload Workflow

### 5.1 Pre-Signed URL Flow (Cloudflare R2)

```
1. Client → POST /api/upload/signed-url { filename, contentType, context }
2. Server validates request, generates pre-signed URL
3. Server → Client { uploadUrl, key, expiresAt }
4. Client uploads directly to R2 using signed URL
5. Client → POST /api/upload/complete { key, context }
6. Server validates upload, stores metadata in database
```

### 5.2 File Validation

| Validation | Implementation |
|------------|----------------|
| File Size | 50MB default (configurable per type) |
| MIME Type | Allowlist based on context (image/*, video/*, application/pdf) |
| Filename | Sanitized, UUID-prefixed |
| URL Expiration | Signed URLs expire after 1 hour |

### 5.3 Content Types Allowed

| Context | Allowed MIME Types | Max Size |
|---------|-------------------|----------|
| Assignment Submission | Any | 50MB |
| Course Content | video/*, application/pdf, image/* | 50MB |
| Course Thumbnail | image/jpeg, image/png, image/webp | 5MB |

---

## 6. Rate Limiting Configuration

### 6.1 Global Rate Limits

| Type | Limit | Window | Implementation |
|------|-------|--------|----------------|
| IP-based | 100 requests | 1 minute | Middleware (Edge) |
| User-based | 200 requests | 1 minute | API route helper |
| Login | 5 attempts | 15 minutes | Auth provider |

### 6.2 Rate Limit Response

```json
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-25T10:31:00.000Z
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-11-25T10:31:00.000Z",
      "retryAfter": 60
    }
  }
}
```

---

## 7. Data Protection

### 7.1 Encryption

| Data | Protection |
|------|------------|
| Passwords | bcrypt hash (10+ salt rounds) |
| Data at Rest | Neon PostgreSQL (encrypted) |
| Data in Transit | TLS 1.3 (Vercel automatic) |
| Session Tokens | JWT signed with NEXTAUTH_SECRET |
| File Storage | R2 server-side encryption |

### 7.2 Soft Deletes

All user-facing data supports soft delete with audit trail:

- User
- Course (cascade: assignments, discussions, content, announcements)
- Assignment
- Grade
- Discussion
- CourseContent
- Announcement

**Retention Period:** 1 year from deletion
**Admin Access:** `/admin/deleted-records` UI

### 7.3 Data Access Patterns

```typescript
// Standard queries exclude deleted records
const courses = await prisma.course.findMany({
  where: { ...notDeleted }
})

// Admin queries can include deleted records
const deletedCourses = await prisma.course.findMany({
  where: { ...onlyDeleted }
})
```

---

## 8. Input Validation

### 8.1 Validation Framework

All API inputs validated with Zod schemas.

### 8.2 Validation Coverage

| Domain | Schema | Validation Rules |
|--------|--------|-----------------|
| User Registration | `registerUserSchema` | Email format, password strength, required fields |
| Course Creation | `createCourseSchema` | Title, code uniqueness, semester/year validation |
| Assignment | `createAssignmentSchema` | Title, due date validation |
| Grade | `gradeSubmissionSchema` | Points range, feedback length |
| File Upload | `signedUrlRequestSchema` | Filename sanitization, MIME type validation |

### 8.3 Example Validation

```typescript
// Request validation
const body = await request.json()
const result = createCourseSchema.safeParse(body)

if (!result.success) {
  return NextResponse.json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: result.error.flatten()
    }
  }, { status: 400 })
}
```

---

## 9. Security Controls Summary

### 9.1 Implemented Controls

| Control | Implementation | Status |
|---------|----------------|--------|
| Authentication | NextAuth.js with credentials provider | ✅ |
| Authorization | RBAC with role/ownership checks | ✅ |
| Rate Limiting | Upstash Redis (IP, user, login) | ✅ |
| Input Validation | Zod schemas on all mutations | ✅ |
| SQL Injection Prevention | Prisma ORM (parameterized queries) | ✅ |
| XSS Prevention | React JSX escaping | ✅ |
| HTTPS | Vercel automatic | ✅ |
| Password Hashing | bcrypt | ✅ |
| Soft Deletes | Audit trail for compliance | ✅ |
| File Upload Validation | MIME type, size limits | ✅ |
| Signed URLs | Pre-signed S3/R2 URLs | ✅ |

### 9.2 Pending Controls (Story 1.10)

| Control | Status |
|---------|--------|
| Content Security Policy | Implementing |
| Security Headers (X-Frame-Options, etc.) | Implementing |
| npm Vulnerability Fixes | Pending |

---

## 10. Test Environment

### 10.1 Access for Auditor

- **Development URL:** [To be provided]
- **Test Credentials:** [To be provided separately via secure channel]
  - Admin account
  - Instructor account
  - Student account

### 10.2 Test Data

- Sample courses with content
- Sample assignments with submissions
- Sample discussions with posts
- Soft-deleted records for testing restore

---

## 11. Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| npm vulnerabilities (next, next-auth) | P1 | Remediation pending |
| CSP headers not configured | P2 | Implementing in Story 1.10 |
| Security headers not configured | P2 | Implementing in Story 1.10 |

---

## 12. Out of Scope

The following are NOT in scope for this audit:

- Third-party integrations (YouTube API)
- Vercel platform security
- Neon PostgreSQL platform security
- Cloudflare R2 platform security
- Upstash Redis platform security

---

## 13. Contact Information

For questions during the audit:

- **Technical Contact:** AI Gurus Dev Team
- **Security Contact:** [To be provided]
- **Emergency Contact:** [To be provided]

---

## 14. References

- [OWASP Top 10 Review](security-owasp-top-10.md)
- [Security Gap Analysis](security-gap-analysis.md)
- [Data Retention Policy](data-retention-policy.md)
- [API Contracts](api-contracts.md)
- [Architecture Document](architecture.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-25
