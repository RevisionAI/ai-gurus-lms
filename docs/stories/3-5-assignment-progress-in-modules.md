# Story 3.5: Assignment Progress in Modules

Status: review

## Story

As a student,
I want my assignment submissions to count toward module progress,
so that completing assignments unlocks next modules.

## Acceptance Criteria

1. Assignments visible within module context
2. Submitted assignments marked as complete in progress
3. Module progress includes assignment weight (50%)
4. Module shows "Complete" when all content viewed AND all assignments submitted
5. Progress calculation: (viewedContent/totalContent * 0.5) + (submittedAssignments/totalAssignments * 0.5)

## Tasks / Subtasks

- [x] Task 1: Display assignments in module detail (AC: 1)
  - [x] 1.1: Update module detail API to include assignments (done in 3-3)
  - [x] 1.2: Show assignments section in StudentModuleDetail page (done in 3-3)
  - [x] 1.3: Each assignment shows: title, due date, submission status (done in 3-3)
  - [x] 1.4: Link to assignment submission page (done in 3-3)

- [x] Task 2: Track assignment submission status (AC: 2)
  - [x] 2.1: Query Submission table for user's submissions (done in 3-3)
  - [x] 2.2: Mark assignment as "Submitted" if submission exists (done in 3-3)
  - [x] 2.3: Mark as "Graded" if grade exists (done in 3-3)
  - [x] 2.4: Update UI to show submission status badge (done in 3-3)

- [x] Task 3: Update progress calculation (AC: 3, 5)
  - [x] 3.1: Modify calculateModuleProgress in module-progress.ts (done in 3-4)
  - [x] 3.2: Add assignment progress calculation (done in 3-4)
  - [x] 3.3: Query submissions count for module's assignments (done in 3-4)
  - [x] 3.4: Formula: content 50% + assignments 50% (done in 3-4)

- [x] Task 4: Handle module completion state (AC: 4)
  - [x] 4.1: Check if progress = 100 after calculation
  - [x] 4.2: Set completedAt timestamp when 100% reached
  - [x] 4.3: Module status changes to "completed"

- [x] Task 5: Update progress on assignment submission (AC: 3)
  - [x] 5.1: Find assignment submission handler
  - [x] 5.2: After successful submission, recalculate module progress
  - [x] 5.3: Or: Progress calculated on-demand (no extra trigger needed)

## Dev Notes

### Architecture Alignment

Per [architecture-course-modules.md](../architecture-course-modules.md#Progress-Calculation):

```typescript
export async function calculateModuleProgress(
  moduleId: string,
  userId: string
): Promise<ModuleProgressResult> {
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
  let contentScore = contentTotal > 0
    ? (contentViewed / contentTotal) * 50
    : 50;
  let assignmentScore = assignmentsTotal > 0
    ? (assignmentsSubmitted / assignmentsTotal) * 50
    : 50;

  return {
    percentage: Math.round(contentScore + assignmentScore),
    isComplete: percentage === 100,
    ...
  };
}
```

### Module Detail API Enhancement

```typescript
// GET /api/student/courses/[id]/modules/[moduleId]
{
  "module": {
    "assignments": [
      {
        "id": "assign1",
        "title": "AI Concepts Quiz",
        "dueDate": "2025-12-01",
        "isSubmitted": true,
        "isGraded": true,
        "grade": 85
      }
    ]
  }
}
```

### Project Structure Notes

- Progress calculation in `src/lib/module-progress.ts`
- Assignment data already in module includes

### Key Implementation Details

1. **Submission-based completion** - Just having a submission counts (grade not required)
2. **Edge case: No assignments** - Assignment portion = 50% auto
3. **Edge case: No content** - Content portion = 50% auto
4. **completedAt trigger** - Set when progress reaches 100%

### Progress States

| Content | Assignments | Total Progress |
|---------|-------------|----------------|
| 0/5 (0%) | 0/2 (0%) | 0% |
| 3/5 (60%) | 1/2 (50%) | 55% |
| 5/5 (100%) | 2/2 (100%) | 100% |
| 5/5 (100%) | 0/0 (n/a) | 100% (no assignments = 50% auto) |

### References

- [Source: docs/architecture-course-modules.md#Progress-Calculation] - Full implementation
- [Source: docs/architecture-course-modules.md#ADR-002] - 50/50 formula
- [Source: docs/PRD-course-modules.md#Functional-Requirements] - FR019
- [Source: docs/epics-course-modules.md#Story-3.5] - Original story specification

### Learnings from Previous Story

**From Story 3-4-content-completion-tracking (Status: drafted)**

- **calculateModuleProgress exists**: Extend to include assignments
- **ModuleProgress model**: Tracks contentViewed, assignments queried separately
- **Progress formula**: 50/50 split established

[Source: stories/3-4-content-completion-tracking.md]

## Dev Agent Record

### Context Reference

- docs/stories/3-5-assignment-progress-in-modules.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Most functionality was already implemented in Stories 3-3 and 3-4
- Added checkAndUpdateModuleCompletion function to module-progress.ts
- Module detail API now calls checkAndUpdateModuleCompletion to ensure completedAt is set
- This handles the case where assignment submissions complete a module
- Progress is calculated on-demand, no submission trigger needed

### File List

- src/lib/module-progress.ts (MODIFIED - added checkAndUpdateModuleCompletion)
- src/app/api/student/courses/[id]/modules/[moduleId]/route.ts (MODIFIED - calls checkAndUpdateModuleCompletion)

---

## Senior Developer Review (AI)

**Reviewer:** Ed
**Date:** 2025-11-29
**Story:** 3-5-assignment-progress-in-modules
**Outcome:** ⚠️ **Changes Requested**

### Summary

Story 3-5 implements assignment submission tracking toward module progress using a 50/50 weighting formula (content 50% + assignments 50%). The core functionality is **mostly complete** with assignment submission status visible in the module detail view and progress calculations working correctly. However, there are **critical issues**:

1. **CRITICAL**: Progress calculation logic has a **severe bug** - it doesn't use the correct 50/50 formula from `calculateModuleProgress()` in the module detail API (lines 185-191 of route.ts)
2. **HIGH**: Missing unit tests for the core progress calculation function
3. **MEDIUM**: Task 2.3 claims "Mark as 'Graded' if grade exists" but the UI only shows graded status in badges, not a separate completion state
4. **LOW**: No tests to verify the progress calculation formula

### Key Findings

#### CRITICAL Severity

**C1: Incorrect Progress Calculation in Module Detail API**
- **Location**: `src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:185-191`
- **Issue**: The module detail API calculates progress using a simple formula `(completedContent + completedAssignments) / totalItems * 100` instead of using the 50/50 weighted formula from `calculateModuleProgress()`
- **Evidence**:
  ```typescript
  // Lines 185-191 - WRONG FORMULA
  const totalItems = contentWithProgress.length + assignmentsWithStatus.length;
  const completedContent = contentWithProgress.filter((c) => c.isViewed).length;
  const completedAssignments = assignmentsWithStatus.filter((a) => a.isSubmitted).length;
  const progressPercent =
    totalItems > 0
      ? Math.round(((completedContent + completedAssignments) / totalItems) * 100)
      : 0;
  ```
- **Expected**: Should call `calculateModuleProgress(moduleId, session.user.id)` and use `progressResult.moduleProgress`
- **Impact**: Students see incorrect progress percentages in the module detail view. The 50/50 formula (AC5) is **NOT** honored in the UI.

**C2: Progress Calculation Discrepancy**
- **Location**: Multiple APIs show different progress values
- **Issue**: The module detail API (route.ts:185-191) calculates progress differently than `checkAndUpdateModuleCompletion` (called at line 150)
- **Impact**: Inconsistent progress values across different parts of the application
- **Evidence**: `checkAndUpdateModuleCompletion` uses the correct 50/50 formula, but the returned `progressPercent` in the response uses the wrong formula

#### HIGH Severity

**H1: Missing Unit Tests for Progress Calculation**
- **Location**: `__tests__/unit/lib/` directory
- **Issue**: No unit tests found for `calculateModuleProgress()` or `checkAndUpdateModuleCompletion()`
- **Expected**: Per story context (lines 646-688), should have tests for:
  - Normal case (55% progress)
  - Complete case (100% with completedAt)
  - No assignments edge case
  - No content edge case
  - Empty module edge case
  - Unpublished items filtering
  - Idempotent content viewing
- **Impact**: Core business logic is untested, increasing risk of regression bugs

**H2: Task Validation Discrepancy**
- **Location**: Tasks marked as `[x]` (done in 3-3)
- **Issue**: Tasks 1.1-1.4 and 2.1-2.4 claim work was "done in 3-3" but there's no evidence this story actually modified those files
- **Evidence**: The story's File List only mentions 2 files modified, not the assignment display UI components
- **Impact**: Misleading task completion status - unclear if assignment display was actually implemented in this story or Story 3-3

#### MEDIUM Severity

**M1: No Visual Distinction for Graded State**
- **Location**: `src/app/courses/[id]/modules/[moduleId]/page.tsx:350-363`
- **Issue**: Task 2.3 states "Mark as 'Graded' if grade exists" suggesting a completion/progress state, but implementation only shows graded status in badges
- **Evidence**: Assignments show status badges but graded vs submitted doesn't affect progress calculation (only submission existence matters)
- **Impact**: Minor - the requirement is met but the task description is misleading

**M2: Missing Integration Tests**
- **Location**: `__tests__/` directory
- **Issue**: No integration tests found for:
  - Assignment submission triggering module progress update
  - Module completion unlocking next module (3.5 + 3.6 integration)
  - Module detail API returning correct submission status
- **Expected**: Per story context lines 691-720
- **Impact**: No automated verification of end-to-end workflows

#### LOW Severity

**L1: Progress Recalculation Logging**
- **Location**: `src/app/api/student/assignments/[id]/submission/route.ts:146-149, 238-240`
- **Issue**: Progress calculation errors are logged but submission still succeeds
- **Evidence**: `catch` blocks log errors without alerting the user
- **Impact**: Silent failures in progress tracking - students won't know if progress wasn't updated
- **Recommendation**: Consider returning progress update status in response or at least logging more context

**L2: Duplicate Progress Calculation Calls**
- **Location**: `src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:150, 185-191`
- **Issue**: Progress is calculated twice - once via `checkAndUpdateModuleCompletion()` (correct formula) and once inline (wrong formula)
- **Impact**: Inefficient and confusing - the correct calculation result is discarded
- **Recommendation**: Remove inline calculation and use the result from `checkAndUpdateModuleCompletion()`

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Assignments visible within module context | ✅ IMPLEMENTED | `page.tsx:322-368` - Assignments section displays title, due date, max points, submission status |
| AC2 | Submitted assignments marked as complete in progress | ⚠️ PARTIAL | `route.ts:163-174` - Submission status tracked, but progress calculation is incorrect (see C1) |
| AC3 | Module progress includes assignment weight (50%) | ❌ BROKEN | `route.ts:185-191` - Uses wrong formula. Should use 50/50 from `calculateModuleProgress()` |
| AC4 | Module shows "Complete" when all content viewed AND all assignments submitted | ⚠️ PARTIAL | `checkAndUpdateModuleCompletion()` correctly sets completedAt at 100%, but module detail shows wrong progress (see C1) |
| AC5 | Progress calculation: (viewedContent/totalContent * 0.5) + (submittedAssignments/totalAssignments * 0.5) | ❌ BROKEN | `module-progress.ts:35-105` has correct formula, but module detail API doesn't use it (see C1) |

**Summary**: 1/5 fully implemented, 2/5 partial, 2/5 broken

### Task Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1.1: Update module detail API to include assignments | ✅ Complete (done in 3-3) | ✅ VERIFIED | `route.ts:89-112` - API includes assignments with submissions and grades |
| Task 1.2: Show assignments section in StudentModuleDetail page | ✅ Complete (done in 3-3) | ✅ VERIFIED | `page.tsx:322-368` - Assignments section rendered |
| Task 1.3: Each assignment shows title, due date, submission status | ✅ Complete (done in 3-3) | ✅ VERIFIED | `page.tsx:337-363` - All fields displayed |
| Task 1.4: Link to assignment submission page | ✅ Complete (done in 3-3) | ✅ VERIFIED | `page.tsx:332-334` - Link to `/courses/{id}/assignments/{assignmentId}` |
| Task 2.1: Query Submission table for user's submissions | ✅ Complete (done in 3-3) | ✅ VERIFIED | `route.ts:99-105` - Submissions queried in include |
| Task 2.2: Mark assignment as "Submitted" if submission exists | ✅ Complete (done in 3-3) | ✅ VERIFIED | `route.ts:171` - `isSubmitted: !!submission` |
| Task 2.3: Mark as "Graded" if grade exists | ✅ Complete (done in 3-3) | ✅ VERIFIED | `route.ts:172-173` - `isGraded` and `grade` fields set |
| Task 2.4: Update UI to show submission status badge | ✅ Complete (done in 3-3) | ✅ VERIFIED | `page.tsx:351-363` - Status badges for graded/submitted/not submitted |
| Task 3.1: Modify calculateModuleProgress in module-progress.ts | ✅ Complete (done in 3-4) | ✅ VERIFIED | `module-progress.ts:35-105` - Function exists with correct formula |
| Task 3.2: Add assignment progress calculation | ✅ Complete (done in 3-4) | ✅ VERIFIED | `module-progress.ts:59-78` - Assignment counting implemented |
| Task 3.3: Query submissions count for module's assignments | ✅ Complete (done in 3-4) | ✅ VERIFIED | `module-progress.ts:69-78` - Submissions counted correctly |
| Task 3.4: Formula: content 50% + assignments 50% | ✅ Complete (done in 3-4) | ⚠️ PARTIAL | `module-progress.ts:80-93` - Formula correct, but NOT used in module detail API |
| Task 4.1: Check if progress = 100 after calculation | ✅ Complete | ✅ VERIFIED | `module-progress.ts:94, 268` - `isModuleComplete` calculated correctly |
| Task 4.2: Set completedAt timestamp when 100% reached | ✅ Complete | ✅ VERIFIED | `module-progress.ts:278-295` - `completedAt` set in `checkAndUpdateModuleCompletion()` |
| Task 4.3: Module status changes to "completed" | ✅ Complete | ✅ VERIFIED | `module-progress.ts:268-309` - Completion status tracked |
| Task 5.1: Find assignment submission handler | ✅ Complete | ✅ VERIFIED | `submission/route.ts:55-162` - POST handler found |
| Task 5.2: After successful submission, recalculate module progress | ✅ Complete | ✅ VERIFIED | `submission/route.ts:138-150` - `checkAndUpdateModuleCompletion` called after submission |
| Task 5.3: Or: Progress calculated on-demand (no extra trigger needed) | ✅ Complete | ✅ VERIFIED | Both approaches used - submission triggers AND on-demand in module detail |

**Summary**: 17/18 tasks verified complete, 1 partial (Task 3.4 - formula exists but not used everywhere)

**Critical Issue**: Despite tasks being marked complete, the module detail API doesn't use the correct progress calculation function, which is a **HIGH SEVERITY** implementation error.

### Test Coverage

#### Unit Tests
- ❌ **MISSING**: No unit tests found for `calculateModuleProgress()`
- ❌ **MISSING**: No unit tests found for `checkAndUpdateModuleCompletion()`
- ❌ **MISSING**: No unit tests found for `markContentViewed()`

**Expected Tests** (per story context):
- calculateModuleProgress - normal case (55% progress)
- calculateModuleProgress - 100% completion
- calculateModuleProgress - no assignments edge case
- calculateModuleProgress - no content edge case
- calculateModuleProgress - empty module edge case
- calculateModuleProgress - unpublished items filtering
- markContentViewed - idempotent behavior

#### Integration Tests
- ❌ **MISSING**: No integration tests for assignment submission → progress update workflow
- ❌ **MISSING**: No integration tests for module completion → next module unlock
- ❌ **MISSING**: No integration tests for module detail API assignment status

#### Manual Testing
- ⚠️ **UNKNOWN**: No evidence of manual testing documented
- ℹ️ Story notes say "Most functionality was already implemented in Stories 3-3 and 3-4" which suggests testing may have been done in those stories

### Code Quality

#### Positive Aspects
✅ Good error handling in submission API (catches progress errors without failing submission)
✅ Proper authorization checks (enrollment verification, module unlock checks)
✅ Input validation using Zod schemas
✅ Soft delete awareness (uses `notDeleted` filter)
✅ Edge case handling (no content, no assignments auto-complete to 50%)
✅ Idempotent content viewing (won't duplicate viewed content)
✅ Clear separation of concerns (progress logic in lib, API in routes)

#### Issues
❌ **Progress calculation inconsistency** - Two different formulas used in the same flow
❌ **No unit tests** - Core business logic untested
❌ **Duplicate calculations** - Inefficient progress calculation calls
⚠️ Silent error handling - Progress errors logged but not surfaced to user
⚠️ No input validation on progress API responses

### Security Review
✅ Authorization: Proper session checks and role verification
✅ Enrollment validation: Students must be enrolled to view module
✅ Module unlock validation: Locked modules return 403
✅ Input sanitization: Zod schemas validate route params
✅ SQL injection protection: Prisma ORM used throughout

No security vulnerabilities identified.

### Action Items

- [ ] **[CRITICAL]** Fix progress calculation in module detail API to use `calculateModuleProgress()` instead of inline formula [file: src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:185-191]
- [ ] **[CRITICAL]** Remove duplicate progress calculation - use result from `checkAndUpdateModuleCompletion()` call [file: src/app/api/student/courses/[id]/modules/[moduleId]/route.ts:150, 185-191]
- [ ] **[HIGH]** Add unit tests for `calculateModuleProgress()` covering all edge cases [file: __tests__/unit/lib/module-progress.test.ts (NEW)]
- [ ] **[HIGH]** Add unit tests for `checkAndUpdateModuleCompletion()` [file: __tests__/unit/lib/module-progress.test.ts (NEW)]
- [ ] **[HIGH]** Add integration test for assignment submission → progress update workflow [file: __tests__/integration/api/student/module-progress.test.ts (NEW)]
- [ ] **[MEDIUM]** Add integration test for module completion → next module unlock [file: __tests__/integration/api/student/module-unlock.test.ts (NEW)]
- [ ] **[MEDIUM]** Verify Task 1-2 completion - was assignment display actually implemented in Story 3-3 or 3-5? [file: docs/stories/3-3-module-content-view.md]
- [ ] **[LOW]** Consider surfacing progress update errors to user instead of silent logging [file: src/app/api/student/assignments/[id]/submission/route.ts:146-149, 238-240]
- [ ] **[LOW]** Add JSDoc comments to exported functions in module-progress.ts [file: src/lib/module-progress.ts]

### Recommendations

1. **Before Approval**: The **CRITICAL** progress calculation bug must be fixed. This is a core functional requirement (AC5) that is currently broken in the user-facing module detail view.

2. **Testing Strategy**: Add at minimum the unit tests for `calculateModuleProgress()` to prevent regression. The formula is complex with multiple edge cases and must be thoroughly tested.

3. **Code Cleanup**: Remove the duplicate progress calculation and ensure all APIs use the centralized `calculateModuleProgress()` function for consistency.

4. **Documentation**: Update the completion notes to clearly state what was implemented in this story vs. Story 3-3, as the current "done in 3-3" markers are confusing.

### Conclusion

While the core implementation of assignment progress tracking is sound and the `checkAndUpdateModuleCompletion()` function works correctly, the **module detail API has a critical bug** that breaks Acceptance Criteria 3 and 5. The progress percentage shown to students in the module detail view uses the wrong formula.

**Status**: Changes Requested - Fix critical progress calculation bug and add unit tests before approval.

---
