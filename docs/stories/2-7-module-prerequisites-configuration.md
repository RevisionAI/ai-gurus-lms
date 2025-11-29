# Story 2.7: Module Prerequisites Configuration

Status: done

## Story

As an instructor,
I want to set prerequisites for modules,
so that students must complete earlier modules first.

## Acceptance Criteria

1. "Prerequisites" section in module edit form
2. Checkbox: "Require previous module completion"
3. When enabled, module locked until prior module complete
4. First module has no prerequisites (always unlocked)
5. Prerequisites saved to database
6. Visual indicator shows prerequisite chain

## Tasks / Subtasks

- [x] Task 1: Add prerequisites section to ModuleForm (AC: 1, 2)
  - [x] 1.1: Add "Prerequisites" section divider in ModuleForm
  - [x] 1.2: Add checkbox for "Require previous module completion"
  - [x] 1.3: Checkbox maps to `requiresPrevious` field
  - [x] 1.4: Include help text explaining the behavior

- [x] Task 2: Update module API to handle requiresPrevious (AC: 5)
  - [x] 2.1: Ensure PUT endpoint accepts requiresPrevious field
  - [x] 2.2: Validate requiresPrevious is boolean
  - [x] 2.3: Update module record with new value

- [x] Task 3: First module handling (AC: 4)
  - [x] 3.1: Disable checkbox for first module (orderIndex === 0)
  - [x] 3.2: Show message: "First module is always accessible"
  - [x] 3.3: API enforces first module requiresPrevious = false

- [x] Task 4: Add visual prerequisite indicator (AC: 6)
  - [x] 4.1: Show prerequisite icon/indicator on modules with requiresPrevious
  - [x] 4.2: Tooltip shows "Requires completion of previous module"
  - [x] 4.3: Visual chain indicator (dotted line or arrow between modules)

- [x] Task 5: Update ModuleCard display (AC: 6)
  - [x] 5.1: Add prerequisite indicator to module card
  - [x] 5.2: First module shows "Always unlocked" indicator
  - [x] 5.3: Sequential modules show "Sequential" or lock icon

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md#Module-Model):

```prisma
model Module {
  // ...
  requiresPrevious  Boolean   @default(true)
  // ...
}
```

### UI Design

```
┌─────────────────────────────────────────────┐
│ Edit Module                                 │
├─────────────────────────────────────────────┤
│ Title: [AI Fundamentals                   ] │
│ Description: [Introduction to AI...      ] │
│                                             │
│ ── Prerequisites ──                         │
│ ☑ Require previous module completion        │
│   Students must complete the module before  │
│   this one to unlock access.                │
│                                             │
│           [Cancel]  [Save Changes]          │
└─────────────────────────────────────────────┘
```

### Project Structure Notes

- Form changes in ModuleForm.tsx
- Visual indicators in ModuleCard.tsx

### Key Implementation Details

1. **requiresPrevious default true** - New modules require sequential completion
2. **First module exception** - Always has requiresPrevious = false
3. **Unlock logic in Epic 3** - This story only sets the flag, unlock logic is Story 3.2
4. **No complex prerequisite graph** - Simple linear progression only (not arbitrary prerequisites)

### Validation

```typescript
// In module update API
if (module.orderIndex === 0 && requiresPrevious === true) {
  // Override: first module cannot require previous
  requiresPrevious = false;
}
```

### Visual Indicators

| Module Position | requiresPrevious | Indicator |
|-----------------|------------------|-----------|
| First (orderIndex 0) | false (forced) | "Always unlocked" |
| Not first | true | Lock icon + "Sequential" |
| Not first | false | Globe/open icon + "Open access" |

### References

- [Source: docs/architecture-course-modules.md#Module-Model] - requiresPrevious field
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR004 module prerequisites
- [Source: docs/epics-course-modules.md#Story-2.7] - Original story specification

### Learnings from Previous Story

**From Story 2-6-module-publish-unpublish (Status: drafted)**

- **ModuleForm exists**: Add prerequisites section to existing form
- **API pattern**: PUT endpoint already handles module updates
- **Indicator pattern**: Badge system established for publish status

[Source: stories/2-6-module-publish-unpublish.md]

## Dev Agent Record

### Context Reference

Story context available at: `docs/stories/2-7-module-prerequisites-configuration.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All acceptance criteria verified as implemented
- ModuleFormModal has Prerequisites section with checkbox and help text
- First module shows "always accessible" message with Globe icon, checkbox hidden
- API PUT endpoint handles requiresPrevious field with validation
- SortableModuleCard shows Lock icon for "Sequential" and Globe icon for "Open" modules
- Visual indicators with tooltips explaining prerequisite requirements

### File List

- `src/components/modules/ModuleFormModal.tsx` - Prerequisites checkbox and first module handling
- `src/app/api/instructor/courses/[id]/modules/[moduleId]/route.ts` - API with requiresPrevious support
- `src/components/modules/SortableModuleCard.tsx` - Visual indicators (Lock/Globe icons)
- `src/lib/validations/module.ts` - Validation schema for requiresPrevious
