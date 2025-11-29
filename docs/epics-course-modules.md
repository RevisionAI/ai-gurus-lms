# AI Gurus LMS - Course Modules Epic Breakdown

**Author:** Ed
**Date:** 2025-11-28
**Project Level:** 3
**Target Scale:** Production Enhancement

---

## Overview

This document provides the detailed epic breakdown for the Course Modules feature, expanding on the high-level epic list in the [PRD](./PRD-course-modules.md).

Each epic includes:
- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**
- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic 1: Database Schema & Data Migration

**Goal:** Establish the Module data model and migrate all existing course content, assignments, and discussions into modules without data loss.

**Value:** Creates the foundation that all other epics depend on. After this epic, the system has modules but the UI remains unchanged (backward compatible).

---

**Story 1.1: Create Module Database Model**

As a developer,
I want to add a Module model to the Prisma schema,
So that courses can contain organized groups of content.

**Acceptance Criteria:**
1. Module model created with fields: id, title, description, orderIndex, isPublished, courseId, createdAt, updatedAt, deletedAt
2. Module has many-to-one relationship with Course (cascade delete)
3. Module has one-to-many relationships with CourseContent, Assignment, Discussion
4. Prisma migration runs successfully without errors
5. Database indexes created for courseId and deletedAt

**Prerequisites:** None (first story)

---

**Story 1.2: Add Module Foreign Keys to Existing Models**

As a developer,
I want to add moduleId foreign keys to CourseContent, Assignment, and Discussion models,
So that these entities can belong to modules.

**Acceptance Criteria:**
1. CourseContent model has optional moduleId field (nullable for migration)
2. Assignment model has optional moduleId field (nullable for migration)
3. Discussion model has optional moduleId field (nullable for migration)
4. Foreign key constraints reference Module.id with SET NULL on delete
5. Prisma migration runs successfully
6. Existing data remains intact (no data loss)

**Prerequisites:** Story 1.1

---

**Story 1.3: Create Data Migration Script**

As a developer,
I want to create a migration script that creates default modules for existing courses,
So that all existing content is organized into modules.

**Acceptance Criteria:**
1. Script creates one "Module 1" for each existing course
2. All existing CourseContent items assigned to their course's Module 1
3. All existing Assignments assigned to their course's Module 1
4. All existing Discussions assigned to their course's Module 1
5. Order indices preserved within modules
6. Script is idempotent (safe to run multiple times)
7. Script logs progress and any errors
8. Rollback procedure documented

**Prerequisites:** Story 1.2

---

**Story 1.4: Add Module Progress Tracking Model**

As a developer,
I want to create a ModuleProgress model to track student completion,
So that we can determine when modules are unlocked.

**Acceptance Criteria:**
1. ModuleProgress model created with: id, moduleId, userId, completedAt, contentProgress (JSON), assignmentProgress (JSON)
2. Unique constraint on (moduleId, userId)
3. Relations established to Module and User
4. Prisma migration runs successfully

**Prerequisites:** Story 1.1

---

**Story 1.5: Create Module API Endpoints (Backend Only)**

As a developer,
I want to create basic CRUD API endpoints for modules,
So that the frontend can manage modules.

**Acceptance Criteria:**
1. GET /api/instructor/courses/[id]/modules - List all modules for a course
2. POST /api/instructor/courses/[id]/modules - Create new module
3. GET /api/instructor/courses/[id]/modules/[moduleId] - Get module details
4. PUT /api/instructor/courses/[id]/modules/[moduleId] - Update module
5. DELETE /api/instructor/courses/[id]/modules/[moduleId] - Soft delete module
6. All endpoints require instructor role for the course
7. Input validation with Zod schemas
8. Proper error handling and status codes

**Prerequisites:** Story 1.3

---

## Epic 2: Instructor Module Management

**Goal:** Enable instructors to create, edit, organize, and publish modules within their courses through an intuitive UI.

**Value:** Instructors can structure their courses into logical learning units, improving course organization and student experience.

---

**Story 2.1: Module List View for Instructors**

As an instructor,
I want to see a list of modules in my course,
So that I can manage the course structure.

**Acceptance Criteria:**
1. New "Modules" tab in instructor course view
2. Displays all modules ordered by orderIndex
3. Shows module title, description preview, publish status
4. Shows count of content items, assignments, discussions per module
5. "Add Module" button visible
6. Empty state shown when no modules exist

**Prerequisites:** Epic 1 complete

---

**Story 2.2: Create and Edit Module Form**

As an instructor,
I want to create and edit modules,
So that I can organize my course content.

**Acceptance Criteria:**
1. Modal form for creating new module
2. Fields: title (required), description (optional)
3. Form validation with error messages
4. Success toast on save
5. New modules default to unpublished
6. Edit mode pre-fills existing values
7. Cancel button closes without saving

**Prerequisites:** Story 2.1

---

**Story 2.3: Drag-and-Drop Module Reordering**

As an instructor,
I want to reorder modules by dragging them,
So that I can control the learning sequence.

**Acceptance Criteria:**
1. Drag handle visible on each module card
2. Drag-and-drop using @dnd-kit library
3. Visual feedback during drag (ghost element)
4. Order persisted to database on drop
5. "Save Order" button appears after reorder
6. Optimistic UI update with rollback on error

**Prerequisites:** Story 2.1

---

**Story 2.4: Module Content Management**

As an instructor,
I want to view and manage content within a module,
So that I can organize learning materials.

**Acceptance Criteria:**
1. Expandable module card shows content items
2. Content items show title, type icon, publish status
3. Drag-and-drop reordering within module
4. "Add Content" button within module context
5. Content creation form pre-selects current module
6. Existing content management UI works within module

**Prerequisites:** Story 2.2

---

**Story 2.5: Move Content Between Modules**

As an instructor,
I want to move content items between modules,
So that I can reorganize my course structure.

**Acceptance Criteria:**
1. "Move to Module" option in content item menu
2. Modal shows list of available modules
3. Moving updates moduleId and adjusts orderIndex
4. Success toast confirms move
5. Source and destination modules refresh

**Prerequisites:** Story 2.4

---

**Story 2.6: Module Publish/Unpublish**

As an instructor,
I want to publish or unpublish entire modules,
So that I can control what students see.

**Acceptance Criteria:**
1. Publish/Unpublish toggle on module card
2. Unpublished modules show "Draft" badge
3. Publishing module makes it visible to students
4. Option to cascade publish to all content within module
5. Confirmation dialog for unpublishing (warns about student access)
6. API updates isPublished field

**Prerequisites:** Story 2.2

---

**Story 2.7: Module Prerequisites Configuration**

As an instructor,
I want to set prerequisites for modules,
So that students must complete earlier modules first.

**Acceptance Criteria:**
1. "Prerequisites" section in module edit form
2. Checkbox: "Require previous module completion"
3. When enabled, module locked until prior module complete
4. First module has no prerequisites (always unlocked)
5. Prerequisites saved to database
6. Visual indicator shows prerequisite chain

**Prerequisites:** Story 2.2

---

**Story 2.8: Delete Module**

As an instructor,
I want to delete a module,
So that I can remove unwanted course structure.

**Acceptance Criteria:**
1. Delete option in module menu
2. Confirmation dialog warns about contained content
3. Option to move content to another module before delete
4. Option to delete module and all content
5. Soft delete (sets deletedAt)
6. Success toast confirms deletion

**Prerequisites:** Story 2.5

---

## Epic 3: Student Module Experience

**Goal:** Deliver a progressive learning experience where students navigate through modules, track progress, and unlock subsequent modules upon completion.

**Value:** Students have clear structure and progression through the course, improving engagement and completion rates.

---

**Story 3.1: Student Module Overview**

As a student,
I want to see my enrolled course organized by modules,
So that I understand the course structure.

**Acceptance Criteria:**
1. Course detail page shows module list
2. Each module card shows: title, description, item count
3. Overall course progress bar at top
4. Modules displayed in order (orderIndex)
5. Only published modules visible to students

**Prerequisites:** Epic 1 complete, Story 2.6

---

**Story 3.2: Module Lock/Unlock States**

As a student,
I want to see which modules are locked and why,
So that I know what I need to complete first.

**Acceptance Criteria:**
1. Unlocked modules show "Available" status
2. Locked modules show lock icon and "Complete [Module X] to unlock"
3. Completed modules show checkmark and "Complete" status
4. In-progress modules show progress percentage
5. Clicking locked module shows info modal (not error)

**Prerequisites:** Story 3.1

---

**Story 3.3: Module Content View**

As a student,
I want to view content within a module,
So that I can learn the material.

**Acceptance Criteria:**
1. Clicking module expands/navigates to module detail
2. Content items listed in order within module
3. Each content item shows: title, type, completion status
4. Clicking content item opens content viewer
5. Navigation breadcrumb: Course > Module > Content
6. "Back to Module" button from content view

**Prerequisites:** Story 3.1

---

**Story 3.4: Content Completion Tracking**

As a student,
I want my content progress to be tracked,
So that I know what I've completed.

**Acceptance Criteria:**
1. Viewing content marks it as "viewed" in ModuleProgress
2. Checkmark appears on viewed content items
3. Module progress percentage updates (content weight: 50%)
4. Progress persists across sessions
5. API endpoint to mark content complete

**Prerequisites:** Story 3.3, Story 1.4

---

**Story 3.5: Assignment Progress in Modules**

As a student,
I want my assignment submissions to count toward module progress,
So that completing assignments unlocks next modules.

**Acceptance Criteria:**
1. Assignments visible within module context
2. Submitted assignments marked as complete in progress
3. Module progress includes assignment weight (50%)
4. Module shows "Complete" when all content viewed AND all assignments submitted
5. Progress calculation: (viewedContent/totalContent * 0.5) + (submittedAssignments/totalAssignments * 0.5)

**Prerequisites:** Story 3.4

---

**Story 3.6: Automatic Module Unlock**

As a student,
I want the next module to unlock when I complete the current one,
So that I can continue learning.

**Acceptance Criteria:**
1. When module reaches 100% completion, next module unlocks
2. Unlock happens immediately (no page refresh needed)
3. Visual feedback: module card animates to "Available"
4. Toast notification: "Module 2 is now available!"
5. Unlock logic runs on assignment submission and content completion

**Prerequisites:** Story 3.5

---

**Story 3.7: Module Progress API**

As a developer,
I want API endpoints for student module progress,
So that the frontend can display and update progress.

**Acceptance Criteria:**
1. GET /api/student/courses/[id]/modules - List modules with progress
2. GET /api/student/courses/[id]/modules/[moduleId]/progress - Get detailed progress
3. POST /api/student/courses/[id]/modules/[moduleId]/content/[contentId]/complete - Mark content complete
4. Progress calculation done server-side
5. Unlock status computed based on prerequisites

**Prerequisites:** Story 1.4

---

## Epic 4: Feature Integration

**Goal:** Update existing features (gradebook, discussions, assignments) to work seamlessly with modules, showing module context and respecting module boundaries.

**Value:** Existing functionality enhanced with module awareness, providing consistent experience across the platform.

---

**Story 4.1: Module Context in Gradebook**

As an instructor,
I want the gradebook to show which module each assignment belongs to,
So that I can understand grades in context.

**Acceptance Criteria:**
1. Gradebook grid shows module name for each assignment column
2. Assignments grouped by module in column headers
3. Filter dropdown to show only assignments from specific module
4. Module column in CSV export
5. Sort by module option

**Prerequisites:** Epic 1 complete

---

**Story 4.2: Module-Scoped Discussions**

As a student,
I want to see discussions relevant to the module I'm in,
So that conversations are focused on current topics.

**Acceptance Criteria:**
1. Discussion list filtered by current module
2. Discussion creation form pre-selects current module
3. Discussion cards show module badge
4. Students can only post in discussions for unlocked modules
5. Instructor can view all discussions across modules

**Prerequisites:** Story 3.2

---

**Story 4.3: Assignment Creation in Module Context**

As an instructor,
I want to create assignments within a specific module,
So that they're organized with related content.

**Acceptance Criteria:**
1. Assignment creation form includes module selector
2. Default module is currently viewed module
3. Assignment list shows module column
4. Moving assignment between modules updates moduleId
5. Deleting module prompts to reassign assignments

**Prerequisites:** Story 2.4

---

**Story 4.4: Update Content Creation for Modules**

As an instructor,
I want content creation to work within module context,
So that new content is properly organized.

**Acceptance Criteria:**
1. "Add Content" from module pre-selects that module
2. Content form shows module selector dropdown
3. New content gets next orderIndex within module
4. Existing content edit form shows current module
5. Content can be moved between modules

**Prerequisites:** Story 2.4

---

**Story 4.5: Module-Aware Navigation**

As a user,
I want breadcrumbs and navigation to reflect module hierarchy,
So that I always know where I am.

**Acceptance Criteria:**
1. Breadcrumb format: Course > Module > Content/Assignment/Discussion
2. Clicking module in breadcrumb returns to module view
3. Sidebar navigation shows modules as expandable sections
4. Current module highlighted in navigation
5. Mobile navigation collapses modules appropriately

**Prerequisites:** Story 3.3

---

**Story 4.6: API Updates for Module Filtering**

As a developer,
I want APIs to support module filtering,
So that the frontend can request module-specific data.

**Acceptance Criteria:**
1. GET /api/student/courses/[id]/content accepts moduleId query param
2. GET /api/instructor/courses/[id]/assignments accepts moduleId filter
3. GET /api/student/courses/[id]/discussions accepts moduleId filter
4. Responses include moduleId in each item
5. Performance: filtered queries use database indexes

**Prerequisites:** Epic 1 complete

---

## Story Guidelines Reference

**Story Format:**
```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**
- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

## Summary

| Epic | Stories | Dependencies |
|------|---------|--------------|
| Epic 1: Database Schema & Data Migration | 5 | None |
| Epic 2: Instructor Module Management | 8 | Epic 1 |
| Epic 3: Student Module Experience | 7 | Epic 1, Story 2.6 |
| Epic 4: Feature Integration | 6 | Epic 1 |

**Total Stories:** 26

**Critical Path:** Epic 1 → Epic 2 → Epic 3 → Epic 4

**Parallel Opportunities:**
- Epic 3 and Epic 4 can begin once Epic 1 is complete
- Within Epic 2, stories 2.1-2.4 are sequential; 2.5-2.8 can partially parallelize

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.
