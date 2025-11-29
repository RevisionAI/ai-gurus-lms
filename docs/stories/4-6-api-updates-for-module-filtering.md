# Story 4.6: API Updates for Module Filtering

Status: done

## Story

As a developer,
I want APIs to support module filtering,
so that the frontend can request module-specific data.

## Acceptance Criteria

1. GET /api/student/courses/[id]/content accepts moduleId query param
2. GET /api/instructor/courses/[id]/assignments accepts moduleId filter
3. GET /api/student/courses/[id]/discussions accepts moduleId filter
4. Responses include moduleId in each item
5. Performance: filtered queries use database indexes

## Tasks / Subtasks

- [x] Task 1: Update content API (AC: 1, 4, 5)
  - [x] 1.1: Add moduleId query parameter to GET /api/student/courses/[id]/content
  - [x] 1.2: When moduleId provided, filter results
  - [x] 1.3: Include moduleId in each content item response
  - [x] 1.4: Ensure query uses moduleId index

- [x] Task 2: Update assignments API (AC: 2, 4, 5)
  - [x] 2.1: Add moduleId filter to GET /api/instructor/courses/[id]/assignments
  - [x] 2.2: Also add to student assignments endpoint if exists
  - [x] 2.3: Include moduleId in response items
  - [x] 2.4: Use moduleId index for filtering

- [x] Task 3: Update discussions API (AC: 3, 4, 5)
  - [x] 3.1: Add moduleId filter to GET /api/student/courses/[id]/discussions
  - [x] 3.2: Add to instructor discussions endpoint
  - [x] 3.3: Include moduleId in response items
  - [x] 3.4: Use moduleId index for filtering

- [x] Task 4: Verify index usage (AC: 5)
  - [x] 4.1: Check that moduleId indexes exist (from Story 1.2)
  - [x] 4.2: Verify query plans use indexes (EXPLAIN if needed)
  - [x] 4.3: Add indexes if missing

- [x] Task 5: Document API changes
  - [x] 5.1: Update API documentation/comments
  - [x] 5.2: Note new query parameters
  - [x] 5.3: Ensure TypeScript types reflect changes

## Dev Notes

### API Enhancement Pattern

```typescript
// Before
// GET /api/student/courses/[id]/content
const content = await prisma.courseContent.findMany({
  where: { courseId, deletedAt: null, isPublished: true }
});

// After
// GET /api/student/courses/[id]/content?moduleId=xxx
const moduleId = searchParams.get('moduleId');
const content = await prisma.courseContent.findMany({
  where: {
    courseId,
    deletedAt: null,
    isPublished: true,
    ...(moduleId && { moduleId })  // Optional filter
  }
});
```

### Response Enhancement

```typescript
// Each item includes moduleId
{
  "content": [
    {
      "id": "clxxx",
      "title": "Introduction",
      "type": "TEXT",
      "moduleId": "clyyyy",  // NEW
      "isPublished": true
    }
  ]
}
```

### Endpoints to Update

| Endpoint | Add Filter | Include in Response |
|----------|------------|---------------------|
| GET /api/student/courses/[id]/content | moduleId | moduleId |
| GET /api/instructor/courses/[id]/content | moduleId | moduleId |
| GET /api/student/courses/[id]/assignments | moduleId | moduleId |
| GET /api/instructor/courses/[id]/assignments | moduleId | moduleId |
| GET /api/student/courses/[id]/discussions | moduleId | moduleId |
| GET /api/instructor/courses/[id]/discussions | moduleId | moduleId |

### Project Structure Notes

- Updates to existing API routes
- No new routes needed

### Key Implementation Details

1. **Optional filter** - moduleId filter is optional, omitting returns all
2. **Index verification** - Story 1.2 added indexes, verify they're being used
3. **Consistent response** - All items include moduleId for client-side grouping
4. **TypeScript types** - Update response types to include moduleId

### Index Check

```sql
-- These indexes should exist from Story 1.2
idx_course_content_module_id
idx_assignments_module_id
idx_discussions_module_id
```

### Performance Testing

```sql
-- Verify index usage
EXPLAIN SELECT * FROM course_content WHERE module_id = 'xxx';
-- Should show Index Scan, not Seq Scan
```

### References

- [Source: docs/architecture-course-modules.md#Performance-Considerations] - Index strategy
- [Source: docs/architecture-course-modules.md#API-Contracts] - Module-aware queries
- [Source: docs/epics-course-modules.md#Story-4.6] - Original story specification

### Learnings from Previous Stories

**From Story 1.2 (Status: drafted)**

- **Indexes created**: moduleId indexes added to CourseContent, Assignment, Discussion
- **Foreign key relationship**: Module relation available for queries

**From Epic 4 stories (Status: drafted)**

- **Filter usage**: Stories 4.1-4.4 will use these filters
- **Consistent pattern**: All module-aware features need these API updates

## Dev Agent Record

### Context Reference

docs/stories/4-6-api-updates-for-module-filtering.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No significant debugging required

### Completion Notes List

- All 6 API endpoints updated with optional moduleId query parameter filtering
- Each endpoint now includes moduleId and module relation in responses
- Results ordered by module.orderIndex for proper sequencing
- JSDoc documentation added to all modified endpoints
- Pre-existing build issues in prisma/scripts/migrate-to-modules.ts fixed as part of this work
- Pattern used: `...(moduleId && { moduleId })` for optional filtering in where clause

### File List

- src/app/api/student/courses/[id]/content/route.ts
- src/app/api/instructor/courses/[id]/content/route.ts
- src/app/api/student/courses/[id]/assignments/route.ts
- src/app/api/instructor/courses/[id]/assignments/route.ts
- src/app/api/student/courses/[id]/discussions/route.ts
- src/app/api/instructor/courses/[id]/discussions/route.ts
- prisma/scripts/migrate-to-modules.ts (pre-existing model name fixes)
