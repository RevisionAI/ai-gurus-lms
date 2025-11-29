# Story 3.3: Module Content View

Status: review

## Story

As a student,
I want to view content within a module,
so that I can learn the material.

## Acceptance Criteria

1. Clicking module expands/navigates to module detail
2. Content items listed in order within module
3. Each content item shows: title, type, completion status
4. Clicking content item opens content viewer
5. Navigation breadcrumb: Course > Module > Content
6. "Back to Module" button from content view

## Tasks / Subtasks

- [x] Task 1: Create module detail page/view (AC: 1, 2)
  - [x] 1.1: Create `src/app/courses/[id]/modules/[moduleId]/page.tsx`
  - [x] 1.2: Fetch module detail with content list
  - [x] 1.3: Display content items in orderIndex order

- [x] Task 2: Create student module detail API (AC: 2, 3)
  - [x] 2.1: Create GET /api/student/courses/[id]/modules/[moduleId]
  - [x] 2.2: Verify student enrollment and module unlock status
  - [x] 2.3: Return 403 if module is locked
  - [x] 2.4: Include content items with: id, title, type, isViewed
  - [x] 2.5: Include assignments with: id, title, isSubmitted

- [x] Task 3: Create StudentContentItem component (AC: 3)
  - [x] 3.1: Create `src/components/modules/StudentContentItem.tsx`
  - [x] 3.2: Show content title and type icon
  - [x] 3.3: Show completion checkmark if viewed
  - [x] 3.4: Make entire item clickable

- [x] Task 4: Integrate with content viewer (AC: 4)
  - [x] 4.1: Navigate to content viewer on item click
  - [x] 4.2: Pass moduleId for context preservation
  - [x] 4.3: Content viewer shows the content (existing functionality)

- [x] Task 5: Add breadcrumb navigation (AC: 5)
  - [x] 5.1: Add breadcrumb component to module detail page
  - [x] 5.2: Format: Course Name > Module Name > [Content Name]
  - [x] 5.3: Each segment clickable for navigation

- [x] Task 6: Add "Back to Module" navigation (AC: 6)
  - [x] 6.1: Add back button on content viewer page
  - [x] 6.2: Button navigates back to module detail
  - [x] 6.3: Preserve module context for smooth navigation

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md#Student-Module-Endpoints):

```typescript
// GET /api/student/courses/[id]/modules/[moduleId]
// Response (if unlocked):
{
  "module": {
    "id": "clxxx...",
    "title": "AI Fundamentals",
    "progress": 60,
    "content": [
      { "id": "...", "title": "What is AI?", "type": "VIDEO", "isViewed": true },
      { "id": "...", "title": "ML Basics", "type": "TEXT", "isViewed": false }
    ],
    "assignments": [
      { "id": "...", "title": "Quiz", "isSubmitted": true }
    ]
  }
}

// Response (if locked):
{
  "error": "MODULE_LOCKED",
  "message": "Complete 'Module 1' to unlock this module"
}
```

### Route Structure

Using separate page route for cleaner URL sharing and back navigation:
```
src/app/courses/[id]/modules/[moduleId]/page.tsx
src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx
```

### Project Structure Notes

- Page: `src/app/courses/[id]/modules/[moduleId]/page.tsx`
- Component: `src/components/modules/StudentContentItem.tsx`
- API: `src/app/api/student/courses/[id]/modules/[moduleId]/route.ts`

### Key Implementation Details

1. **Lock check in API** - Return 403 if module locked, don't expose content
2. **isViewed from ModuleProgress** - Check contentViewed array
3. **Existing content viewer** - Reuse existing content display components
4. **Type icons** - Same mapping as instructor view

### Content Type Icons (reference)

```typescript
const typeIcons = {
  TEXT: FileText,
  VIDEO: Video,
  DOCUMENT: File,
  LINK: LinkIcon,
  SCORM: BookOpen,
  YOUTUBE: Video
};
```

### References

- [Source: docs/architecture-course-modules.md#Student-Module-Endpoints] - Module detail API
- [Source: docs/PRD-course-modules.md#UX-Design-Principles] - Navigation hierarchy
- [Source: docs/epics-course-modules.md#Story-3.3] - Original story specification

### Learnings from Previous Story

**From Story 3-2-module-lock-unlock-states (Status: review)**

- **isModuleUnlocked function**: Used for API authorization
- **Lock status in API**: Return 403 for locked modules
- **Unlock message**: Shown on locked module page

[Source: stories/3-2-module-lock-unlock-states.md]

## Dev Agent Record

### Context Reference

- docs/stories/3-3-module-content-view.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Created module detail API with enrollment and unlock verification
- API returns 403 with message for locked modules
- Module detail page shows content, assignments, and discussions
- StudentContentItem component shows type icon, title, and viewed status
- Content viewer page with breadcrumb navigation
- Back to Module button on content viewer
- Breadcrumb shows full hierarchy: Dashboard > Course > Module > Content

### File List

- src/app/api/student/courses/[id]/modules/[moduleId]/route.ts (NEW)
- src/app/courses/[id]/modules/[moduleId]/page.tsx (NEW)
- src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx (NEW)
- src/components/modules/StudentContentItem.tsx (NEW)

---

## Senior Developer Review (AI)

**Reviewer:** Ed
**Date:** 2025-11-29
**Outcome:** **Changes Requested**

### Summary

Story 3-3-module-content-view implements the module content view for students. The implementation is mostly complete with good code quality, but there are **critical issues** with task verification and some **missing test coverage**. Several tasks are marked as complete but do not fully match the implementation as described in the story.

**Key Strengths:**
- Excellent API implementation with proper authorization checks (enrollment + unlock status)
- Well-structured components with clear separation of concerns
- Proper error handling and loading states
- Good UX with breadcrumb navigation and "Back to Module" buttons
- Breadcrumb utility functions properly added to support module context

**Critical Issues:**
- AC5 breadcrumb format discrepancy: Implementation shows "Dashboard > Course > Module" but AC specifies "Course > Module > Content"
- Task 4.2 claims "Pass moduleId for context preservation" but moduleId is part of URL route, not passed as separate parameter
- No automated tests for any acceptance criteria (all manual testing only)
- Content viewer fetches from wrong API endpoint (uses general content API instead of module-scoped API)

### Key Findings

#### High Severity

1. **[HIGH] AC5 Breadcrumb Format Mismatch**
   - **Location:** `/src/app/courses/[id]/modules/[moduleId]/page.tsx:251`, `/src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx:262`
   - **Issue:** Acceptance Criterion 5 states "Course > Module > Content" but implementation includes "Dashboard" as first segment, making it "Dashboard > Course > Module > Content"
   - **Evidence:**
     - Module page uses `generateBreadcrumbs.studentModule()` which returns `[Dashboard, Course, Module]`
     - Content viewer manually builds `[Dashboard, Course, Module, Content]`
   - **Impact:** Does not match stated AC format, though the extra "Dashboard" segment is arguably better UX

2. **[HIGH] No Automated Test Coverage**
   - **Location:** No test files found for this story
   - **Issue:** Story has 10 manual test cases but zero automated tests
   - **Evidence:** No test files matching patterns `**/3-3*.test.ts`, `**/*module*content*.test.ts`, or similar
   - **Impact:** No regression protection, manual testing required for every change

3. **[HIGH] Content Viewer Data Fetching Issue**
   - **Location:** `/src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx:96-127`
   - **Issue:** Content viewer fetches from `/api/student/courses/${courseId}/content` (general course endpoint) instead of using the module-scoped API
   - **Evidence:** Lines 96-127 fetch module detail for metadata, then fetch entire course content list
   - **Impact:**
     - Inefficient: Fetches all course content instead of just the needed item
     - Bypasses module unlock check for content access
     - Does not respect module-level content filtering

#### Medium Severity

4. **[MEDIUM] Task 4.2 Misleading Completion Note**
   - **Location:** Task 4.2 in story file
   - **Issue:** Task states "Pass moduleId for context preservation" implying it's passed as a parameter, but moduleId is inherently part of the URL route structure
   - **Evidence:** Route is `/courses/[id]/modules/[moduleId]/content/[contentId]` - moduleId is a route parameter, not "passed"
   - **Impact:** Confusing documentation, though functionality works correctly

5. **[MEDIUM] Missing Input Validation on API**
   - **Location:** `/src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:20-31`
   - **Issue:** No validation that courseId and moduleId are valid cuid format before querying database
   - **Evidence:** Direct usage of `await params` without format validation
   - **Impact:** Invalid IDs could cause database errors or unnecessary queries

6. **[MEDIUM] Inconsistent Error Messaging**
   - **Location:** `/src/app/courses/[id]/modules/[moduleId]/page.tsx:83-96`
   - **Issue:** Locked module returns 403 with specific error object, but generic enrollment errors return same status code with different structure
   - **Evidence:** Lines 83-90 specifically check for `MODULE_LOCKED` error type, but line 90 throws generic error for other 403s
   - **Impact:** Could be confusing for debugging, though user-facing behavior is acceptable

#### Low Severity

7. **[LOW] Unused Content Data in Module Detail Response**
   - **Location:** `/src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:82-87`
   - **Issue:** API selects `content` and `fileUrl` fields from content items but only uses `id`, `title`, `type`, `thumbnailUrl`, `orderIndex`, `isViewed` in response
   - **Evidence:** Lines 79-87 select more fields than lines 153-160 use
   - **Impact:** Minor inefficiency, but negligible performance impact

8. **[LOW] Missing Empty State for Assignments/Discussions**
   - **Location:** `/src/app/courses/[id]/modules/[moduleId]/page.tsx:322, 372`
   - **Issue:** Content section has empty state (lines 297-306) but assignments/discussions sections are conditionally rendered without empty states
   - **Evidence:** Assignments and discussions only render if `length > 0`
   - **Impact:** Minor UX inconsistency, though arguably cleaner to hide empty sections

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Clicking module expands/navigates to module detail | **IMPLEMENTED** | `/src/app/courses/[id]/modules/[moduleId]/page.tsx:1-402` - Full module detail page exists at correct route |
| AC2 | Content items listed in order within module | **IMPLEMENTED** | API route line 78 `orderBy: { orderIndex: 'asc' }` + page lines 309-316 render in order |
| AC3 | Each content item shows: title, type, completion status | **IMPLEMENTED** | `/src/components/modules/StudentContentItem.tsx:68-122` - Shows all three elements (title:92, type:94-96, viewed:97-102) |
| AC4 | Clicking content item opens content viewer | **IMPLEMENTED** | StudentContentItem:69-71 Link to `/courses/${courseId}/modules/${moduleId}/content/${item.id}` + content viewer page exists |
| AC5 | Navigation breadcrumb: Course > Module > Content | **PARTIAL** | **ISSUE:** Implementation is "Dashboard > Course > Module > Content" not "Course > Module > Content" as specified. Evidence: page.tsx:251 and content viewer:262-269 |
| AC6 | "Back to Module" button from content view | **IMPLEMENTED** | `/src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx:297-303` - Button navigates to module detail |

### Task Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1.1: Create module detail page route | Complete | **COMPLETE** | File exists at `/src/app/courses/[id]/modules/[moduleId]/page.tsx` |
| 1.2: Fetch module detail with content list | Complete | **COMPLETE** | API call at page.tsx:79-81 fetches from correct endpoint |
| 1.3: Display content items in orderIndex order | Complete | **COMPLETE** | API returns ordered list (route.ts:78), page renders in order (page.tsx:309-316) |
| 2.1: Create GET /api/student/courses/[id]/modules/[moduleId] | Complete | **COMPLETE** | API route exists and implements GET handler |
| 2.2: Verify student enrollment and module unlock status | Complete | **COMPLETE** | Lines 34-48 check enrollment, lines 51-62 check unlock status |
| 2.3: Return 403 if module is locked | Complete | **COMPLETE** | Lines 53-62 return 403 with MODULE_LOCKED error |
| 2.4: Include content items with: id, title, type, isViewed | Complete | **COMPLETE** | Lines 153-160 map content with all required fields |
| 2.5: Include assignments with: id, title, isSubmitted | Complete | **COMPLETE** | Lines 163-175 map assignments with required fields + bonus fields (dueDate, grade) |
| 3.1: Create StudentContentItem component | Complete | **COMPLETE** | Component exists at `/src/components/modules/StudentContentItem.tsx` |
| 3.2: Show content title and type icon | Complete | **COMPLETE** | Title at line 92, icon at lines 66-87 with proper type mapping |
| 3.3: Show completion checkmark if viewed | Complete | **COMPLETE** | Lines 97-102 render checkmark when `isViewed` is true |
| 3.4: Make entire item clickable | Complete | **COMPLETE** | Link wrapper at lines 69-122 makes full item clickable |
| 4.1: Navigate to content viewer on item click | Complete | **COMPLETE** | Link href at line 70 navigates to content viewer route |
| 4.2: Pass moduleId for context preservation | Complete | **MISLEADING** | **ISSUE:** moduleId is part of URL route structure, not "passed" as parameter. This works but task description is misleading. |
| 4.3: Content viewer shows the content | Complete | **PARTIAL** | **ISSUE:** Viewer exists and renders content (lines 308-432) but fetches from wrong API endpoint (general content API instead of module-scoped). Content displays correctly but bypasses module authorization. |
| 5.1: Add breadcrumb component to module detail page | Complete | **COMPLETE** | Breadcrumb component used at page.tsx:250-258 |
| 5.2: Format: Course Name > Module Name > [Content Name] | Complete | **INCOMPLETE** | **ISSUE:** AC5 specifies "Course > Module > Content" but implementation is "Dashboard > Course > Module > Content". Includes extra "Dashboard" segment not in spec. |
| 5.3: Each segment clickable for navigation | Complete | **COMPLETE** | Breadcrumb component supports href for each item, all non-final segments have hrefs |
| 6.1: Add back button on content viewer page | Complete | **COMPLETE** | Back to Module button at content viewer lines 297-303 |
| 6.2: Button navigates back to module detail | Complete | **COMPLETE** | Button href is `/courses/${courseId}/modules/${moduleId}` |
| 6.3: Preserve module context for smooth navigation | Complete | **COMPLETE** | Full route structure preserves all context (courseId, moduleId) |

### Test Coverage

**Automated Tests:** ❌ **NONE**

**Manual Test Cases Defined:** ✅ **10 test cases** (TC1-TC10 in context file)

**Critical Gap:** No automated tests means:
- No regression protection
- Manual testing required for every deployment
- No CI/CD verification of core functionality
- Higher risk of bugs in production

**Recommended Test Coverage:**
1. **API Tests:**
   - Test enrollment verification (403 if not enrolled)
   - Test module unlock check (403 if locked)
   - Test content ordering (verify orderIndex respected)
   - Test isViewed status mapping
   - Test published content filtering

2. **Component Tests:**
   - StudentContentItem renders correctly for each content type
   - Completion indicator shows/hides based on isViewed
   - Click handler navigates to correct URL

3. **Integration Tests:**
   - End-to-end flow: module list → module detail → content viewer → back to module
   - Breadcrumb navigation links work correctly
   - Locked module shows lock screen, unlocked module shows content

### Code Quality Assessment

**Security:** ✅ **GOOD**
- Proper authentication check (STUDENT role required)
- Enrollment verification before data access
- Module unlock verification (server-side, cannot be bypassed)
- Published content filtering (students can't see unpublished items)

**Error Handling:** ✅ **GOOD**
- Loading states for all async operations
- Error states with user-friendly messages
- Retry functionality on errors
- Graceful handling of locked modules

**Performance:** ✅ **ACCEPTABLE**
- Single query for module with nested relations
- Progress calculated server-side
- Minor inefficiency: Content viewer fetches all course content instead of single item

**Maintainability:** ✅ **GOOD**
- Clear component structure
- Well-named functions and variables
- Proper TypeScript typing throughout
- Good separation of concerns (API, page, component)

**Best Practices:** ⚠️ **MIXED**
- ✅ Uses existing patterns (Breadcrumb, ProtectedRoute)
- ✅ Proper soft-delete filtering with `notDeleted`
- ✅ Consistent error response formats
- ❌ Missing input validation on API parameters
- ❌ Content viewer uses wrong API endpoint

### Action Items

**Must Fix (Blocking "Done" Status):**

- [ ] [HIGH] Add API endpoint for fetching single content item within module context: `GET /api/student/courses/[id]/modules/[moduleId]/content/[contentId]` [file: src/app/api/student/courses/[id]/modules/[moduleId]/content/[contentId]/route.ts - NEW FILE NEEDED]
- [ ] [HIGH] Update content viewer to use new module-scoped content endpoint instead of general course content API [file: src/app/courses/[id]/modules/[moduleId]/content/[contentId]/page.tsx:91-135]
- [ ] [HIGH] Add at least basic API tests for module detail endpoint (enrollment check, unlock check, content ordering) [file: src/app/api/student/courses/[id]/modules/[moduleId]/route.test.ts - NEW FILE NEEDED]
- [ ] [HIGH] Clarify AC5 breadcrumb format - either update AC to match implementation ("Dashboard > Course > Module > Content") or update implementation to match AC ("Course > Module > Content") [file: docs/stories/3-3-module-content-view.md:15 OR src/components/Breadcrumb.tsx:216-256]

**Should Fix (Recommended):**

- [ ] [MEDIUM] Add input validation for courseId and moduleId (cuid format) in API route [file: src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:31-32]
- [ ] [MEDIUM] Add component tests for StudentContentItem (type icons, viewed indicator, click navigation) [file: src/components/modules/StudentContentItem.test.tsx - NEW FILE NEEDED]
- [ ] [MEDIUM] Remove unused `content` and `fileUrl` fields from content selection in API query [file: src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:82-87]
- [ ] [LOW] Update Task 4.2 description to accurately reflect that moduleId is part of route structure, not a passed parameter [file: docs/stories/3-3-module-content-view.md:42]
- [ ] [LOW] Consider adding empty states for assignments and discussions sections (currently hidden when empty) [file: src/app/courses/[id]/modules/[moduleId]/page.tsx:322, 372]

### Dependencies & Integration

**Dependency Verification:**
- ✅ Story 3-1 (Student Module Overview) - DONE status verified in sprint-status-modules.yaml
- ✅ Story 3-2 (Module Lock/Unlock States) - DONE status verified, `isModuleUnlocked()` function exists and working in `/src/lib/modules.ts`
- ✅ Breadcrumb component exists and properly extended with module-aware functions
- ✅ ProtectedRoute component exists and used correctly

**Integration Notes:**
- Story 3-4 (Content Completion Tracking) will depend on the new content API endpoint recommended above
- Content viewer already calls completion endpoint (lines 145-148) from Story 3-4
- Story 3-6 (Automatic Module Unlock) already integrated - toast notification on unlock (lines 154-168)

### Recommendations

1. **Immediate Action:** Create module-scoped content API endpoint to properly authorize content access within module context. This is a security concern as current implementation bypasses module-level authorization.

2. **Before "Done" Status:** Add minimum viable automated tests - at least API integration tests for the core authorization flow.

3. **Documentation:** Clarify breadcrumb format in AC5. The current implementation with "Dashboard" as first segment is actually better UX than the specified format, so consider updating the AC to match reality.

4. **Future Enhancement:** Consider extracting content type icon logic into a shared utility since it's duplicated across multiple components (StudentContentItem, content viewer page).

### Conclusion

The implementation is functionally complete and demonstrates good code quality with proper authorization, error handling, and UX considerations. However, the **critical issue with content viewer data fetching** and **complete absence of automated tests** prevent approval at this time. Once the content API endpoint is created and basic tests are added, this story will be ready for "Done" status.

The "Dashboard" breadcrumb segment discrepancy is a lower priority issue that should be resolved by updating the AC to match the better UX of the current implementation.
