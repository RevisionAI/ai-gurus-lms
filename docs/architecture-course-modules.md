# Course Modules Feature - Architecture Document

**Author:** Ed
**Date:** 2025-11-28
**Feature:** Course Modules Enhancement
**Base System:** AI Gurus LMS (Next.js 15 + Prisma + PostgreSQL)

---

## Executive Summary

This architecture document defines the technical decisions for adding Course Modules to the AI Gurus LMS. Modules introduce a hierarchical layer between Courses and their content (CourseContent, Assignments, Discussions), enabling instructors to organize learning materials into logical units with sequential progression and progress tracking.

**Key Architectural Decisions:**
- New `Module` and `ModuleProgress` Prisma models
- Server-side unlock logic (not client-side)
- Two-phase database migration for zero-downtime deployment
- RESTful API extensions following existing patterns

---

## Decision Summary

| Category | Decision | Affects Epics | Rationale |
|----------|----------|---------------|-----------|
| Data Model | Add `Module` model with `orderIndex`, `requiresPrevious` | 1, 2, 3, 4 | Enables sequential organization and prerequisite control |
| Data Model | Add `ModuleProgress` model with `contentViewed[]` | 1, 3 | Tracks individual student progress per module |
| Data Model | Add `moduleId` FK to CourseContent, Assignment, Discussion | 1, 2, 4 | Links existing entities to modules |
| Migration | Two-phase migration with default "Module 1" per course | 1 | Zero-downtime, backward compatible |
| API | RESTful endpoints under existing `/api/instructor` and `/api/student` | 2, 3, 4 | Consistent with existing API patterns |
| Unlock Logic | Server-side calculation in `/lib/modules.ts` | 3 | Security - prevents client-side bypass |
| Progress | 50% content + 50% assignments formula | 3 | Fair weighting of learning activities |
| UI | Feature-based component organization in `/components/modules/` | 2, 3, 4 | Maintainable, co-located code |

---

## Data Architecture

### New Models

#### Module Model

```prisma
model Module {
  id                String    @id @default(cuid())
  title             String
  description       String?
  orderIndex        Int
  isPublished       Boolean   @default(false)
  requiresPrevious  Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  // Relations
  courseId    String
  course      Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  content     CourseContent[]
  assignments Assignment[]
  discussions Discussion[]
  progress    ModuleProgress[]

  @@index([courseId])
  @@index([deletedAt])
  @@map("modules")
}
```

#### ModuleProgress Model

```prisma
model ModuleProgress {
  id              String    @id @default(cuid())
  completedAt     DateTime?
  contentViewed   String[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  moduleId  String
  userId    String
  module    Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([moduleId, userId])
  @@index([userId])
  @@map("module_progress")
}
```

### Modified Models

#### CourseContent (add moduleId)

```prisma
model CourseContent {
  // ... existing fields ...

  // NEW: Module relation
  moduleId String
  module   Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  // Keep courseId for backward compatibility during migration
  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

#### Assignment (add moduleId)

```prisma
model Assignment {
  // ... existing fields ...

  // NEW: Module relation
  moduleId String
  module   Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)
}
```

#### Discussion (add moduleId)

```prisma
model Discussion {
  // ... existing fields ...

  // NEW: Module relation
  moduleId String
  module   Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)
}
```

#### User (add moduleProgress relation)

```prisma
model User {
  // ... existing fields ...

  // NEW: Module progress relation
  moduleProgress ModuleProgress[]
}
```

#### Course (add modules relation)

```prisma
model Course {
  // ... existing fields ...

  // NEW: Modules relation
  modules Module[]
}
```

### Entity Relationship Diagram

```
Course (1) ──────────────────────────────────────┐
    │                                            │
    │ 1:N                                        │
    ▼                                            │
Module (N) ──────────────────────────────────────┤
    │                                            │
    ├── 1:N → CourseContent                      │
    ├── 1:N → Assignment ─── 1:N → Submission    │
    ├── 1:N → Discussion                         │
    └── 1:N → ModuleProgress ← N:1 ── User       │
                                                 │
Enrollment ← N:1 ────────────────────────────────┘
```

---

## API Contracts

### Instructor Module Endpoints

#### GET /api/instructor/courses/[id]/modules

**Response:**
```json
{
  "modules": [
    {
      "id": "clxxx...",
      "title": "AI Fundamentals",
      "description": "Introduction to AI concepts",
      "orderIndex": 0,
      "isPublished": true,
      "requiresPrevious": false,
      "contentCount": 5,
      "assignmentCount": 2,
      "discussionCount": 1,
      "createdAt": "2025-11-28T00:00:00Z"
    }
  ]
}
```

#### POST /api/instructor/courses/[id]/modules

**Request:**
```json
{
  "title": "Module Title",
  "description": "Optional description",
  "requiresPrevious": true
}
```

**Response:** Created module object

#### PUT /api/instructor/courses/[id]/modules/[moduleId]

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isPublished": true,
  "requiresPrevious": true
}
```

#### PUT /api/instructor/courses/[id]/modules/reorder

**Request:**
```json
{
  "moduleIds": ["id1", "id2", "id3"]
}
```

#### PUT /api/instructor/courses/[id]/modules/[moduleId]/move-content

**Request:**
```json
{
  "contentIds": ["content1", "content2"],
  "targetModuleId": "newModuleId"
}
```

### Student Module Endpoints

#### GET /api/student/courses/[id]/modules

**Response:**
```json
{
  "modules": [
    {
      "id": "clxxx...",
      "title": "AI Fundamentals",
      "description": "Introduction to AI concepts",
      "orderIndex": 0,
      "status": "completed",
      "progress": 100,
      "contentCount": 5,
      "assignmentCount": 2,
      "isUnlocked": true,
      "completedAt": "2025-11-27T15:30:00Z"
    },
    {
      "id": "clyyy...",
      "title": "Decision Framework",
      "orderIndex": 1,
      "status": "in_progress",
      "progress": 60,
      "contentCount": 4,
      "assignmentCount": 1,
      "isUnlocked": true,
      "completedAt": null
    },
    {
      "id": "clzzz...",
      "title": "Implementation",
      "orderIndex": 2,
      "status": "locked",
      "progress": 0,
      "isUnlocked": false,
      "unlockMessage": "Complete 'Decision Framework' to unlock"
    }
  ],
  "courseProgress": 53
}
```

#### GET /api/student/courses/[id]/modules/[moduleId]

**Response (if unlocked):**
```json
{
  "module": {
    "id": "clxxx...",
    "title": "AI Fundamentals",
    "description": "Introduction to AI concepts",
    "progress": 60,
    "content": [
      {
        "id": "content1",
        "title": "What is AI?",
        "type": "VIDEO",
        "isViewed": true
      },
      {
        "id": "content2",
        "title": "Machine Learning Basics",
        "type": "TEXT",
        "isViewed": false
      }
    ],
    "assignments": [
      {
        "id": "assign1",
        "title": "AI Concepts Quiz",
        "dueDate": "2025-12-01T00:00:00Z",
        "isSubmitted": true,
        "isGraded": true,
        "grade": 85
      }
    ],
    "discussions": [
      {
        "id": "disc1",
        "title": "Share your AI experience",
        "postCount": 15
      }
    ]
  }
}
```

**Response (if locked):**
```json
{
  "error": "MODULE_LOCKED",
  "message": "Complete 'Decision Framework' to unlock this module",
  "prerequisiteModuleId": "clyyy..."
}
```

#### POST /api/student/courses/[id]/modules/[moduleId]/content/[contentId]/complete

**Response:**
```json
{
  "success": true,
  "moduleProgress": 80,
  "isModuleComplete": false
}
```

---

## Implementation Patterns

### Module Unlock Logic

**File:** `/src/lib/modules.ts`

```typescript
import { prisma } from '@/lib/prisma';

export async function isModuleUnlocked(
  moduleId: string,
  userId: string
): Promise<boolean> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        include: {
          modules: {
            where: { deletedAt: null },
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  });

  if (!module) return false;

  // First module is always unlocked
  if (module.orderIndex === 0) return true;

  // If sequential unlock is disabled for this module
  if (!module.requiresPrevious) return true;

  // Find previous module
  const previousModule = module.course.modules.find(
    m => m.orderIndex === module.orderIndex - 1
  );

  if (!previousModule) return true;

  // Check if previous module is completed
  return await isModuleCompleted(previousModule.id, userId);
}

export async function isModuleCompleted(
  moduleId: string,
  userId: string
): Promise<boolean> {
  const progress = await calculateModuleProgress(moduleId, userId);
  return progress.isComplete;
}
```

### Progress Calculation

**File:** `/src/lib/module-progress.ts`

```typescript
import { prisma } from '@/lib/prisma';

export interface ModuleProgressResult {
  percentage: number;
  isComplete: boolean;
  contentViewed: number;
  contentTotal: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
}

export async function calculateModuleProgress(
  moduleId: string,
  userId: string
): Promise<ModuleProgressResult> {
  // Get module with published content and assignments
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      content: {
        where: { isPublished: true, deletedAt: null }
      },
      assignments: {
        where: { isPublished: true, deletedAt: null }
      }
    }
  });

  if (!module) {
    return {
      percentage: 0,
      isComplete: false,
      contentViewed: 0,
      contentTotal: 0,
      assignmentsSubmitted: 0,
      assignmentsTotal: 0
    };
  }

  // Get or create progress record
  const progress = await prisma.moduleProgress.findUnique({
    where: { moduleId_userId: { moduleId, userId } }
  });

  // Get submissions for this module's assignments
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: userId,
      assignmentId: { in: module.assignments.map(a => a.id) }
    }
  });

  const contentViewed = progress?.contentViewed.length ?? 0;
  const contentTotal = module.content.length;
  const assignmentsSubmitted = submissions.length;
  const assignmentsTotal = module.assignments.length;

  // Calculate percentage (50% content, 50% assignments)
  // Handle edge case where there's no content or no assignments
  let contentScore = 0;
  let assignmentScore = 0;

  if (contentTotal > 0) {
    contentScore = (contentViewed / contentTotal) * 50;
  } else {
    contentScore = 50; // No content = full content score
  }

  if (assignmentsTotal > 0) {
    assignmentScore = (assignmentsSubmitted / assignmentsTotal) * 50;
  } else {
    assignmentScore = 50; // No assignments = full assignment score
  }

  const percentage = Math.round(contentScore + assignmentScore);

  return {
    percentage,
    isComplete: percentage === 100,
    contentViewed,
    contentTotal,
    assignmentsSubmitted,
    assignmentsTotal
  };
}

export async function markContentViewed(
  moduleId: string,
  userId: string,
  contentId: string
): Promise<ModuleProgressResult> {
  // Upsert progress record
  await prisma.moduleProgress.upsert({
    where: { moduleId_userId: { moduleId, userId } },
    create: {
      moduleId,
      userId,
      contentViewed: [contentId]
    },
    update: {
      contentViewed: {
        push: contentId
      }
    }
  });

  // Recalculate and check for completion
  const progress = await calculateModuleProgress(moduleId, userId);

  // If just completed, set completedAt
  if (progress.isComplete) {
    await prisma.moduleProgress.update({
      where: { moduleId_userId: { moduleId, userId } },
      data: { completedAt: new Date() }
    });
  }

  return progress;
}
```

---

## Project Structure (Module Feature)

```
src/
├── app/
│   └── api/
│       ├── instructor/
│       │   └── courses/
│       │       └── [id]/
│       │           └── modules/
│       │               ├── route.ts              # GET, POST
│       │               ├── [moduleId]/
│       │               │   ├── route.ts          # GET, PUT, DELETE
│       │               │   ├── publish/
│       │               │   │   └── route.ts      # PUT
│       │               │   └── move-content/
│       │               │       └── route.ts      # PUT
│       │               └── reorder/
│       │                   └── route.ts          # PUT
│       └── student/
│           └── courses/
│               └── [id]/
│                   └── modules/
│                       ├── route.ts              # GET (list with progress)
│                       └── [moduleId]/
│                           ├── route.ts          # GET (detail if unlocked)
│                           ├── progress/
│                           │   └── route.ts      # GET
│                           └── content/
│                               └── [contentId]/
│                                   └── complete/
│                                       └── route.ts  # POST
├── components/
│   └── modules/
│       ├── ModuleList.tsx
│       ├── ModuleCard.tsx
│       ├── ModuleForm.tsx
│       ├── ModuleProgress.tsx
│       ├── ModuleContentList.tsx
│       ├── ModuleLockOverlay.tsx
│       ├── ModuleReorderContainer.tsx
│       └── hooks/
│           ├── useModules.ts
│           ├── useModuleProgress.ts
│           └── useModuleUnlock.ts
├── lib/
│   ├── modules.ts                 # Unlock logic
│   └── module-progress.ts         # Progress calculation
└── prisma/
    └── migrations/
        ├── XXXXXX_add_module_model/
        ├── XXXXXX_add_module_progress/
        ├── XXXXXX_add_module_foreign_keys/
        └── XXXXXX_migrate_existing_content/
```

---

## Migration Strategy

### Phase 1: Add New Models (Non-Breaking)

```sql
-- Migration: add_module_model
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  requires_previous BOOLEAN DEFAULT true,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_deleted_at ON modules(deleted_at);

-- Migration: add_module_progress
CREATE TABLE module_progress (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_viewed TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, user_id)
);

CREATE INDEX idx_module_progress_user_id ON module_progress(user_id);
```

### Phase 2: Add Nullable Foreign Keys

```sql
-- Migration: add_module_foreign_keys
ALTER TABLE course_content ADD COLUMN module_id TEXT REFERENCES modules(id);
ALTER TABLE assignments ADD COLUMN module_id TEXT REFERENCES modules(id);
ALTER TABLE discussions ADD COLUMN module_id TEXT REFERENCES modules(id);
```

### Phase 3: Data Migration Script

**File:** `/prisma/migrations/migrate-to-modules.ts`

```typescript
import { prisma } from '../src/lib/prisma';

async function migrateToModules() {
  // Get all courses
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    include: {
      content: true,
      assignments: true,
      discussions: true
    }
  });

  for (const course of courses) {
    console.log(`Migrating course: ${course.title}`);

    // Check if course already has modules
    const existingModules = await prisma.module.count({
      where: { courseId: course.id }
    });

    if (existingModules > 0) {
      console.log(`  Skipping - already has modules`);
      continue;
    }

    // Create default "Module 1"
    const defaultModule = await prisma.module.create({
      data: {
        title: 'Module 1',
        description: 'Default module (migrated from existing content)',
        orderIndex: 0,
        isPublished: true,
        requiresPrevious: false,
        courseId: course.id
      }
    });

    // Update all content
    await prisma.courseContent.updateMany({
      where: { courseId: course.id },
      data: { moduleId: defaultModule.id }
    });

    // Update all assignments
    await prisma.assignment.updateMany({
      where: { courseId: course.id },
      data: { moduleId: defaultModule.id }
    });

    // Update all discussions
    await prisma.discussion.updateMany({
      where: { courseId: course.id },
      data: { moduleId: defaultModule.id }
    });

    console.log(`  Created Module 1 with ${course.content.length} content, ${course.assignments.length} assignments, ${course.discussions.length} discussions`);
  }

  console.log('Migration complete!');
}

migrateToModules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Phase 4: Make Foreign Keys Required

```sql
-- After verifying all data migrated
ALTER TABLE course_content ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE assignments ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE discussions ALTER COLUMN module_id SET NOT NULL;
```

---

## Security Considerations

### Authorization Rules

| Endpoint | Authorization |
|----------|---------------|
| Instructor module endpoints | Must be course instructor |
| Student module list | Must be enrolled in course |
| Student module detail | Must be enrolled + module unlocked |
| Mark content complete | Must be enrolled + module unlocked |

### Validation Rules

```typescript
// All module operations validate:
// 1. User has appropriate role
// 2. Course exists and user has access
// 3. Module exists and belongs to course
// 4. For students: module is unlocked

// Zod schemas for input validation
const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  requiresPrevious: z.boolean().default(true)
});

const reorderModulesSchema = z.object({
  moduleIds: z.array(z.string().cuid())
});
```

---

## Performance Considerations

### Database Indexes

```sql
-- Existing indexes to leverage
CREATE INDEX idx_course_content_course_id ON course_content(course_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_discussions_course_id ON discussions(course_id);

-- New indexes for module queries
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_course_content_module_id ON course_content(module_id);
CREATE INDEX idx_assignments_module_id ON assignments(module_id);
CREATE INDEX idx_discussions_module_id ON discussions(module_id);
CREATE INDEX idx_module_progress_user_id ON module_progress(user_id);
```

### Query Optimization

- Use `include` for related data in single queries
- Progress calculation uses single query with aggregation
- Unlock checks cached in session where appropriate

---

## Architecture Decision Records (ADRs)

### ADR-001: Server-Side Unlock Logic

**Context:** Module unlock status could be calculated client-side or server-side.

**Decision:** Server-side calculation in `/lib/modules.ts`

**Rationale:**
- Prevents client-side bypass of prerequisites
- Single source of truth for unlock status
- Consistent behavior across all API calls

### ADR-002: Progress Formula (50/50 Split)

**Context:** Need to determine how content viewing and assignment submission contribute to progress.

**Decision:** 50% content viewing + 50% assignment submission

**Rationale:**
- Fair weighting values both learning activities
- Simple to understand and explain to users
- Edge cases handled (no content = 50% auto, no assignments = 50% auto)

### ADR-003: Two-Phase Migration

**Context:** Need to add moduleId to existing tables with production data.

**Decision:**
1. Add nullable columns
2. Run data migration script
3. Make columns required

**Rationale:**
- Zero-downtime deployment
- Reversible if issues found
- Safe for production data

### ADR-004: Keep courseId on Content/Assignment/Discussion

**Context:** After adding moduleId, courseId becomes redundant but provides direct lookup.

**Decision:** Keep courseId alongside moduleId

**Rationale:**
- Backward compatibility during migration
- Enables direct course-level queries without join
- Minimal storage overhead

---

## Epic to Architecture Mapping

| Epic | Primary Components |
|------|-------------------|
| Epic 1: Database Schema & Migration | `prisma/schema.prisma`, `/prisma/migrations/`, `/lib/` |
| Epic 2: Instructor Module Management | `/api/instructor/courses/[id]/modules/`, `/components/modules/` (instructor) |
| Epic 3: Student Module Experience | `/api/student/courses/[id]/modules/`, `/components/modules/` (student), `/lib/module-progress.ts` |
| Epic 4: Feature Integration | Modified existing routes, `/components/gradebook/`, existing content/assignment forms |

---

_Generated by BMAD Decision Architecture Workflow_
_Date: 2025-11-28_
_For: Ed_
