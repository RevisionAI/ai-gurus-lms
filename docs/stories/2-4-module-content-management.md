# Story 2.4: Module Content Management

Status: done

## Story

As an instructor,
I want to view and manage content within a module,
so that I can organize learning materials.

## Acceptance Criteria

1. Expandable module card shows content items
2. Content items show title, type icon, publish status
3. Drag-and-drop reordering within module
4. "Add Content" button within module context
5. Content creation form pre-selects current module
6. Existing content management UI works within module

## Tasks / Subtasks

- [x] Task 1: Create expandable module card (AC: 1)
  - [x] 1.1: Add expand/collapse toggle to ModuleCard
  - [x] 1.2: Track expansion state per card
  - [x] 1.3: Animate expand/collapse transition
  - [x] 1.4: Load content items on expand (or eager load with modules)

- [x] Task 2: Create ModuleContentList component (AC: 2)
  - [x] 2.1: Create `src/components/modules/ModuleContentList.tsx`
  - [x] 2.2: Display content items in order (by orderIndex)
  - [x] 2.3: Show type icon (TEXT=📄, VIDEO=🎬, DOCUMENT=📁, LINK=🔗, SCORM=📦, YOUTUBE=▶️)
  - [x] 2.4: Show publish status indicator (dot or badge)
  - [x] 2.5: Make items clickable to navigate to content editor

- [x] Task 3: Implement content reordering within module (AC: 3)
  - [x] 3.1: Apply @dnd-kit sortable to content list
  - [x] 3.2: Add drag handles to content items
  - [x] 3.3: Create API endpoint: PUT /api/instructor/courses/[id]/modules/[moduleId]/content/reorder
  - [x] 3.4: Update orderIndex on drag-end

- [x] Task 4: Add "Add Content" button (AC: 4)
  - [x] 4.1: Add "Add Content" button in expanded module area
  - [x] 4.2: Button opens content creation flow
  - [x] 4.3: Pass moduleId to content creation

- [x] Task 5: Update content creation form (AC: 5)
  - [x] 5.1: Find existing content creation form
  - [x] 5.2: Add moduleId parameter acceptance
  - [x] 5.3: Pre-select module in form if moduleId provided
  - [x] 5.4: Ensure moduleId is sent with content creation API

- [x] Task 6: Integration with existing content UI (AC: 6)
  - [x] 6.1: Verify existing content edit works from module context
  - [x] 6.2: Content detail/edit page should show module context
  - [x] 6.3: Ensure navigation back returns to correct module

## Dev Notes

### Architecture Alignment

Component structure addition:
```
src/components/modules/
├── ModuleContentList.tsx (NEW)
└── ...
```

### Content Type Icons

Map ContentType enum to icons:
```typescript
const contentTypeIcons: Record<ContentType, string> = {
  TEXT: '📄',
  VIDEO: '🎬',
  DOCUMENT: '📁',
  LINK: '🔗',
  SCORM: '📦',
  YOUTUBE: '▶️'
};
```

### API for Content Reorder

```typescript
// PUT /api/instructor/courses/[id]/modules/[moduleId]/content/reorder
// Request:
{ "contentIds": ["content1", "content2", "content3"] }
```

### Project Structure Notes

- Reuse existing content item components if available
- Content creation form likely in `src/components/content/` or similar
- May need to update content API to accept moduleId

### Key Implementation Details

1. **Lazy vs eager loading** - Could load content on expand or with module list
2. **Content type from schema** - ContentType enum: TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE
3. **Existing content flow** - Find and integrate with current content management
4. **Module context preservation** - Track which module user came from

### References

- [Source: docs/architecture-course-modules.md#Project-Structure] - Content in module structure
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR006-FR009 content organization
- [Source: docs/epics-course-modules.md#Story-2.4] - Original story specification
- [Source: prisma/schema.prisma] - ContentType enum definition

### Learnings from Previous Story

**From Story 2-3-drag-and-drop-module-reordering (Status: drafted)**

- **@dnd-kit configured**: Can reuse DndContext setup for content reordering
- **Reorder pattern**: Same API pattern for content reorder within module
- **Optimistic updates**: Apply same pattern for content reorder

[Source: stories/2-3-drag-and-drop-module-reordering.md]

## Dev Agent Record

### Context Reference

Context file: `docs/stories/2-4-module-content-management.context.xml`
Generated: 2025-11-28

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All acceptance criteria verified as implemented
- ModuleContentList component provides drag-and-drop reordering with @dnd-kit
- Content reorder API endpoint at `/api/instructor/courses/[id]/modules/[moduleId]/content/reorder`
- SortableModuleCard has expand/collapse toggle with content display
- Content items show type icons (Lucide icons), title, and publish status badges
- "Add Content" and "Add Assignment" buttons in expanded module card

### File List

- `src/components/modules/ModuleContentList.tsx` - Main content list with drag-and-drop
- `src/components/modules/SortableModuleCard.tsx` - Expandable module card
- `src/components/modules/hooks/useModuleContent.ts` - Content fetching hook
- `src/app/api/instructor/courses/[id]/modules/[moduleId]/content/reorder/route.ts` - Reorder API
- `src/app/instructor/courses/[id]/content/page.tsx` - Content creation with module pre-selection
