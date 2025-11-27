# Epic Technical Specification: Feature Completion & Admin Capabilities

Date: 2025-11-26
Author: Ed
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 completes the partially implemented features critical for achieving feature parity with the current Notion-based AI Fluency Program delivery while adding essential administrative capabilities for production operations. The gradebook, admin dashboard, and GPA calculation represent core daily-use functionality that instructors and administrators depend on. Without these complete, the platform cannot professionally replace Notion for program delivery.

This epic builds on the infrastructure foundation from Epic 1 (PostgreSQL, Cloudflare R2, rate limiting, input validation) and leverages the testing infrastructure from Epic 1.5 (Jest, Playwright, CI/CD). Each story follows test-driven development principles with automated CI/CD validation on every PR, catching bugs immediately rather than during later testing phases.

The epic addresses three key capability gaps:
1. **Gradebook System** (Stories 2.1-2.3): Complete the grid view, inline editing, filtering, and CSV export for efficient instructor grading workflows
2. **Admin Dashboard** (Stories 2.5-2.6): Provide user management and system statistics for operational oversight
3. **Supporting Features** (Stories 2.4, 2.7-2.8): GPA calculation, feedback templates, and course prerequisites for enhanced user experience

## Objectives and Scope

**In Scope:**

- Gradebook grid view displaying students x assignments matrix with color-coded status indicators
- Inline grade editing with confirmation dialogs and optimistic UI updates
- Gradebook filtering (by student, assignment, date, status) and CSV export functionality
- GPA calculation engine with configurable grading scale (4.0 default)
- Admin user management interface (CRUD operations, role management, soft delete)
- Admin dashboard with real-time system statistics and activity metrics
- Feedback template library for instructors with placeholder support
- Course prerequisites, learning objectives, and target audience display on enrollment pages

**Out of Scope:**

- Email notifications (deferred to post-MVP)
- Advanced analytics and reporting dashboards (deferred to post-MVP)
- Automated quiz/assessment builder (deferred to post-MVP)
- API pagination and versioning (deferred to post-MVP)
- Certificate generation (deferred to post-MVP)
- Mobile-specific UI optimizations (responsive web sufficient for MVP)

**Success Criteria:**

- All 8 stories completed with unit, integration, and E2E tests
- Gradebook grid loads within 2 seconds for 50 students x 20 assignments
- GPA calculation accurate to 2 decimal places
- Admin dashboard displays real-time statistics (< 5 minute cache)
- All new endpoints include Zod validation schemas
- CI/CD validation passes on all PRs

## System Architecture Alignment

**Existing Architecture Preserved:**
- Full-stack Next.js 15 monolith with App Router
- Prisma 6.9 ORM with Neon PostgreSQL
- Cloudflare R2 for file storage (existing upload API)
- NextAuth 4.24 with database sessions

**New Components Introduced:**

| Component | Location | Purpose |
|-----------|----------|---------|
| GradebookGrid | `/src/components/gradebook/` | Student x assignment matrix display |
| GradebookCell | `/src/components/gradebook/` | Inline editing cell with validation |
| GPA Calculator | `/src/lib/gpa.ts` | Weighted grade calculation logic |
| Admin Dashboard | `/src/app/admin/` | User management and system stats |
| FeedbackTemplate Model | `prisma/schema.prisma` | Template storage and retrieval |

**API Endpoints Added:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/instructor/gradebook/[courseId]` | GET | Fetch gradebook matrix data |
| `/api/instructor/gradebook/[courseId]/grade` | PUT | Update individual grade |
| `/api/instructor/gradebook/[courseId]/export` | GET | Generate CSV export |
| `/api/instructor/templates` | GET/POST | Template CRUD |
| `/api/admin/users` | GET/POST/PUT/DELETE | User management |
| `/api/admin/stats/detailed` | GET | System statistics |

**Database Schema Alignment:**
- Uses existing Grade, Assignment, Submission, User models
- Adds FeedbackTemplate model (new)
- Extends Course model with prerequisites, learningObjectives, targetAudience fields

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| **GradebookService** | Aggregate grades into matrix format, handle inline updates | courseId, filters | GradebookMatrix, UpdateResult | Backend |
| **GPACalculator** | Calculate weighted GPA per course and overall | grades[], grading scale | GPA number (0-4.0) | Shared lib |
| **FeedbackTemplateService** | CRUD operations for instructor templates | template data, instructorId | Template objects | Backend |
| **AdminUserService** | User management with role validation | user data, adminId | User objects | Backend |
| **AdminStatsService** | Aggregate system statistics with caching | date range | StatsObject | Backend |
| **CSVExporter** | Generate CSV from gradebook data | GradebookMatrix, filters | CSV blob | Backend |

**Component Hierarchy (Frontend):**

```
GradebookPage
├── GradebookFilters (search, dropdown, date picker)
├── GradebookGrid
│   ├── GradebookHeader (assignment columns)
│   └── GradebookRow[]
│       └── GradebookCell (editable grade cell)
├── ExportButton (CSV download)
└── GPADisplay (course GPA summary)

AdminDashboard
├── StatsOverview (metric cards)
├── ActivityFeed (recent actions)
├── UserManagement
│   ├── UserTable (sortable, filterable)
│   ├── UserCreateModal
│   └── UserEditModal
└── SystemHealth (connection indicators)
```

### Data Models and Contracts

**New Model: FeedbackTemplate**

```prisma
model FeedbackTemplate {
  id           String   @id @default(cuid())
  name         String
  category     String   // "excellent" | "needs-improvement" | "missing-requirements" | "late"
  template     String   // Template text with placeholders
  instructorId String
  instructor   User     @relation("InstructorTemplates", fields: [instructorId], references: [id])
  isShared     Boolean  @default(false)
  usageCount   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("feedback_templates")
}
```

**Course Model Extension:**

```prisma
model Course {
  // ... existing fields ...
  prerequisites      String?   // Text describing prerequisites
  learningObjectives String[]  // Array of learning objectives
  targetAudience     String?   // Description of target audience
}
```

**TypeScript Interfaces:**

```typescript
// Gradebook Matrix Type
interface GradebookMatrix {
  students: {
    id: string;
    name: string;
    email: string;
    grades: {
      assignmentId: string;
      score: number | null;
      status: 'graded' | 'pending' | 'late' | 'missing';
      submissionId: string | null;
    }[];
    totalPoints: number;
    percentage: number;
    gpa: number | null;
  }[];
  assignments: {
    id: string;
    title: string;
    maxPoints: number;
    dueDate: Date;
  }[];
}

// GPA Calculation Input
interface GradeInput {
  points: number;
  maxPoints: number;
  weight: number;
}

// Admin Stats Response
interface SystemStats {
  users: { total: number; students: number; instructors: number; admins: number };
  courses: { total: number; active: number; inactive: number };
  enrollments: number;
  assignments: { total: number; submissions: number };
  discussions: { total: number; posts: number };
  recentActivity: {
    logins: number;
    enrollments: number;
    submissions: number;
  };
  systemHealth: {
    database: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    apiLatency: number;
  };
}
```

### APIs and Interfaces

**GET /api/instructor/gradebook/[courseId]**

```typescript
// Request
GET /api/instructor/gradebook/cs101
Query: {
  studentFilter?: string;    // Student name search
  assignmentId?: string;     // Filter to single assignment
  status?: 'all' | 'graded' | 'pending' | 'late' | 'missing';
  dateFrom?: string;         // ISO date string
  dateTo?: string;           // ISO date string
}

// Response 200
{
  data: GradebookMatrix
}

// Error 403
{
  error: {
    code: "FORBIDDEN",
    message: "Not instructor for this course"
  }
}
```

**PUT /api/instructor/gradebook/[courseId]/grade**

```typescript
// Request
PUT /api/instructor/gradebook/cs101/grade
Body: {
  assignmentId: string;
  studentId: string;
  score: number;
  feedback?: string;
}

// Response 200
{
  data: {
    gradeId: string;
    previousScore: number | null;
    newScore: number;
    updatedAt: string;
  }
}

// Error 400
{
  error: {
    code: "INVALID_INPUT",
    message: "Score exceeds maximum points",
    details: { max: 100, received: 150 }
  }
}
```

**GET /api/instructor/gradebook/[courseId]/export**

```typescript
// Request
GET /api/instructor/gradebook/cs101/export
Query: { /* Same filters as gradebook GET */ }

// Response 200
Headers: {
  Content-Type: "text/csv",
  Content-Disposition: "attachment; filename=CS101_grades_2025-11-26.csv"
}
Body: CSV file content
```

**CRUD /api/instructor/templates**

```typescript
// GET - List templates
GET /api/instructor/templates
Response: { data: FeedbackTemplate[] }

// POST - Create template
POST /api/instructor/templates
Body: { name, category, template, isShared? }
Response: { data: FeedbackTemplate }

// PUT - Update template
PUT /api/instructor/templates/[id]
Body: { name?, category?, template?, isShared? }
Response: { data: FeedbackTemplate }

// DELETE - Remove template
DELETE /api/instructor/templates/[id]
Response: { data: { deleted: true } }
```

**CRUD /api/admin/users**

```typescript
// GET - List users
GET /api/admin/users
Query: { search?, role?, page?, limit? }
Response: { data: User[], meta: { total, page, pageSize } }

// POST - Create user
POST /api/admin/users
Body: { name, email, role, password? }
Response: { data: User }

// PUT - Update user
PUT /api/admin/users/[id]
Body: { name?, email?, role?, isActive? }
Response: { data: User }

// DELETE - Soft delete user
DELETE /api/admin/users/[id]
Response: { data: { deleted: true, deletedAt: string } }
```

**GET /api/admin/stats/detailed**

```typescript
// Request
GET /api/admin/stats/detailed

// Response 200
{
  data: SystemStats
}
```

### Workflows and Sequencing

**Gradebook Inline Editing Flow:**

```
1. Instructor double-clicks grade cell
   → Cell enters edit mode (input field appears)

2. Instructor enters new grade, presses Enter
   → Validate: numeric, non-negative, <= maxPoints
   → If invalid: show error tooltip, remain in edit mode

3. Confirmation dialog appears
   → "Update grade from [old] to [new]?"
   → [Yes] [Cancel] buttons

4a. User clicks Cancel
    → Cell reverts to original value
    → Edit mode exits

4b. User clicks Yes
    → Optimistic UI update (cell shows new value immediately)
    → API call: PUT /api/instructor/gradebook/[courseId]/grade

5a. API success
    → Cell confirms update (brief green highlight)
    → GPA recalculated and displayed

5b. API failure
    → Cell reverts to original value
    → Error toast displayed
    → Error logged to Sentry
```

**GPA Calculation Algorithm:**

```
Input: grades[] where each grade has {points, maxPoints, weight}

1. Filter out null/missing grades
2. If no grades remain → return null

3. For each grade:
   percentage = (points / maxPoints) * 100

4. Calculate weighted average:
   weightedSum = Σ(percentage × weight)
   totalWeight = Σ(weight)
   avgPercentage = weightedSum / totalWeight

5. Convert to 4.0 scale (configurable):
   if avgPercentage >= 93 → 4.0
   if avgPercentage >= 90 → 3.7
   if avgPercentage >= 87 → 3.3
   if avgPercentage >= 83 → 3.0
   if avgPercentage >= 80 → 2.7
   if avgPercentage >= 77 → 2.3
   if avgPercentage >= 73 → 2.0
   if avgPercentage >= 70 → 1.7
   if avgPercentage >= 67 → 1.3
   if avgPercentage >= 63 → 1.0
   if avgPercentage >= 60 → 0.7
   else → 0.0

6. Return GPA rounded to 2 decimal places
```

**Admin User Management Flow:**

```
1. Admin navigates to /admin/users
   → GET /api/admin/users fetches paginated list
   → UserTable renders with search/filter controls

2. Admin clicks "Create User"
   → UserCreateModal opens
   → Form: name, email, role (dropdown), generate password?

3. Admin submits form
   → Validate with Zod schema
   → POST /api/admin/users
   → Success: toast notification, table refreshes
   → Failure: error message in modal

4. Admin clicks user row → edit
   → UserEditModal opens with current data
   → Role change triggers confirmation dialog

5. Admin clicks "Deactivate"
   → Confirmation dialog: "Deactivate [name]?"
   → DELETE /api/admin/users/[id] (soft delete)
   → User row shows "Inactive" badge
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Gradebook grid load | < 2 seconds (p95) | 50 students × 20 assignments dataset |
| Grade update API | < 500ms (p95) | Measured via Vercel Analytics |
| Admin dashboard load | < 2 seconds (p95) | Including all stat aggregations |
| CSV export generation | < 5 seconds | For 100 students × 30 assignments |
| GPA calculation | < 100ms | Per-student calculation |

**Performance Optimizations:**

- Gradebook query uses Prisma `include` to avoid N+1 queries
- Admin stats cached for 5 minutes (invalidated on write operations)
- CSV generation streams data to avoid memory pressure
- GPA calculation memoized per student per session
- Gradebook grid uses virtualization for datasets > 50 rows

### Security

| Requirement | Implementation |
|-------------|----------------|
| Authorization | All gradebook endpoints verify instructor owns course |
| Admin-only routes | Admin endpoints check `session.user.role === 'ADMIN'` |
| Input validation | All POST/PUT endpoints use Zod schemas |
| Grade tampering prevention | Audit trail via `updatedAt` and `gradedBy` fields |
| Soft delete compliance | User deactivation sets `deletedAt`, data retained 1 year |
| Role change protection | Role changes require confirmation dialog + audit log |

**Zod Schema Examples:**

```typescript
// Grade update validation
const gradeUpdateSchema = z.object({
  assignmentId: z.string().cuid(),
  studentId: z.string().cuid(),
  score: z.number().min(0).max(1000),  // Max enforced per-assignment
  feedback: z.string().max(5000).optional(),
});

// User create validation
const userCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
  password: z.string().min(8).optional(),  // Auto-generated if not provided
});

// Feedback template validation
const feedbackTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['excellent', 'needs-improvement', 'missing-requirements', 'late']),
  template: z.string().min(1).max(2000),
  isShared: z.boolean().optional(),
});
```

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Optimistic UI | Grade updates show immediately, rollback on API failure |
| Error recovery | Failed grade updates display toast with retry option |
| Data consistency | Grade updates use Prisma transactions |
| Graceful degradation | Admin stats show cached data if aggregation fails |
| Conflict handling | Grade edit shows warning if another instructor modified since load |

**Error Handling Strategy:**

```typescript
// Gradebook update with optimistic UI
async function updateGrade(data: GradeUpdate) {
  // 1. Optimistically update UI
  setGrades(prev => updateGradeOptimistic(prev, data));

  try {
    // 2. Call API
    const result = await fetch('/api/instructor/gradebook/grade', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(await result.text());
    }

    // 3. Confirm update
    toast.success('Grade updated');

  } catch (error) {
    // 4. Rollback on failure
    setGrades(prev => rollbackGrade(prev, data));
    toast.error('Failed to update grade. Please try again.');
    Sentry.captureException(error);
  }
}
```

### Observability

| Signal | Implementation |
|--------|----------------|
| Grade changes | Log: `{ action: 'grade_update', courseId, assignmentId, studentId, oldScore, newScore, gradedBy }` |
| User management | Log: `{ action: 'user_created' \| 'user_updated' \| 'user_deactivated', userId, adminId, changes }` |
| Admin dashboard access | Log: `{ action: 'admin_dashboard_view', adminId, timestamp }` |
| Export operations | Log: `{ action: 'gradebook_export', courseId, instructorId, rowCount, fileSize }` |
| Error tracking | Sentry captures: API errors, validation failures, permission denials |

**Structured Logging Example:**

```typescript
import { logger } from '@/lib/logger';

// Grade update logging
logger.info({
  action: 'grade_update',
  courseId,
  assignmentId,
  studentId,
  oldScore: previousGrade?.score ?? null,
  newScore: score,
  gradedBy: session.user.id,
  timestamp: new Date().toISOString(),
}, 'Grade updated');

// Admin action logging
logger.info({
  action: 'user_role_changed',
  targetUserId: userId,
  previousRole,
  newRole,
  changedBy: session.user.id,
}, 'User role changed');
```

## Dependencies and Integrations

### Existing Dependencies (No Changes Required)

| Package | Version | Purpose in Epic 2 |
|---------|---------|-------------------|
| `@prisma/client` | ^6.9.0 | Database queries for gradebook, user management |
| `next-auth` | ^4.24.11 | Session authentication for all endpoints |
| `zod` | ^4.1.13 | Input validation schemas |
| `react-hot-toast` | ^2.5.2 | Success/error notifications |
| `lucide-react` | ^0.514.0 | Icons for UI components |
| `@radix-ui/react-dialog` | ^1.1.14 | Confirmation dialogs for grade/user actions |
| `@radix-ui/react-dropdown-menu` | ^2.1.15 | Filter dropdowns, template selection |
| `@radix-ui/react-tabs` | ^1.1.12 | Admin dashboard tabbed navigation |
| `date-fns` | ^4.1.0 | Date formatting in gradebook, CSV export |
| `@upstash/ratelimit` | ^2.0.7 | Rate limiting on new API endpoints |

### New Dependencies (To Be Added)

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| None required | - | Epic 2 uses existing dependencies | - |

**Note:** All required functionality can be implemented with existing packages. The gradebook grid, CSV export, and GPA calculation use standard React patterns without additional libraries.

### Integration Points

| Integration | Direction | Protocol | Purpose |
|-------------|-----------|----------|---------|
| Prisma → Neon PostgreSQL | Outbound | TCP/SSL | Grade, user, template CRUD |
| NextAuth → Session Store | Bidirectional | HTTP | Authentication for all endpoints |
| Upstash Redis | Outbound | HTTPS | Rate limiting on new endpoints |
| Sentry | Outbound | HTTPS | Error tracking for Epic 2 features |
| Vercel Analytics | Outbound | HTTPS | Performance monitoring |

### Database Integration Details

**Gradebook Query Pattern:**

```typescript
// Efficient gradebook data fetch (avoids N+1)
const gradebookData = await prisma.enrollment.findMany({
  where: {
    courseId,
    user: { deletedAt: null },
  },
  include: {
    user: {
      select: { id: true, name: true, email: true },
    },
  },
});

const assignments = await prisma.assignment.findMany({
  where: { courseId },
  include: {
    grades: {
      where: { student: { deletedAt: null } },
    },
    submissions: {
      where: { student: { deletedAt: null } },
    },
  },
  orderBy: { dueDate: 'asc' },
});
```

**Admin Stats Aggregation:**

```typescript
// Parallel count queries for dashboard stats
const [userCounts, courseCounts, enrollmentCount, assignmentStats] = await Promise.all([
  prisma.user.groupBy({
    by: ['role'],
    where: { deletedAt: null },
    _count: true,
  }),
  prisma.course.groupBy({
    by: ['isActive'],
    where: { deletedAt: null },
    _count: true,
  }),
  prisma.enrollment.count(),
  prisma.assignment.aggregate({
    _count: { id: true },
  }),
]);
```

### External Service Dependencies

| Service | Usage in Epic 2 | Failure Impact | Fallback |
|---------|-----------------|----------------|----------|
| Neon PostgreSQL | All data operations | Feature unavailable | None (critical) |
| Upstash Redis | Rate limiting | Degraded security | Allow requests (fail open) |
| Sentry | Error tracking | No error visibility | Console logging |

## Acceptance Criteria (Authoritative)

### Story 2.1: Gradebook Grid View Implementation

1. **AC-2.1.1:** Gradebook page displays matrix with students as rows and assignments as columns
2. **AC-2.1.2:** Grid shows student name, individual assignment scores, total points, percentage, and course GPA
3. **AC-2.1.3:** Empty cells indicate "not submitted" (dash) vs "pending grade" (clock icon) states
4. **AC-2.1.4:** Color coding applied: graded (green), pending (yellow), late (orange), missing (red)
5. **AC-2.1.5:** Grid supports horizontal/vertical scrolling for datasets exceeding viewport
6. **AC-2.1.6:** Grid loads within 2 seconds for 50 students × 20 assignments
7. **AC-2.1.7:** Mobile view displays list format instead of grid
8. **AC-2.1.8:** Unit tests cover grid data aggregation logic
9. **AC-2.1.9:** Integration tests verify gradebook API returns correct structure
10. **AC-2.1.10:** E2E test validates instructor sees correct student/assignment matrix

### Story 2.2: Gradebook Inline Editing with Confirmation

1. **AC-2.2.1:** Double-click cell enters edit mode with input field
2. **AC-2.2.2:** Enter or click outside cell triggers confirmation dialog
3. **AC-2.2.3:** Confirmation dialog shows "Update grade from [old] to [new]?" with Yes/Cancel
4. **AC-2.2.4:** Cancel discards edit and reverts cell to original value
5. **AC-2.2.5:** Yes triggers optimistic UI update followed by API call
6. **AC-2.2.6:** Invalid input (non-numeric, negative, exceeds max) rejected with error tooltip
7. **AC-2.2.7:** API failure triggers rollback and error toast
8. **AC-2.2.8:** Tab/Shift+Tab enables keyboard navigation between cells
9. **AC-2.2.9:** Unit tests cover grade validation logic
10. **AC-2.2.10:** Integration tests verify grade update API with valid/invalid/boundary inputs
11. **AC-2.2.11:** E2E test validates grade edit, confirm, and persistence

### Story 2.3: Gradebook Filtering & CSV Export

1. **AC-2.3.1:** Filter by student name with real-time search filtering
2. **AC-2.3.2:** Filter by assignment via dropdown selector
3. **AC-2.3.3:** Filter by date range (assignment due dates)
4. **AC-2.3.4:** Filter by grade status (all, graded, pending, late, missing)
5. **AC-2.3.5:** CSV export button generates downloadable file
6. **AC-2.3.6:** CSV format includes: Student Name, Email, Assignment scores, Total, GPA
7. **AC-2.3.7:** Export respects current filters (only visible rows exported)
8. **AC-2.3.8:** Export filename follows pattern: `{CourseCode}_grades_{YYYY-MM-DD}.csv`
9. **AC-2.3.9:** Unit tests cover CSV generation logic
10. **AC-2.3.10:** Integration tests verify export endpoint returns correct CSV format
11. **AC-2.3.11:** E2E test validates filter application and CSV download

### Story 2.4: GPA Calculation Implementation

1. **AC-2.4.1:** GPA calculation logic uses weighted assignment grades
2. **AC-2.4.2:** Grading scale configurable via environment variable (default 4.0)
3. **AC-2.4.3:** Course GPA calculated as weighted average of graded assignments
4. **AC-2.4.4:** Overall GPA calculated as average of all course GPAs
5. **AC-2.4.5:** GPA displayed on student dashboard (per course and overall)
6. **AC-2.4.6:** GPA displayed in gradebook for each student row
7. **AC-2.4.7:** GPA updates automatically when grades are modified
8. **AC-2.4.8:** No grades displays "N/A", partial grades calculate from available
9. **AC-2.4.9:** Unit tests cover GPA calculation with all scenarios
10. **AC-2.4.10:** Integration tests verify GPA calculation API
11. **AC-2.4.11:** E2E test validates student sees correct GPA on dashboard

### Story 2.5: Admin Dashboard - User Management

1. **AC-2.5.1:** Admin dashboard displays user management interface
2. **AC-2.5.2:** User list shows name, email, role, registration date, last login, status
3. **AC-2.5.3:** Search/filter users by name, email, or role
4. **AC-2.5.4:** Create new user form with name, email, role, optional password
5. **AC-2.5.5:** Edit user allows updating name, email, role, active status
6. **AC-2.5.6:** Role change requires confirmation dialog
7. **AC-2.5.7:** Deactivate user performs soft delete (sets deletedAt)
8. **AC-2.5.8:** Reset password capability available
9. **AC-2.5.9:** User activity log displays recent actions
10. **AC-2.5.10:** Unit tests cover user management business logic
11. **AC-2.5.11:** Integration tests verify user CRUD endpoints
12. **AC-2.5.12:** E2E test validates admin creates, updates, deactivates user

### Story 2.6: Admin Dashboard - System Statistics & Monitoring

1. **AC-2.6.1:** Dashboard displays total users by role (students, instructors, admins)
2. **AC-2.6.2:** Dashboard displays total courses (active, inactive)
3. **AC-2.6.3:** Dashboard displays enrollment, assignment, and discussion counts
4. **AC-2.6.4:** Activity metrics show recent logins, enrollments, submissions (24h)
5. **AC-2.6.5:** System health indicators show database and storage status
6. **AC-2.6.6:** Charts visualize enrollments over time and completion rates
7. **AC-2.6.7:** Drill-down links from metrics to detailed lists
8. **AC-2.6.8:** Stats cached for 5 minutes with cache invalidation on writes
9. **AC-2.6.9:** Unit tests cover statistics aggregation logic
10. **AC-2.6.10:** Integration tests verify statistics API endpoint
11. **AC-2.6.11:** E2E test validates admin sees accurate system statistics

### Story 2.7: Feedback Templates for Instructors

1. **AC-2.7.1:** Template library interface supports CRUD operations
2. **AC-2.7.2:** Template fields include name, category, and template text
3. **AC-2.7.3:** Placeholders supported: `{student_name}`, `{assignment_title}`, `{score}`, `{custom_note}`
4. **AC-2.7.4:** Categories: excellent, needs-improvement, missing-requirements, late
5. **AC-2.7.5:** Template dropdown available during grading workflow
6. **AC-2.7.6:** Templates customizable before sending (not rigid)
7. **AC-2.7.7:** Usage tracking displays most-used templates
8. **AC-2.7.8:** Templates scoped per instructor with optional course-wide sharing
9. **AC-2.7.9:** Unit tests cover template placeholder replacement
10. **AC-2.7.10:** Integration tests verify template CRUD endpoints
11. **AC-2.7.11:** E2E test validates template creation, application, and student visibility

### Story 2.8: Course Prerequisites & Learning Objectives Display

1. **AC-2.8.1:** Course model extended with prerequisites, learningObjectives, targetAudience fields
2. **AC-2.8.2:** Course create/edit UI includes new fields
3. **AC-2.8.3:** Course detail page displays prerequisites section prominently
4. **AC-2.8.4:** Learning objectives displayed as bulleted list
5. **AC-2.8.5:** Target audience description displayed
6. **AC-2.8.6:** Prerequisites warning callout shown on enrollment page
7. **AC-2.8.7:** Optional "Do you meet prerequisites?" confirmation before enrollment
8. **AC-2.8.8:** Migration adds fields to existing courses (nullable)
9. **AC-2.8.9:** Unit tests cover course validation with new fields
10. **AC-2.8.10:** Integration tests verify course CRUD with prerequisites
11. **AC-2.8.11:** E2E test validates student views prerequisites before enrolling

## Traceability Mapping

| AC ID | Spec Section | Component(s) | Test Type |
|-------|--------------|--------------|-----------|
| AC-2.1.1 | Detailed Design > Component Hierarchy | GradebookGrid, GradebookRow | E2E |
| AC-2.1.2 | Data Models > GradebookMatrix | GradebookRow, GPADisplay | Unit, E2E |
| AC-2.1.3 | Workflows > Status Indicators | GradebookCell | Unit |
| AC-2.1.4 | Workflows > Status Indicators | GradebookCell (CSS) | E2E |
| AC-2.1.5 | NFR > Performance | GradebookGrid (virtualization) | E2E |
| AC-2.1.6 | NFR > Performance | API, GradebookGrid | Integration, E2E |
| AC-2.1.7 | Detailed Design > Component Hierarchy | GradebookGrid (responsive) | E2E |
| AC-2.2.1 | Workflows > Inline Editing Flow | GradebookCell | Unit, E2E |
| AC-2.2.2 | Workflows > Inline Editing Flow | GradebookCell, Dialog | E2E |
| AC-2.2.3 | Workflows > Inline Editing Flow | Confirmation Dialog | E2E |
| AC-2.2.4 | Workflows > Inline Editing Flow | GradebookCell | Unit |
| AC-2.2.5 | NFR > Reliability | GradebookCell (optimistic UI) | Integration |
| AC-2.2.6 | APIs > Grade Update | gradeUpdateSchema (Zod) | Unit |
| AC-2.2.7 | NFR > Reliability | Error handling | Integration |
| AC-2.2.8 | Workflows > Inline Editing Flow | GradebookCell (keyboard) | E2E |
| AC-2.3.1 | APIs > Gradebook GET | GradebookFilters | Unit, E2E |
| AC-2.3.5 | APIs > Export | CSVExporter | Unit, Integration |
| AC-2.3.8 | APIs > Export | CSVExporter (filename) | Unit |
| AC-2.4.1 | Workflows > GPA Algorithm | GPACalculator | Unit |
| AC-2.4.2 | Workflows > GPA Algorithm | GPACalculator (config) | Unit |
| AC-2.4.5 | Detailed Design > Component Hierarchy | StudentDashboard | E2E |
| AC-2.4.8 | Workflows > GPA Algorithm | GPACalculator (edge cases) | Unit |
| AC-2.5.1 | Detailed Design > Component Hierarchy | AdminDashboard, UserManagement | E2E |
| AC-2.5.4 | APIs > Admin Users POST | UserCreateModal | Integration, E2E |
| AC-2.5.6 | Workflows > Admin User Management | Role confirmation dialog | E2E |
| AC-2.5.7 | Security > Soft Deletes | Admin Users DELETE | Integration |
| AC-2.6.1 | Data Models > SystemStats | StatsOverview | Integration, E2E |
| AC-2.6.5 | Data Models > SystemStats | SystemHealth | Integration |
| AC-2.6.8 | NFR > Performance | Stats caching | Integration |
| AC-2.7.1 | APIs > Templates CRUD | FeedbackTemplateService | Integration |
| AC-2.7.3 | Workflows > Template Flow | Template placeholder engine | Unit |
| AC-2.7.8 | Data Models > FeedbackTemplate | isShared field | Integration |
| AC-2.8.1 | Data Models > Course Extension | Prisma schema | Migration |
| AC-2.8.3 | Detailed Design > Component Hierarchy | CourseDetailPage | E2E |
| AC-2.8.7 | Workflows > Enrollment | PrerequisiteConfirmation | E2E |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Gradebook performance degrades with large datasets (>100 students) | Medium | High | Implement virtualization early; test with synthetic data at scale |
| R2 | GPA calculation edge cases cause incorrect grades | Medium | High | Comprehensive unit test suite; manual validation with sample data |
| R3 | Inline editing conflicts when multiple instructors edit simultaneously | Low | Medium | Display "last modified" timestamp; show warning if data changed since load |
| R4 | Admin dashboard stats queries impact database performance | Medium | Medium | Implement caching with 5-min TTL; use read replicas if needed |
| R5 | FeedbackTemplate model migration fails on existing data | Low | High | Test migration on staging with production data copy first |
| R6 | CSV export times out for very large courses | Low | Medium | Stream CSV generation; add progress indicator for large exports |

### Assumptions

| ID | Assumption | Validation Approach |
|----|------------|---------------------|
| A1 | Maximum class size is 100 students per course | Confirmed with product owner; can revisit post-MVP |
| A2 | Instructors will not edit grades concurrently on same student | Acceptable for beta; implement locking if needed post-MVP |
| A3 | GPA 4.0 scale is sufficient (no 5.0 or percentage-only scales needed) | Configurable via environment variable; default to 4.0 |
| A4 | Admin users are trusted and don't need additional approval workflows | Single admin for beta; revisit for multi-admin scenarios |
| A5 | Feedback templates are instructor-specific by default | isShared flag enables course-wide sharing when needed |
| A6 | Course prerequisites are informational only (not enforced blockers) | Confirmation checkbox sufficient; hard blocks deferred |

### Open Questions

| ID | Question | Owner | Status | Resolution |
|----|----------|-------|--------|------------|
| Q1 | Should grade history be tracked (show all changes, not just current)? | Product | **Deferred** | Out of scope for MVP; audit trail via updatedAt sufficient |
| Q2 | Should CSV export include submission timestamps? | Product | **Resolved** | Yes, include submittedAt column |
| Q3 | What happens when admin deactivates an instructor with active courses? | Product | **Resolved** | Courses remain active; reassignment is manual process |
| Q4 | Should feedback templates support rich text formatting? | Product | **Resolved** | Plain text only for MVP; rich text deferred |
| Q5 | Is 5-minute cache TTL for admin stats acceptable? | Product | **Resolved** | Yes, real-time not required for beta scale |

## Test Strategy Summary

### Test Coverage Targets

| Test Type | Coverage Target | Focus Areas |
|-----------|-----------------|-------------|
| Unit Tests | 80%+ | GPA calculation, CSV generation, validation schemas, template placeholders |
| Integration Tests | 70%+ | All API endpoints (gradebook, admin, templates) |
| E2E Tests | Critical paths | Student journey, instructor grading, admin user management |

### Test Distribution by Story

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| 2.1 Gradebook Grid | 5-8 | 3-5 | 2-3 |
| 2.2 Inline Editing | 8-10 | 4-6 | 2-3 |
| 2.3 Filtering/Export | 6-8 | 3-4 | 2-3 |
| 2.4 GPA Calculation | 15-20 | 2-3 | 1-2 |
| 2.5 User Management | 8-10 | 6-8 | 2-3 |
| 2.6 System Stats | 5-8 | 4-5 | 1-2 |
| 2.7 Feedback Templates | 8-10 | 4-5 | 2-3 |
| 2.8 Prerequisites | 4-6 | 3-4 | 1-2 |
| **Total** | **59-80** | **29-40** | **13-21** |

### Test Frameworks and Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Jest | Unit and integration tests | `jest.config.js` (existing) |
| React Testing Library | Component testing | Included with Jest setup |
| Playwright | E2E tests | `playwright.config.ts` (existing) |
| jest-mock-extended | Prisma mocking | Mock database queries |

### Key Test Scenarios

**GPA Calculation (Unit Tests):**
- All assignments graded → correct weighted average
- No grades → returns null
- Partial grades → calculates from available
- All zeros → returns 0.0
- All perfect scores → returns 4.0
- Mixed grades → correct 4.0 scale mapping
- Edge case: single assignment
- Edge case: different weights

**Gradebook API (Integration Tests):**
- GET returns correct matrix structure
- GET filters by student name
- GET filters by assignment
- GET filters by status
- PUT updates grade successfully
- PUT rejects invalid score (negative)
- PUT rejects invalid score (exceeds max)
- PUT returns 403 for non-instructor
- Export generates valid CSV

**Admin User Management (E2E Tests):**
- Admin creates new student user
- Admin creates new instructor user
- Admin changes user role (with confirmation)
- Admin deactivates user (soft delete)
- Admin searches users by name
- Admin filters users by role

### CI/CD Integration

```yaml
# Runs on every PR to main
jobs:
  test:
    steps:
      - npm run lint
      - npm run test:ci          # Jest with coverage
      - npm run test:e2e         # Playwright headless
      - Upload coverage to Codecov
```

**Quality Gates:**
- All tests must pass
- Coverage must not decrease
- No lint errors
- Build must succeed

---

**Document Status:** Draft
**Generated:** 2025-11-26
**Epic:** 2 - Feature Completion & Admin Capabilities
**Stories:** 8 (2.1 - 2.8)
**Acceptance Criteria:** 89 total

---

**Next Steps:**
1. Review and approve this Tech Spec
2. Run `*create-story` to draft Story 2.1: Gradebook Grid View Implementation
3. Begin test-driven development following this specification

