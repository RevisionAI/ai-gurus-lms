# Story 2.6: Module Publish/Unpublish

Status: done

## Story

As an instructor,
I want to publish or unpublish entire modules,
so that I can control what students see.

## Acceptance Criteria

1. Publish/Unpublish toggle on module card
2. Unpublished modules show "Draft" badge
3. Publishing module makes it visible to students
4. Option to cascade publish to all content within module
5. Confirmation dialog for unpublishing (warns about student access)
6. API updates isPublished field

## Tasks / Subtasks

- [x] Task 1: Add publish toggle to ModuleCard (AC: 1, 2)
  - [x] 1.1: Add publish/unpublish button or toggle to card actions
  - [x] 1.2: Show "Draft" badge when isPublished is false
  - [x] 1.3: Show "Published" badge when isPublished is true
  - [x] 1.4: Toggle button label reflects current state

- [x] Task 2: Implement publish API endpoint (AC: 6)
  - [x] 2.1: Create PUT /api/instructor/courses/[id]/modules/[moduleId]/publish
  - [x] 2.2: Accept { isPublished: boolean, cascadeToContent?: boolean }
  - [x] 2.3: Update module.isPublished
  - [x] 2.4: If cascadeToContent true, update all content/assignments in module
  - [x] 2.5: Return updated module

- [x] Task 3: Create cascade publish option (AC: 4)
  - [x] 3.1: When publishing, show modal asking about cascade
  - [x] 3.2: Options: "Publish module only" or "Publish module and all content"
  - [x] 3.3: If cascade selected, set cascadeToContent: true in API call

- [x] Task 4: Create unpublish confirmation dialog (AC: 5)
  - [x] 4.1: On unpublish click, show confirmation modal
  - [x] 4.2: Warning message: "Students will no longer be able to access this module"
  - [x] 4.3: Show count of enrolled students affected
  - [x] 4.4: "Unpublish" and "Cancel" buttons

- [x] Task 5: Wire UI to API (AC: 1, 3, 6)
  - [x] 5.1: On toggle/button click, call appropriate API
  - [x] 5.2: Show loading state during API call
  - [x] 5.3: On success: update local state, show toast
  - [x] 5.4: Refetch module list to sync state

## Dev Notes

### Architecture Alignment

New API endpoint:
```
src/app/api/instructor/courses/[id]/modules/[moduleId]/
└── publish/
    └── route.ts (NEW - PUT)
```

### API Contract

```typescript
// PUT /api/instructor/courses/[id]/modules/[moduleId]/publish
// Request:
{
  "isPublished": true,
  "cascadeToContent": true  // optional, defaults to false
}

// Response:
{
  "module": { ...updatedModule },
  "cascadedCount": 5  // number of content items also published
}
```

### UI States

| Module State | Badge | Toggle Action |
|--------------|-------|---------------|
| Published | Green "Published" | Shows "Unpublish" option |
| Draft | Gray "Draft" | Shows "Publish" option |

### Project Structure Notes

- Publish endpoint under module's route group
- Confirmation modals use existing dialog pattern

### Key Implementation Details

1. **Cascade scope** - Affects CourseContent, Assignment, Discussion with this moduleId
2. **Student visibility** - Only published modules show in student views
3. **Enrolled count** - Query enrollments count for confirmation message
4. **Optimistic update** - Update badge immediately, rollback on error

### Cascade Publish Logic

```typescript
if (cascadeToContent) {
  await prisma.courseContent.updateMany({
    where: { moduleId, deletedAt: null },
    data: { isPublished: true }
  });
  await prisma.assignment.updateMany({
    where: { moduleId, deletedAt: null },
    data: { isPublished: true }
  });
  // Discussions don't have isPublished in current schema
}
```

### References

- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR005 bulk publish/unpublish
- [Source: docs/epics-course-modules.md#Story-2.6] - Original story specification
- [Source: docs/architecture-course-modules.md#Security-Considerations] - Module visibility rules

### Learnings from Previous Story

**From Story 2-5-move-content-between-modules (Status: drafted)**

- **Module card actions**: Existing action menu pattern to add publish option
- **Toast pattern**: Use same success/error toast pattern
- **Refresh pattern**: useModules.refetch() for state sync

[Source: stories/2-5-move-content-between-modules.md]

## Dev Agent Record

### Context Reference

Context file generated: `docs/stories/2-6-module-publish-unpublish.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All acceptance criteria verified as implemented
- SortableModuleCard has Published/Draft badges with green/gray styling
- Menu has Eye/EyeOff icons for Publish/Unpublish actions
- Publish dialog offers "Publish module only" and "Publish module and all content" options
- Unpublish dialog shows warning about student access
- API supports cascadeToContent parameter for bulk publishing
- Success toast shows cascade count when applicable

### File List

- `src/components/modules/SortableModuleCard.tsx` - Publish/unpublish UI with dialogs
- `src/app/api/instructor/courses/[id]/modules/[moduleId]/publish/route.ts` - Publish API endpoint
