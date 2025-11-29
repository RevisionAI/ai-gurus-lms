# Story 2.8: Delete Module

Status: done

## Story

As an instructor,
I want to delete a module,
so that I can remove unwanted course structure.

## Acceptance Criteria

1. Delete option in module menu
2. Confirmation dialog warns about contained content
3. Option to move content to another module before delete
4. Option to delete module and all content
5. Soft delete (sets deletedAt)
6. Success toast confirms deletion

## Tasks / Subtasks

- [x] Task 1: Add delete option to module menu (AC: 1)
  - [x] 1.1: Add "Delete" option to ModuleCard action menu
  - [x] 1.2: Style delete option in red/warning color
  - [x] 1.3: Option triggers confirmation dialog

- [x] Task 2: Create delete confirmation modal (AC: 2, 3, 4)
  - [x] 2.1: Create `src/components/modules/DeleteModuleModal.tsx`
  - [x] 2.2: Show warning message with content/assignment/discussion counts
  - [x] 2.3: If module has content, show two options:
    - "Move content to another module, then delete"
    - "Delete module and all its content"
  - [x] 2.4: If module is empty, show simple confirmation
  - [x] 2.5: Add "Delete" and "Cancel" buttons

- [x] Task 3: Implement move-then-delete option (AC: 3)
  - [x] 3.1: If "Move content" selected, show module selector
  - [x] 3.2: Move all content to selected target module
  - [x] 3.3: Then proceed with soft delete of empty module

- [x] Task 4: Implement delete with content option (AC: 4, 5)
  - [x] 4.1: DELETE endpoint soft-deletes module (sets deletedAt)
  - [x] 4.2: Content, assignments, discussions with this moduleId: soft-deleted
  - [x] 4.3: API handles move-then-delete in single request

- [x] Task 5: Success handling (AC: 6)
  - [x] 5.1: On successful delete, close modal
  - [x] 5.2: Show success toast: "Module deleted successfully"
  - [x] 5.3: Refetch module list to update UI
  - [x] 5.4: If content was moved, toast mentions that too

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md) and schema:

- Module uses soft delete (deletedAt timestamp)
- Foreign keys are OnDelete: SetNull, so content survives module deletion

```
src/components/modules/
├── DeleteModuleModal.tsx (NEW)
└── ...
```

### Delete API

The existing DELETE endpoint from Story 1.5 performs soft delete:

```typescript
// DELETE /api/instructor/courses/[id]/modules/[moduleId]
// Sets deletedAt = new Date()
// Content/assignments/discussions automatically have moduleId set to null (SetNull)
```

### UI Flow

**If module has content:**
```
┌─────────────────────────────────────────────────┐
│ Delete Module                              [X]  │
├─────────────────────────────────────────────────┤
│ ⚠️ This module contains:                        │
│    • 5 content items                            │
│    • 2 assignments                              │
│    • 1 discussion                               │
│                                                 │
│ What would you like to do?                      │
│                                                 │
│ ○ Move content to another module, then delete   │
│   └─ Select module: [Dropdown]                  │
│                                                 │
│ ○ Delete module and orphan content              │
│   (Content will remain but not be in any module)│
│                                                 │
│              [Cancel]  [Delete Module]          │
└─────────────────────────────────────────────────┘
```

**If module is empty:**
```
┌─────────────────────────────────────────────────┐
│ Delete Module                              [X]  │
├─────────────────────────────────────────────────┤
│ Are you sure you want to delete this module?    │
│ "Module 2: Decision Framework"                  │
│                                                 │
│              [Cancel]  [Delete]                 │
└─────────────────────────────────────────────────┘
```

### Project Structure Notes

- Use existing dialog/modal patterns
- Leverage MoveToModuleModal selector pattern from 2.5

### Key Implementation Details

1. **Soft delete** - Never hard delete modules
2. **Orphaned content** - SetNull means content loses moduleId, doesn't get deleted
3. **Move-then-delete** - Two API calls: move-content then delete
4. **Cannot delete last module** - Consider validation if course must have at least one module

### Edge Cases

- Deleting first module (students may have progress tracking)
- Module with only unpublished content
- Moving content when target module is full (no limit currently)

### References

- [Source: docs/architecture-course-modules.md#Modified-Models] - OnDelete: SetNull behavior
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR001 delete modules
- [Source: docs/epics-course-modules.md#Story-2.8] - Original story specification

### Learnings from Previous Story

**From Story 2-7-module-prerequisites-configuration (Status: drafted)**

- **Module form/card patterns**: Established UI patterns for module interactions
- **Action menu exists**: Add delete to existing menu
- **Move content API**: From 2.5, reusable for move-then-delete

[Source: stories/2-7-module-prerequisites-configuration.md]

## Dev Agent Record

### Context Reference

Context file: [2-8-delete-module.context.xml](./2-8-delete-module.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All acceptance criteria verified as implemented
- DeleteModuleModal has three modes: select, move, delete
- Warning shows content/assignment/discussion counts with AlertTriangle icon
- Move option shows module selector, then calls DELETE with moveContentTo param
- Delete option shows confirmation with itemized list of what will be deleted
- API DELETE endpoint supports soft delete and optional move-then-delete
- Success toast shows count of moved items or deletion confirmation

### File List

- `src/components/modules/DeleteModuleModal.tsx` - Delete modal with move/delete options
- `src/components/modules/SortableModuleCard.tsx` - Delete menu option (Trash2 icon, red styling)
- `src/app/api/instructor/courses/[id]/modules/[moduleId]/route.ts` - DELETE endpoint with soft delete
