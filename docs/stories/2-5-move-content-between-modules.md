# Story 2.5: Move Content Between Modules

Status: done

## Story

As an instructor,
I want to move content items between modules,
so that I can reorganize my course structure.

## Acceptance Criteria

1. "Move to Module" option in content item menu
2. Modal shows list of available modules
3. Moving updates moduleId and adjusts orderIndex
4. Success toast confirms move
5. Source and destination modules refresh

## Tasks / Subtasks

- [x] Task 1: Add "Move to Module" menu option (AC: 1)
  - [x] 1.1: Locate content item action menu (in ModuleContentList)
  - [x] 1.2: Add "Move to Module" option to menu
  - [x] 1.3: Option triggers modal open with content context

- [x] Task 2: Create MoveToModuleModal component (AC: 2)
  - [x] 2.1: Create `src/components/modules/MoveToModuleModal.tsx`
  - [x] 2.2: Fetch list of modules for the course
  - [x] 2.3: Display modules as selectable list (exclude current module)
  - [x] 2.4: Highlight currently selected destination
  - [x] 2.5: Add "Move" and "Cancel" buttons

- [x] Task 3: Implement move API endpoint (AC: 3)
  - [x] 3.1: Create PUT /api/instructor/courses/[id]/content/[contentId]/move
  - [x] 3.2: Accept { targetModuleId: string }
  - [x] 3.3: Update moduleId for specified content item
  - [x] 3.4: Set orderIndex to max+1 in target module
  - [x] 3.5: Return success response

- [x] Task 4: Wire modal to move action (AC: 3, 4)
  - [x] 4.1: On "Move" click, call move API
  - [x] 4.2: Show loading state during API call
  - [x] 4.3: On success: close modal, show success toast
  - [x] 4.4: On error: show error toast, keep modal open

- [x] Task 5: Refresh both modules (AC: 5)
  - [x] 5.1: After successful move, refetch modules list
  - [x] 5.2: Both source and destination counts should update
  - [x] 5.3: If source module is expanded, content list refreshes

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md#API-Contracts):

```typescript
// PUT /api/instructor/courses/[id]/modules/[moduleId]/move-content
{
  "contentIds": ["content1", "content2"],
  "targetModuleId": "newModuleId"
}
```

Component addition:
```
src/components/modules/
├── MoveToModuleModal.tsx (NEW)
└── ...
```

### UI Flow

1. User clicks "..." menu on content item
2. Selects "Move to Module"
3. Modal shows modules (current highlighted as source)
4. User selects destination module
5. Clicks "Move"
6. Toast: "Content moved to [Module Name]"

### Project Structure Notes

- Move endpoint in existing modules API structure
- Modal similar to other selector modals in app

### Key Implementation Details

1. **Exclude current module** - Don't show module item is already in
2. **Batch support** - API supports multiple contentIds for future multi-select
3. **orderIndex handling** - Append to end of target module (max+1)
4. **Assignments and Discussions** - Same pattern can apply, but this story focuses on CourseContent

### Future Extension

This pattern will also be used for:
- Moving assignments between modules
- Moving discussions between modules
- Multi-select move operations

### References

- [Source: docs/architecture-course-modules.md#API-Contracts] - move-content endpoint
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR007 move content between modules
- [Source: docs/epics-course-modules.md#Story-2.5] - Original story specification

### Learnings from Previous Story

**From Story 2-4-module-content-management (Status: drafted)**

- **Content list component**: ModuleContentList has content items with menus
- **Module context**: Content items know their moduleId
- **Refresh pattern**: useModules.refetch() available for list refresh

[Source: stories/2-4-module-content-management.md]

## Dev Agent Record

### Context Reference

[Story Context XML](./2-5-move-content-between-modules.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All acceptance criteria verified as implemented
- MoveToModuleModal provides Radix UI dialog with module selection
- API endpoint at `/api/instructor/courses/[id]/content/[contentId]/move`
- Menu option "Move to Module" in content item action menu (MoreHorizontal)
- Success toast shows target module name
- onSuccess callback triggers parent refetch for both modules

### File List

- `src/components/modules/MoveToModuleModal.tsx` - Move modal component
- `src/components/modules/ModuleContentList.tsx` - Content list with move menu option
- `src/app/api/instructor/courses/[id]/content/[contentId]/move/route.ts` - Move API endpoint
- `src/components/modules/SortableModuleCard.tsx` - Integrates modal with onMoveSuccess callback
