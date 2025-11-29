# Story 4.1: Module Context in Gradebook

Status: done

## Story

As an instructor,
I want the gradebook to show which module each assignment belongs to,
so that I can understand grades in context.

## Acceptance Criteria

1. Gradebook grid shows module name for each assignment column
2. Assignments grouped by module in column headers
3. Filter dropdown to show only assignments from specific module
4. Module column in CSV export
5. Sort by module option

## Tasks / Subtasks

- [x] Task 1: Update gradebook data fetching (AC: 1, 2)
  - [x] 1.1: Locate gradebook data query
  - [x] 1.2: Include module relation when fetching assignments
  - [x] 1.3: Add module.title to assignment data

- [x] Task 2: Add module name to column headers (AC: 1, 2)
  - [x] 2.1: Locate gradebook grid component
  - [x] 2.2: Add module name above assignment name in header
  - [x] 2.3: Group adjacent assignments from same module visually
  - [x] 2.4: Optional: Color-code or border groups

- [x] Task 3: Add module filter dropdown (AC: 3)
  - [x] 3.1: Add filter dropdown above gradebook grid
  - [x] 3.2: Populate with unique modules from course
  - [x] 3.3: Include "All Modules" option
  - [x] 3.4: Filter grid columns based on selection

- [x] Task 4: Update CSV export (AC: 4)
  - [x] 4.1: Locate gradebook export function
  - [x] 4.2: Add "Module" column to export
  - [x] 4.3: Module name appears for each assignment column

- [x] Task 5: Add sort by module option (AC: 5)
  - [x] 5.1: Add "Module" to sort options
  - [x] 5.2: Sorting groups assignments by module orderIndex
  - [x] 5.3: Within module, maintain existing sort order

## Dev Notes

### Gradebook Enhancement

Current gradebook likely shows:
```
| Student | Assignment 1 | Assignment 2 | Assignment 3 |
```

Enhanced to:
```
| Student | Module 1           | Module 2        |
|         | Assignment 1 | A2  | Assignment 3    |
```

Or simpler:
```
| Student | A1 (Module 1) | A2 (Module 1) | A3 (Module 2) |
```

### Filter UI

```
┌─────────────────────────────────────────────────┐
│ Gradebook                                       │
│ Filter by module: [All Modules ▼]               │
│                                                 │
│ | Student | Quiz (M1) | Essay (M1) | Final (M2)|│
│ |---------|-----------|------------|-----------|│
│ | Alice   | 85        | 92         | --        |│
│ | Bob     | 78        | 88         | --        |│
└─────────────────────────────────────────────────┘
```

### Project Structure Notes

- Find gradebook component (likely in `src/components/gradebook/` or instructor area)
- May need to update gradebook API to include module data

### Key Implementation Details

1. **Module data in query** - Include module when fetching assignments
2. **Visual grouping** - Keep it simple - module name in header or parentheses
3. **Filter state** - Can be URL param or local state
4. **Export format** - CSV with Module column: "Assignment,Module,Student1,Student2,..."

### Database Query Update

```typescript
const assignments = await prisma.assignment.findMany({
  where: { courseId, deletedAt: null },
  include: { module: { select: { id: true, title: true, orderIndex: true } } },
  orderBy: [{ module: { orderIndex: 'asc' } }, { createdAt: 'asc' }]
});
```

### References

- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR013 gradebook module context
- [Source: docs/PRD-course-modules.md#User-Journeys] - Journey 3 gradebook with modules
- [Source: docs/epics-course-modules.md#Story-4.1] - Original story specification

### Learnings from Previous Stories

**From Epic 1 (Status: drafted)**

- **moduleId on Assignment**: Assignment model has moduleId foreign key
- **Module relation**: Can include module in queries

## Dev Agent Record

### Context Reference

- docs/stories/4-1-module-context-in-gradebook.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- **AC-1**: Added `moduleTitle` field to GradebookAssignment type, displayed above assignment title in header cells with blue text styling
- **AC-2**: Added blue-300 left border to mark module group boundaries in both header row and data cells
- **AC-3**: Added module filter dropdown to GradebookFilters component, extracts unique modules from assignments, supports API filtering via `moduleId` query param
- **AC-4**: CSV export now includes `[Module Name]` prefix in assignment column headers
- **AC-5**: Both gradebook API and export API now order assignments by `module.orderIndex` first, then by `dueDate`

### File List

**Modified:**
- `src/components/gradebook/types.ts` - Added moduleId, moduleTitle, moduleOrderIndex to GradebookAssignment interface
- `src/components/gradebook/EditableGradebookGrid.tsx` - Updated column headers to show module name and add module group borders
- `src/components/gradebook/EditableGradebookRow.tsx` - Added module grouping borders to data cells
- `src/components/gradebook/EditableGradeCell.tsx` - Added className prop to support module grouping borders
- `src/components/gradebook/GradebookFilters.tsx` - Added moduleId to filter state and module filter dropdown UI
- `src/validators/gradebook.ts` - Added moduleId to gradebook filters schema and parsing
- `src/lib/csv-export.ts` - Added moduleTitle to CSVGradebookAssignment, updated header generation
- `src/app/api/instructor/gradebook/[courseId]/route.ts` - Added module relation to query, module filtering, and module-first ordering
- `src/app/api/instructor/gradebook/[courseId]/export/route.ts` - Added module relation to query, module filtering, module-first ordering, and moduleTitle in export

---

## Senior Developer Review (AI)

**Reviewer:** Ed
**Date:** 2025-11-29
**Outcome:** Changes Requested

### Summary

Story 4-1 implements module context in the gradebook to help instructors understand grades within their modular course structure. The implementation adds module information to column headers, visual grouping, filtering capabilities, CSV export enhancement, and module-based sorting.

**Overall Assessment:** The implementation demonstrates good understanding of the requirements and includes most functionality. However, there are critical type safety issues and missing test coverage that must be addressed before approval.

### Key Findings

#### Critical Severity

1. **Type Safety Issue in API Route Interface**
   - **Issue:** The `GradebookAssignment` interface in `/src/app/api/instructor/gradebook/[courseId]/route.ts` (lines 56-61) is missing the module fields (`moduleId`, `moduleTitle`, `moduleOrderIndex`) that are being added to the data at lines 301-303.
   - **Impact:** TypeScript type checking is broken. The interface doesn't match the actual runtime data structure, defeating type safety benefits.
   - **Evidence:**
     - Interface definition at `/src/app/api/instructor/gradebook/[courseId]/route.ts:56-61` lacks module fields
     - Data mapping at `/src/app/api/instructor/gradebook/[courseId]/route.ts:301-303` adds these fields
     - Component type at `/src/components/gradebook/types.ts:42-50` correctly includes module fields
   - **Fix Required:** Update the interface to match the component type definition

2. **Missing Test Coverage**
   - **Issue:** No tests exist for any of the module context functionality
   - **Impact:** Changes are unverified and regression-prone
   - **Evidence:** Search for test files containing "moduleId", "moduleTitle", or "moduleOrderIndex" returns no results
   - **Required Tests:**
     - Unit tests for module filter in GradebookFilters
     - Integration tests for module filtering in gradebook API
     - Integration tests for CSV export with module columns
     - Tests for module-based sorting

#### High Severity

3. **Inconsistent Null Handling**
   - **Issue:** Module fields use different null patterns: `|| null` (line 301-302) vs `?? null` (line 303)
   - **Impact:** Potential inconsistent behavior when module is undefined vs null
   - **Evidence:** `/src/app/api/instructor/gradebook/[courseId]/route.ts:301-303`
   - **Fix Required:** Use consistent `?? null` pattern throughout

4. **Missing Error Handling for Module Relations**
   - **Issue:** No defensive coding for cases where module relation fails to load
   - **Impact:** If module data is missing due to DB issues, gradebook may display incorrectly
   - **Evidence:** Code assumes module relation will always succeed or be null
   - **Fix Required:** Add try-catch or validation for module data integrity

#### Medium Severity

5. **No Visual Indication for Null Modules**
   - **Issue:** When `assignment.moduleTitle` is null, no module name is shown in header
   - **Impact:** Assignments without modules are harder to identify
   - **Evidence:** `/src/components/gradebook/EditableGradebookGrid.tsx:173-177` only renders when `moduleTitle` exists
   - **Suggestion:** Show "No Module" or "Unassigned" when moduleTitle is null

6. **Module Dropdown Not Shown When No Modules Exist**
   - **Issue:** The module filter dropdown only renders if `uniqueModules.length > 0`
   - **Impact:** UI behavior changes based on data; inconsistent layout
   - **Evidence:** `/src/components/gradebook/GradebookFilters.tsx:270-290`
   - **Suggestion:** Always show the dropdown but disable it when empty, or show a placeholder

#### Low Severity

7. **Magic Number for Blue Border Color**
   - **Issue:** Hard-coded `border-l-blue-300` class repeated in multiple files
   - **Impact:** Harder to maintain consistent theming
   - **Evidence:** Used in EditableGradebookGrid.tsx:167 and EditableGradebookRow.tsx:102
   - **Suggestion:** Extract to constant or CSS class

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-1 | Gradebook grid shows module name for each assignment column | ✅ IMPLEMENTED | `/src/components/gradebook/EditableGradebookGrid.tsx:173-177` - Module title displayed above assignment title in blue text |
| AC-2 | Assignments grouped by module in column headers | ✅ IMPLEMENTED | `/src/components/gradebook/EditableGradebookGrid.tsx:158-168` - Blue left border marks module group boundaries; `/src/components/gradebook/EditableGradebookRow.tsx:89-102` - Same border applied to data cells |
| AC-3 | Filter dropdown to show only assignments from specific module | ✅ IMPLEMENTED | `/src/components/gradebook/GradebookFilters.tsx:178-189,270-290` - Module filter dropdown with "All Modules" option; `/src/validators/gradebook.ts:111-114` - moduleId validation; `/src/app/api/instructor/gradebook/[courseId]/route.ts:243-246` - API filtering |
| AC-4 | Module column in CSV export | ✅ IMPLEMENTED | `/src/lib/csv-export.ts:92-96` - Module name prefixed in assignment headers `[Module Name] Assignment Title`; `/src/app/api/instructor/gradebook/[courseId]/export/route.ts:409` - moduleTitle included in CSV data |
| AC-5 | Sort by module option | ✅ IMPLEMENTED | `/src/app/api/instructor/gradebook/[courseId]/route.ts:289-292` - Module orderIndex as primary sort, dueDate as secondary; `/src/app/api/instructor/gradebook/[courseId]/export/route.ts:325-328` - Same ordering in export |

**Note:** While all ACs are implemented, AC-3 and AC-4 have medium-severity issues that should be addressed.

### Task Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1.1: Locate gradebook data query | ✅ Complete | ✅ Complete | Gradebook API route located and updated |
| Task 1.2: Include module relation | ✅ Complete | ✅ Complete | `/src/app/api/instructor/gradebook/[courseId]/route.ts:281-287` - module relation included in query |
| Task 1.3: Add module.title to assignment data | ✅ Complete | ⚠️ Partial | Data added at runtime (lines 301-303) but **TypeScript interface missing fields** (Critical Issue #1) |
| Task 2.1: Locate gradebook grid component | ✅ Complete | ✅ Complete | EditableGradebookGrid component identified |
| Task 2.2: Add module name above assignment | ✅ Complete | ✅ Complete | `/src/components/gradebook/EditableGradebookGrid.tsx:173-177` |
| Task 2.3: Group adjacent assignments visually | ✅ Complete | ✅ Complete | Blue left border for module boundaries |
| Task 2.4: Optional color-code or border groups | ✅ Complete | ✅ Complete | Blue-300 left border implemented |
| Task 3.1: Add filter dropdown | ✅ Complete | ✅ Complete | `/src/components/gradebook/GradebookFilters.tsx:270-290` |
| Task 3.2: Populate with unique modules | ✅ Complete | ✅ Complete | `/src/components/gradebook/GradebookFilters.tsx:194-206` |
| Task 3.3: Include "All Modules" option | ✅ Complete | ✅ Complete | Line 282: `<option value="all">All Modules</option>` |
| Task 3.4: Filter grid columns | ✅ Complete | ✅ Complete | API-side filtering via moduleId query param |
| Task 4.1: Locate export function | ✅ Complete | ✅ Complete | CSV export route identified |
| Task 4.2: Add "Module" column | ✅ Complete | ✅ Complete | Module name prefixed in headers (not separate column, acceptable variation) |
| Task 4.3: Module name in assignment columns | ✅ Complete | ✅ Complete | `/src/lib/csv-export.ts:94-96` |
| Task 5.1: Add "Module" to sort options | ✅ Complete | ✅ Complete | Implemented as default sort (module-first ordering) |
| Task 5.2: Sort by module orderIndex | ✅ Complete | ✅ Complete | `/src/app/api/instructor/gradebook/[courseId]/route.ts:290` |
| Task 5.3: Within module, maintain sort order | ✅ Complete | ✅ Complete | Secondary sort by dueDate (line 291) |

### Test Coverage

**Current Status:** ❌ NO TESTS

**Required Tests (Critical Issue #2):**

- [ ] Unit: GradebookAssignment interface includes module fields
- [ ] Unit: EditableGradebookGrid renders module name in headers
- [ ] Unit: EditableGradebookGrid shows module group borders
- [ ] Unit: EditableGradebookGrid handles null moduleTitle
- [ ] Unit: GradebookFilters renders module dropdown
- [ ] Unit: GradebookFilters extracts unique modules correctly
- [ ] Unit: GradebookFilters handles empty modules list
- [ ] Integration: GET /api/instructor/gradebook/[courseId]?moduleId=xyz filters assignments
- [ ] Integration: Gradebook API returns module fields in assignment data
- [ ] Integration: Gradebook API sorts by module.orderIndex then dueDate
- [ ] Integration: CSV export includes module prefix in headers
- [ ] Integration: CSV export filters by moduleId
- [ ] Integration: CSV export sorts by module
- [ ] E2E: Instructor views gradebook with module context
- [ ] E2E: Instructor filters gradebook by module
- [ ] E2E: Instructor exports CSV with module columns

### Code Quality Observations

**Strengths:**
- Clean separation of concerns between components, API, and utilities
- Good use of TypeScript interfaces (where defined)
- Consistent naming conventions
- Proper null-safety with optional chaining in most places
- Well-documented code with inline comments referencing story/ACs
- Good visual design choices (blue borders for module grouping)

**Weaknesses:**
- Type safety compromised by missing interface fields
- No test coverage
- Inconsistent null coalescing operators
- Magic values (color classes) not extracted to constants
- Missing defensive error handling

### Action Items

#### Critical (Must Fix Before Approval)

- [ ] [CRITICAL] Update GradebookAssignment interface in `/src/app/api/instructor/gradebook/[courseId]/route.ts:56-61` to include `moduleId?: string | null`, `moduleTitle?: string | null`, `moduleOrderIndex?: number | null` [file: /src/app/api/instructor/gradebook/[courseId]/route.ts:56-61]
- [ ] [CRITICAL] Add unit tests for GradebookFilters module dropdown functionality [file: __tests__/unit/components/gradebook/GradebookFilters.test.tsx]
- [ ] [CRITICAL] Add integration tests for gradebook API module filtering [file: __tests__/integration/api/instructor/gradebook.test.ts]
- [ ] [CRITICAL] Add integration tests for CSV export with module columns [file: __tests__/integration/api/instructor/gradebook-export.test.ts]

#### High (Should Fix)

- [ ] [HIGH] Use consistent `?? null` pattern for module field null handling [file: /src/app/api/instructor/gradebook/[courseId]/route.ts:301-303]
- [ ] [HIGH] Add error handling/validation for module relation data integrity [file: /src/app/api/instructor/gradebook/[courseId]/route.ts:280-304]

#### Medium (Nice to Have)

- [ ] [MEDIUM] Show "No Module" or "Unassigned" when moduleTitle is null in headers [file: /src/components/gradebook/EditableGradebookGrid.tsx:173-177]
- [ ] [MEDIUM] Always show module filter dropdown (disabled when empty) for consistent UI [file: /src/components/gradebook/GradebookFilters.tsx:270-290]

#### Low (Optional)

- [ ] [LOW] Extract `border-l-blue-300` to a named constant or CSS class [file: /src/components/gradebook/EditableGradebookGrid.tsx:167, /src/components/gradebook/EditableGradebookRow.tsx:102]

### Recommendation

**Status: Changes Requested**

The implementation successfully delivers all acceptance criteria functionality, but has critical type safety issues and zero test coverage. The missing module fields in the API route's TypeScript interface represents a significant type safety gap that must be fixed. Additionally, the complete absence of tests for this feature is unacceptable for production code.

**Before Approval:**
1. Fix the TypeScript interface mismatch (Critical #1)
2. Add minimum viable test coverage (Critical #2) - at least integration tests for the API endpoints
3. Address null handling consistency (High #3)

**After these fixes are verified, the story can be approved for production deployment.**
