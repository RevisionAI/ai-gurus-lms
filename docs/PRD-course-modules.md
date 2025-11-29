# AI Gurus LMS - Course Modules Feature PRD

**Author:** Ed
**Date:** 2025-11-28
**Project Level:** 3
**Target Scale:** Production Enhancement

---

## Goals and Background Context

### Goals

- **Improve Course Organization**: Enable instructors to logically group content, assignments, and discussions into self-contained modules within each course
- **Enable Progressive Learning**: Allow sequential module unlocking so students must complete Module 1 before accessing Module 2
- **Increase Content Discoverability**: Provide clear navigation structure so students understand course progression and can easily find relevant materials
- **Support Flexible Publishing**: Allow instructors to hide entire modules while preparing content, then publish when ready
- **Maintain Data Integrity**: Migrate all existing course content into modules without data loss

### Background Context

The current AI Gurus LMS organizes course content in a flat structure where all content items, assignments, and discussions sit directly under a course. While this works for simple courses, it creates challenges for longer programs like the AI Fluency curriculum:

**Current Pain Points:**
- Students face a long, undifferentiated list of content items with no logical grouping
- Instructors cannot release content in phases (e.g., "Week 1" materials)
- No way to enforce prerequisite completion before advancing
- Discussions are course-wide rather than topic-specific to module content
- Assignments lack context of which module/topic they assess

**Why Now:**
The AI Fluency Program contains multiple distinct learning phases (e.g., "AI Fundamentals," "Decision Framework," "Implementation Planning"). Without modules, delivering this curriculum professionally is difficult. This enhancement is foundational for scaling course offerings.

---

## Requirements

### Functional Requirements

**Module Management (Instructor)**

| ID | Requirement |
|----|-------------|
| FR001 | Instructors can create, edit, and delete modules within a course |
| FR002 | Modules have title, description, order index, and publish status |
| FR003 | Instructors can reorder modules within a course via drag-and-drop |
| FR004 | Instructors can set module prerequisites (e.g., Module 2 requires Module 1 completion) |
| FR005 | Instructors can bulk-publish or unpublish a module and all its contents |

**Content Organization**

| ID | Requirement |
|----|-------------|
| FR006 | Course content items belong to exactly one module |
| FR007 | Instructors can move content items between modules |
| FR008 | Content items maintain order index within their module |
| FR009 | Drag-and-drop reordering works within module context |

**Assignments**

| ID | Requirement |
|----|-------------|
| FR010 | Assignments belong to exactly one module |
| FR011 | Instructors can create assignments within a specific module |
| FR012 | Instructors can move assignments between modules |
| FR013 | Gradebook displays module context for each assignment |

**Discussions**

| ID | Requirement |
|----|-------------|
| FR014 | Discussions belong to exactly one module |
| FR015 | Instructors can create discussions within a specific module |
| FR016 | Students can only participate in discussions for unlocked modules |

**Student Experience**

| ID | Requirement |
|----|-------------|
| FR017 | Students see course content organized by modules |
| FR018 | Locked modules display as unavailable with prerequisite message |
| FR019 | Module completion is tracked (all content viewed, all assignments submitted) |
| FR020 | Students can see their progress through each module |
| FR021 | Completing a module automatically unlocks the next sequential module |

**Data Migration**

| ID | Requirement |
|----|-------------|
| FR022 | All existing course content migrates to a default "Module 1" per course |
| FR023 | All existing assignments migrate to default "Module 1" |
| FR024 | All existing discussions migrate to default "Module 1" |
| FR025 | Migration preserves all existing order indices and relationships |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR001 | Module operations (create, update, delete) complete in < 500ms |
| NFR002 | Student module unlock checks execute in < 100ms |
| NFR003 | Data migration runs without downtime (backward compatible) |
| NFR004 | Module UI loads progressively (skeleton states for large courses)

---

## User Journeys

### Journey 1: Instructor Creates and Organizes Modules

**Persona:** Sarah (Instructor)
**Goal:** Organize AI Fluency course into logical learning modules

```
1. Sarah navigates to her "AI Fluency Program" course
2. She clicks "Manage Modules" in the course settings
3. She sees existing content in a default "Module 1"
4. She clicks "Add Module" and creates:
   - Module 1: "AI Fundamentals" (Week 1-2)
   - Module 2: "Decision Framework" (Week 3-4)
   - Module 3: "Implementation Planning" (Week 5-6)
5. She drags existing content items into appropriate modules
6. She creates new assignments within each module
7. She sets Module 2 to require Module 1 completion
8. She sets Module 3 to require Module 2 completion
9. She publishes Module 1, keeps Modules 2-3 as drafts
10. She previews the student view to verify organization
```

**Success Criteria:**
- Modules created in < 2 minutes each
- Drag-drop content reorganization works smoothly
- Prerequisites save correctly
- Student preview accurately reflects locked/unlocked states

---

### Journey 2: Student Progresses Through Modules

**Persona:** Marcus (SME Executive Student)
**Goal:** Complete AI Fluency Program systematically

```
1. Marcus enrolls in "AI Fluency Program"
2. He sees course overview with 3 modules listed
3. Module 1 shows "Available" with progress bar (0%)
4. Modules 2-3 show "Locked - Complete previous module"
5. He clicks into Module 1 and sees:
   - Content items (videos, documents, text)
   - Assignments due
   - Discussion forum for Module 1
6. He completes all content items (progress updates to 60%)
7. He submits the Module 1 assignment (progress updates to 80%)
8. Instructor grades assignment
9. Module 1 shows "Complete" (100%)
10. Module 2 automatically unlocks with notification
11. Marcus proceeds to Module 2
```

**Success Criteria:**
- Clear visual distinction between locked/unlocked modules
- Progress percentage updates in real-time
- Unlock happens immediately upon completion
- Student receives notification when new module unlocks

---

### Journey 3: Instructor Reviews Module-Based Gradebook

**Persona:** Sarah (Instructor)
**Goal:** Grade assignments with module context

```
1. Sarah opens the Gradebook for "AI Fluency Program"
2. She sees assignments grouped by module:
   - Module 1: "AI Concepts Quiz" | "Reflection Assignment"
   - Module 2: "Decision Framework Exercise" | "Case Study"
   - Module 3: "Implementation Plan" | "Final Project"
3. She filters to show only Module 1 assignments
4. She grades pending submissions
5. She views student progress across modules:
   - Student A: Module 1 complete, Module 2 in progress
   - Student B: Module 1 complete, Module 2 complete, Module 3 in progress
6. She exports gradebook with module columns
```

**Success Criteria:**
- Assignments clearly tagged with module name
- Filter by module works correctly
- Progress view shows module-level completion
- Export includes module information

---

## UX Design Principles

1. **Progressive Disclosure**
   - Show module overview first, expand details on interaction
   - Don't overwhelm students with all content at once
   - Locked modules visible but clearly inaccessible

2. **Clear Progress Indicators**
   - Visual progress bars at module level and course level
   - Completion checkmarks for finished items
   - "Next up" indicators to guide students

3. **Consistent Navigation Hierarchy**
   - Course → Module → Content/Assignment/Discussion
   - Breadcrumbs always visible for context
   - Easy navigation back to module overview

4. **Instructor Efficiency**
   - Bulk actions for publishing/unpublishing modules
   - Drag-and-drop for all organizational tasks
   - Preview mode to see student perspective

---

## User Interface Design Goals

**Student Course View:**
```
┌─────────────────────────────────────────────────┐
│ AI Fluency Program                              │
│ Progress: ████████░░░░░░░░ 45%                 │
├─────────────────────────────────────────────────┤
│ ✓ Module 1: AI Fundamentals        [Complete]  │
│   └─ 5 items · 1 assignment · 1 discussion     │
│                                                 │
│ ▶ Module 2: Decision Framework    [In Progress]│
│   └─ 4 items · 2 assignments · 1 discussion    │
│   └─ Progress: ██████░░░░ 60%                  │
│                                                 │
│ 🔒 Module 3: Implementation       [Locked]     │
│   └─ Complete Module 2 to unlock               │
└─────────────────────────────────────────────────┘
```

**Instructor Module Manager:**
```
┌─────────────────────────────────────────────────┐
│ Manage Modules                    [+ Add Module]│
├─────────────────────────────────────────────────┤
│ ≡ Module 1: AI Fundamentals         [Published]│
│   ├─ 📄 Introduction to AI (Text)              │
│   ├─ 🎬 What is Machine Learning (Video)       │
│   ├─ 📝 AI Concepts Quiz (Assignment)          │
│   └─ 💬 Module 1 Discussion                    │
│   [Edit] [Preview] [⋮ More]                    │
├─────────────────────────────────────────────────┤
│ ≡ Module 2: Decision Framework         [Draft] │
│   ├─ 📄 Build vs Buy Framework (Text)          │
│   └─ [+ Add Content] [+ Add Assignment]        │
│   [Edit] [Publish] [⋮ More]                    │
└─────────────────────────────────────────────────┘
```

**Design Constraints:**
- Must integrate with existing Tailwind CSS design system
- Reuse existing Radix UI components where possible
- Mobile-responsive (modules collapse to accordion on small screens)
- Leverage existing @dnd-kit for drag-and-drop

---

## Epic List

### Epic Overview

| Epic | Title | Goal | Est. Stories |
|------|-------|------|--------------|
| 1 | Database Schema & Data Migration | Establish Module model and migrate existing data | 4-5 |
| 2 | Instructor Module Management | Enable instructors to create, organize, and publish modules | 6-8 |
| 3 | Student Module Experience | Deliver progressive learning with unlock prerequisites | 5-7 |
| 4 | Feature Integration | Update gradebook, discussions, and assignments for module context | 4-6 |

**Total Estimated Stories:** 19-26

---

### Epic Details

**Epic 1: Database Schema & Data Migration**
- Foundation epic establishing the Module model in Prisma
- Migrates existing CourseContent, Assignment, and Discussion to modules
- Creates default "Module 1" for each existing course
- **Must complete first** - all other epics depend on this

**Epic 2: Instructor Module Management**
- CRUD operations for modules within courses
- Drag-and-drop reordering of modules
- Moving content/assignments between modules
- Module publish/unpublish with cascade to children
- Prerequisites configuration (sequential unlocking)

**Epic 3: Student Module Experience**
- Module-organized course view
- Progress tracking per module
- Locked/unlocked module states
- Automatic unlock on prerequisite completion
- Module-level navigation and breadcrumbs

**Epic 4: Feature Integration**
- Gradebook updates to show module context
- Discussion threads scoped to modules
- Assignment creation within module context
- Module filtering in existing list views
- API updates for module-aware queries

> **Note:** Detailed epic breakdown with full story specifications is available in [epics-course-modules.md](./epics-course-modules.md)

---

## Out of Scope

### Deferred to Future Phases

| Feature | Reason |
|---------|--------|
| Module templates/cloning | Nice-to-have; instructors can manually recreate modules |
| Conditional module unlocking (based on quiz scores) | MVP uses simple sequential unlock; score-based logic adds complexity |
| Module-level analytics dashboard | Basic progress tracking sufficient for MVP |
| Module completion certificates | Can be done manually; automated generation is post-MVP |
| Time-based module release (drip content) | Sequential prerequisites cover primary use case |
| Sub-modules (nested hierarchy) | Single-level modules sufficient; nesting adds UI complexity |

### Not Planned

| Feature | Reason |
|---------|--------|
| Cross-course module sharing | Modules are course-specific; no multi-course reuse needed |
| Student-created modules | Instructor-only feature; students consume, not create |
| Module-level pricing/paywalls | Not a monetization feature; pricing is at course level |
| SCORM module packaging | Current SCORM support at content level is sufficient |
| External LTI module integration | Not needed for AI Fluency curriculum |

### Boundaries

- Announcements remain at **course level** (not moved to modules) - they apply to all students regardless of module progress
- Enrollments remain at **course level** - students enroll in courses, not individual modules
- GPA calculation remains at **course level** - not recalculated per module
