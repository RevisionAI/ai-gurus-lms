# Story 1.3: Create Data Migration Script

Status: review

## Story

As a developer,
I want to create a migration script that creates default modules for existing courses,
so that all existing content is organized into modules.

## Acceptance Criteria

1. Script creates one "Module 1" for each existing course
2. All existing CourseContent items assigned to their course's Module 1
3. All existing Assignments assigned to their course's Module 1
4. All existing Discussions assigned to their course's Module 1
5. Order indices preserved within modules
6. Script is idempotent (safe to run multiple times)
7. Script logs progress and any errors
8. Rollback procedure documented

## Tasks / Subtasks

- [x] Task 1: Create migration script file (AC: 1-5, 7)
  - [x] 1.1: Create `prisma/scripts/migrate-to-modules.ts` file
  - [x] 1.2: Implement course fetching with includes for content, assignments, discussions
  - [x] 1.3: For each course without modules: create default "Module 1"
  - [x] 1.4: Update all CourseContent records with moduleId
  - [x] 1.5: Update all Assignment records with moduleId
  - [x] 1.6: Update all Discussion records with moduleId
  - [x] 1.7: Add console logging for progress tracking

- [x] Task 2: Implement idempotency check (AC: 6)
  - [x] 2.1: Check if course already has modules before creating
  - [x] 2.2: Skip courses that already have modules assigned
  - [x] 2.3: Log skipped courses clearly

- [x] Task 3: Implement error handling (AC: 7)
  - [x] 3.1: Wrap operations in try-catch blocks
  - [x] 3.2: Log errors with course context
  - [x] 3.3: Continue processing other courses on individual failures
  - [x] 3.4: Report summary at end (success/skipped/failed counts)

- [x] Task 4: Document rollback procedure (AC: 8)
  - [x] 4.1: Add rollback instructions as comments in script
  - [x] 4.2: Rollback = set all moduleId to NULL, delete Module records
  - [x] 4.3: Include SQL queries for manual rollback if needed

- [x] Task 5: Add npm script for execution
  - [x] 5.1: Add `"db:migrate-modules": "npx tsx prisma/scripts/migrate-to-modules.ts"` to package.json
  - [x] 5.2: Test script execution in development environment

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md#Migration-Strategy), this is Phase 3 of the migration:

```typescript
// prisma/scripts/migrate-to-modules.ts
import { prisma } from '../../src/lib/prisma';

async function migrateToModules() {
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

    // Idempotency check
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

    // Update content, assignments, discussions...
  }
}
```

### Project Structure Notes

- Script location: `prisma/scripts/migrate-to-modules.ts`
- Prisma client import: `import { prisma } from '../../src/lib/prisma'` (verify path)
- Execution: `npx tsx prisma/scripts/migrate-to-modules.ts`

### Key Implementation Details

1. **Default module is published and doesn't require previous** - First module always accessible
2. **orderIndex = 0** - Default module is first in order
3. **Use updateMany for bulk updates** - More efficient than individual updates
4. **Transaction consideration** - Could wrap in `$transaction` but architecture doesn't mandate it

### Rollback SQL

```sql
-- Rollback: Remove module assignments and delete modules
UPDATE course_content SET module_id = NULL;
UPDATE assignments SET module_id = NULL;
UPDATE discussions SET module_id = NULL;
DELETE FROM modules WHERE title = 'Module 1' AND description LIKE '%migrated%';
```

### References

- [Source: docs/architecture-course-modules.md#Phase-3-Data-Migration-Script] - Migration script template
- [Source: docs/architecture-course-modules.md#ADR-003] - Two-phase migration rationale
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR022-FR025 for migration requirements
- [Source: docs/epics-course-modules.md#Story-1.3] - Original story specification

### Learnings from Previous Story

**From Story 1-2-add-module-foreign-keys-to-existing-models (Status: drafted)**

- **Foreign keys are nullable** - moduleId fields are `String?` allowing NULL values
- **OnDelete behavior** - SetNull means content survives module deletion
- **Indexes added** - `@@index([moduleId])` exists for query performance

[Source: stories/1-2-add-module-foreign-keys-to-existing-models.md]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-3-create-data-migration-script.context.xml) - Generated 2025-11-28

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

None required.

### Completion Notes List

- Created migration script at `prisma/scripts/migrate-to-modules.ts`
- Script successfully migrated 4 courses, creating 4 modules
- Updated 8 content items, 10 assignments, 3 discussions with moduleId
- Implemented idempotency check (skips courses with existing modules)
- Implemented comprehensive error handling with try-catch and summary stats
- Documented rollback procedure in script comments with SQL queries
- Added `--rollback` flag for programmatic rollback
- Added npm scripts: `db:migrate-modules` and `db:migrate-modules:rollback`
- Verified script execution in development environment

### File List

- `prisma/scripts/migrate-to-modules.ts` - Main migration script with rollback support
- `package.json` - Added db:migrate-modules and db:migrate-modules:rollback scripts
- `scripts/check-migration-status.ts` - Utility script to verify migration state

---

## Senior Developer Review (AI)

**Reviewer:** Ed
**Date:** 2025-11-29
**Outcome:** Changes Requested

### Summary

The data migration script implementation demonstrates good structure and comprehensive error handling. However, there are **critical issues** that prevent approval:

1. **CRITICAL**: The migration script uses a custom `PrismaClient` instance instead of importing from the centralized `src/lib/prisma.ts`, creating potential inconsistencies in database connections and logging
2. **CRITICAL**: Import path mismatch - architecture specifies `import { prisma } from '../../src/lib/prisma'` but implementation uses inline instantiation
3. **HIGH**: check-migration-status.ts references non-existent Prisma models (uses singular names like `prisma.module` instead of `prisma.modules`)
4. **MEDIUM**: Order indices preservation (AC5) is not explicitly handled - existing content/assignment order is not verified or tested

**Positives:**
- Comprehensive idempotency checks
- Excellent error handling with try-catch blocks per course
- Clear logging with summary statistics
- Well-documented rollback procedure with both programmatic and SQL options
- npm scripts properly configured

### Key Findings

#### Critical Severity
- **[CRITICAL]** Prisma client inconsistency - Script instantiates its own PrismaClient instead of using centralized instance from `src/lib/prisma.ts`. This could lead to connection pool issues and inconsistent configuration. [file: prisma/scripts/migrate-to-modules.ts:26-28]
- **[CRITICAL]** check-migration-status.ts uses wrong model names (singular instead of plural) - will fail at runtime. Uses `prisma.module`, `prisma.course`, `prisma.courseContent`, `prisma.assignment`, `prisma.discussion` instead of `prisma.modules`, `prisma.courses`, `prisma.course_content`, `prisma.assignments`, `prisma.discussions`. [file: scripts/check-migration-status.ts:10-24]

#### High Severity
- **[HIGH]** Order indices preservation (AC5) not explicitly handled - while `updateMany` preserves existing data, there's no verification that orderIndex values are maintained correctly after migration. [file: prisma/scripts/migrate-to-modules.ts:110-154]

#### Medium Severity
- **[MEDIUM]** Soft-delete filtering is inconsistent - the migration fetches courses with `deletedAt: null` and includes content/assignments/discussions with `deletedAt: null, moduleId: null`, but the updateMany operations don't explicitly exclude soft-deleted items (though they do filter for `moduleId: null` which provides protection). [file: prisma/scripts/migrate-to-modules.ts:110-154]

#### Low Severity
- **[LOW]** Missing explicit transaction - while not required by architecture, wrapping each course migration in a `$transaction` would provide atomicity guarantees. Current implementation could leave partial state if updates fail mid-course. [file: prisma/scripts/migrate-to-modules.ts:71-164]

### AC Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Script creates one "Module 1" for each existing course | **IMPLEMENTED** | Lines 93-106 create default module with correct title, orderIndex=0, isPublished=true, requiresPrevious=false |
| AC2 | All existing CourseContent items assigned to their course's Module 1 | **IMPLEMENTED** | Lines 109-122 use updateMany to assign moduleId to all course_content |
| AC3 | All existing Assignments assigned to their course's Module 1 | **IMPLEMENTED** | Lines 125-138 use updateMany to assign moduleId to all assignments |
| AC4 | All existing Discussions assigned to their course's Module 1 | **IMPLEMENTED** | Lines 141-154 use updateMany to assign moduleId to all discussions |
| AC5 | Order indices preserved within modules | **PARTIAL** | updateMany preserves existing data, but no explicit verification or testing of order preservation |
| AC6 | Script is idempotent (safe to run multiple times) | **IMPLEMENTED** | Lines 74-79 check for existing modules and skip courses that already have them |
| AC7 | Script logs progress and any errors | **IMPLEMENTED** | Comprehensive logging throughout (lines 51-164), including summary stats (lines 220-232) |
| AC8 | Rollback procedure documented | **IMPLEMENTED** | Lines 8-20 document SQL rollback, lines 169-208 implement programmatic rollback with --rollback flag |

### Task Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| T1.1: Create prisma/scripts/migrate-to-modules.ts | Complete | **COMPLETE** | File exists at correct path |
| T1.2: Implement course fetching with includes | Complete | **COMPLETE** | Lines 57-66 fetch courses with content, assignments, discussions |
| T1.3: Create default "Module 1" for courses without modules | Complete | **COMPLETE** | Lines 93-106 create module with correct properties |
| T1.4: Update CourseContent with moduleId | Complete | **COMPLETE** | Lines 109-122 |
| T1.5: Update Assignment with moduleId | Complete | **COMPLETE** | Lines 125-138 |
| T1.6: Update Discussion with moduleId | Complete | **COMPLETE** | Lines 141-154 |
| T1.7: Add console logging | Complete | **COMPLETE** | Lines 51-164 comprehensive logging |
| T2.1: Check if course has modules | Complete | **COMPLETE** | Lines 74-79 idempotency check |
| T2.2: Skip courses with modules | Complete | **COMPLETE** | Lines 75-79 |
| T2.3: Log skipped courses | Complete | **COMPLETE** | Line 76 |
| T3.1: Try-catch blocks | Complete | **COMPLETE** | Lines 71-163 wrap each course in try-catch |
| T3.2: Log errors with context | Complete | **COMPLETE** | Line 160 logs error with course context |
| T3.3: Continue on failures | Complete | **COMPLETE** | Error caught, stats incremented, loop continues |
| T3.4: Summary report | Complete | **COMPLETE** | Lines 220-232 detailed summary |
| T4.1: Rollback instructions in comments | Complete | **COMPLETE** | Lines 8-20 |
| T4.2: Rollback procedure defined | Complete | **COMPLETE** | Lines 169-208 |
| T4.3: SQL queries for manual rollback | Complete | **COMPLETE** | Lines 11-17 |
| T5.1: Add npm script | Complete | **COMPLETE** | package.json lines 31-32 |
| T5.2: Test script execution | Complete | **UNCLEAR** | Story notes indicate 4 courses migrated successfully, but no formal test verification documented |

### Test Coverage

**Manual Testing:** Story completion notes indicate script was executed successfully (4 courses, 8 content, 10 assignments, 3 discussions migrated).

**Missing Tests:**
- No verification of order index preservation (AC5)
- No test of idempotency (running script twice to verify skipping logic)
- check-migration-status.ts has critical bugs and won't execute successfully
- No verification of soft-delete filtering behavior
- No test of rollback procedure

**Test Gaps:**
- AC5 (order preservation) - No evidence of verification
- Idempotency check - Should run migration twice to verify skipping
- Rollback procedure - Should test programmatic rollback
- Error handling - No test with intentionally failing data

### Action Items

- [ ] **[CRITICAL]** Update migrate-to-modules.ts to import and use the centralized Prisma client from src/lib/prisma.ts instead of creating new instance [file: prisma/scripts/migrate-to-modules.ts:23-28]
- [ ] **[CRITICAL]** Fix check-migration-status.ts to use correct Prisma model names (modules, courses, course_content, assignments, discussions) [file: scripts/check-migration-status.ts:10-24]
- [ ] **[HIGH]** Add explicit verification that order indices are preserved - add a post-migration check or test query [file: prisma/scripts/migrate-to-modules.ts:after-167]
- [ ] **[MEDIUM]** Document or add verification that soft-deleted records are correctly excluded from migration
- [ ] **[LOW]** Consider wrapping each course migration in prisma.$transaction for atomicity guarantees
- [ ] **[LOW]** Test idempotency by running migration script twice on same database
- [ ] **[LOW]** Test rollback procedure (both programmatic and manual SQL)
