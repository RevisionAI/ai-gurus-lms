# Data Models & Database Schema - AI Gurus LMS

**Generated:** 2025-11-24
**Project:** AI Gurus LMS
**ORM:** Prisma 6.9.0
**Database:** SQLite (development) → PostgreSQL recommended for production
**Schema Location:** `prisma/schema.prisma`

---

## Entity Relationship Overview

```
User (1) ─────< Enrollment >───── (1) Course
 │                                   │
 │ (instructor)                      │
 └────────────────────────────────────┘

User (student) ───< Submission >─── Assignment ──< Course
 │                       │               │
 │                       │               │
 └──────< Grade >────────┘               │
         │                               │
         └─ (gradedBy: User) ─────────────┘

Course ───< Discussion ───< DiscussionPost (self-referential)
   │
   └───< Announcement
   └───< CourseContent
```

---

## Core Models

### User

**Purpose:** Represents all system users (students, instructors, admins)

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `email` | String | Unique, Required | User email (login) |
| `name` | String | Required | First name |
| `surname` | String | Required | Last name |
| `password` | String | Required | Bcrypt hashed password |
| `cellNumber` | String | Required | Phone number |
| `company` | String | Required | Company name |
| `position` | String | Required | Job title/position |
| `workAddress` | String | Required | Work address |
| `role` | UserRole | Enum, Default: STUDENT | User role |
| `createdAt` | DateTime | Auto | Account creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Relations:**
- `enrollments` → Enrollment[] (student enrollments)
- `instructorCourses` → Course[] (courses taught)
- `assignments` → Assignment[] (assignments created)
- `submissions` → Submission[] (assignments submitted)
- `discussions` → Discussion[] (discussions created)
- `discussionPosts` → DiscussionPost[] (posts authored)
- `announcements` → Announcement[] (announcements created)
- `gradesReceived` → Grade[] (grades as student)
- `gradesGiven` → Grade[] (grades as grader)

**Enums:**
```typescript
enum UserRole {
  STUDENT    // Can enroll, submit assignments
  INSTRUCTOR // Can create courses, grade assignments
  ADMIN      // System administration
}
```

**Indexes:**
- Unique: `email`

---

### Course

**Purpose:** Represents a course offering

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `title` | String | Required | Course title |
| `description` | String | Optional | Course description |
| `code` | String | Unique, Required | Course code (e.g., "CS101") |
| `semester` | String | Required | Semester (e.g., "Fall 2024") |
| `year` | Int | Required | Year offered |
| `isActive` | Boolean | Default: true | Active status |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |
| `instructorId` | String | FK → User.id | Course instructor |

**Relations:**
- `instructor` → User (course instructor)
- `enrollments` → Enrollment[] (student enrollments)
- `assignments` → Assignment[] (course assignments)
- `discussions` → Discussion[] (course discussions)
- `announcements` → Announcement[] (course announcements)
- `content` → CourseContent[] (course materials)

**Cascade Behavior:**
- Deleting a course cascades to: enrollments, assignments (→ submissions, grades), discussions (→ posts), announcements, content

**Indexes:**
- Unique: `code`

---

### Enrollment

**Purpose:** Many-to-many relationship between users (students) and courses

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `userId` | String | FK → User.id | Enrolled student |
| `courseId` | String | FK → Course.id | Enrolled course |
| `enrolledAt` | DateTime | Auto | Enrollment timestamp |

**Relations:**
- `user` → User (student)
- `course` → Course

**Constraints:**
- Unique composite: `[userId, courseId]` (prevents duplicate enrollments)
- Cascade delete: Course deletion removes enrollments

---

### Assignment

**Purpose:** Course assignments/assessments

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `title` | String | Required | Assignment title |
| `description` | String | Optional | Assignment description |
| `dueDate` | DateTime | Optional | Due date |
| `maxPoints` | Int | Default: 100 | Maximum points |
| `isPublished` | Boolean | Default: false | Published status |
| `courseId` | String | FK → Course.id | Associated course |
| `createdById` | String | FK → User.id | Creator (instructor) |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Relations:**
- `course` → Course
- `createdBy` → User (instructor)
- `submissions` → Submission[]
- `grades` → Grade[]

**Cascade Behavior:**
- Course deletion cascades to assignments
- Assignment deletion cascades to submissions and grades

---

### Submission

**Purpose:** Student assignment submissions

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `content` | String | Optional | Text submission |
| `fileUrl` | String | Optional | Uploaded file path |
| `assignmentId` | String | FK → Assignment.id | Associated assignment |
| `studentId` | String | FK → User.id | Submitting student |
| `submittedAt` | DateTime | Auto | Submission timestamp |

**Relations:**
- `assignment` → Assignment
- `student` → User

**Constraints:**
- Unique composite: `[assignmentId, studentId]` (one submission per student per assignment)
- Cascade delete: Assignment deletion removes submissions

---

### Grade

**Purpose:** Graded assignment submissions

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `points` | Float | Required | Points awarded |
| `feedback` | String | Optional | Grader feedback |
| `assignmentId` | String | FK → Assignment.id | Associated assignment |
| `studentId` | String | FK → User.id | Graded student |
| `gradedById` | String | FK → User.id | Grading instructor |
| `gradedAt` | DateTime | Auto | Grading timestamp |

**Relations:**
- `assignment` → Assignment
- `student` → User (graded student)
- `gradedBy` → User (grading instructor)

**Constraints:**
- Unique composite: `[assignmentId, studentId]` (one grade per student per assignment)
- Cascade delete: Assignment deletion removes grades

---

### Discussion

**Purpose:** Course discussion forums

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `title` | String | Required | Discussion title |
| `description` | String | Optional | Discussion description |
| `isPinned` | Boolean | Default: false | Pinned to top |
| `isLocked` | Boolean | Default: false | Locked (no new posts) |
| `courseId` | String | FK → Course.id | Associated course |
| `createdBy` | String | FK → User.id | Creator |
| `createdAt` | DateTime | Auto | Creation timestamp |

**Relations:**
- `course` → Course
- `author` → User
- `posts` → DiscussionPost[] (discussion threads)

**Cascade Behavior:**
- Course deletion cascades to discussions
- Discussion deletion cascades to posts

---

### DiscussionPost

**Purpose:** Posts and replies in discussion threads (supports nesting)

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `content` | String | Required | Post content |
| `parentId` | String | Optional, FK → DiscussionPost.id | Parent post (for replies) |
| `discussionId` | String | FK → Discussion.id | Associated discussion |
| `authorId` | String | FK → User.id | Post author |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Relations:**
- `discussion` → Discussion
- `author` → User
- `parent` → DiscussionPost (self-referential, optional)
- `replies` → DiscussionPost[] (child posts)

**Self-Referential Relationship:**
- Enables nested comment threads
- `parentId = null` → Top-level post
- `parentId != null` → Reply to another post

**Cascade Behavior:**
- Discussion deletion cascades to posts
- Parent post deletion cascades to child replies

---

### Announcement

**Purpose:** Course announcements from instructors

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `title` | String | Required | Announcement title |
| `content` | String | Required | Announcement content |
| `courseId` | String | FK → Course.id | Associated course |
| `authorId` | String | FK → User.id | Announcement author |
| `createdAt` | DateTime | Auto | Creation timestamp |

**Relations:**
- `course` → Course
- `author` → User (instructor)

**Cascade Behavior:**
- Course deletion cascades to announcements

---

### CourseContent

**Purpose:** Course learning materials (text, videos, documents, links)

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `title` | String | Required | Content title |
| `type` | ContentType | Enum, Required | Content type |
| `content` | String | Optional | Text content or URL |
| `fileUrl` | String | Optional | Uploaded file path |
| `thumbnailUrl` | String | Optional | Thumbnail image path |
| `orderIndex` | Int | Required | Display order (drag-and-drop) |
| `isPublished` | Boolean | Default: false | Published status |
| `courseId` | String | FK → Course.id | Associated course |
| `createdAt` | DateTime | Auto | Creation timestamp |

**Relations:**
- `course` → Course

**Enums:**
```typescript
enum ContentType {
  TEXT      // Rich text content
  VIDEO     // Video file
  DOCUMENT  // PDF, Word, Excel, etc.
  LINK      // External URL
  SCORM     // SCORM package
  YOUTUBE   // YouTube video (with metadata)
}
```

**Cascade Behavior:**
- Course deletion cascades to content

**Ordering:**
- Content items ordered by `orderIndex` (supports drag-and-drop reordering)

---

## Database Design Patterns

### 1. Cascade Deletes
All child entities cascade delete when parent is removed:
- Course → Enrollments, Assignments, Discussions, Announcements, Content
- Assignment → Submissions, Grades
- Discussion → DiscussionPosts

### 2. Unique Constraints
Prevent duplicate records:
- `User.email` (unique emails)
- `Course.code` (unique course codes)
- `[Assignment.id, Student.id]` (one submission per student per assignment)
- `[Assignment.id, Student.id]` (one grade per student per assignment)
- `[User.id, Course.id]` (one enrollment per student per course)

### 3. Soft vs Hard Deletes
- **Hard deletes:** Currently all deletes are hard (data permanently removed)
- **Recommendation:** Implement soft deletes for Users, Courses, Assignments (add `deletedAt` field)

### 4. Timestamps
All major entities have:
- `createdAt` (automatic on creation)
- `updatedAt` (automatic on update - where applicable)

### 5. Self-Referential Relationships
- **DiscussionPost** supports nested replies via `parentId → DiscussionPost.id`
- Enables threaded conversations

---

## Missing Tables/Features

Based on typical LMS requirements:

1. **Quizzes/Exams** - Not yet implemented
   - Would need: Quiz, Question, QuizAttempt, QuizAnswer tables

2. **Progress Tracking** - No explicit tracking
   - Recommendation: Add CourseProgress, ContentProgress tables

3. **Certificates** - Not implemented
   - Recommendation: Add Certificate, CertificateTemplate tables

4. **Files/Uploads Metadata** - Not tracked
   - Recommendation: Add File table (track size, type, uploaded date)

5. **Notifications** - Not implemented
   - Recommendation: Add Notification, NotificationPreference tables

6. **Audit Logs** - Not implemented
   - Recommendation: Add AuditLog table for tracking changes

7. **Groups/Cohorts** - Not implemented
   - Recommendation: Add Group, GroupMembership tables

---

## Migration Strategy

### Current State
- **Database:** SQLite (dev.db)
- **Size:** ~159KB
- **Environment:** Development only

### Production Migration Path

1. **Database Platform:**
   - Migrate from SQLite → PostgreSQL or MySQL
   - Update `datasource db` in schema.prisma

2. **Data Migration:**
   ```bash
   # 1. Export data from SQLite
   prisma db pull --schema=prisma/schema.prisma

   # 2. Update schema for PostgreSQL
   # Change provider to "postgresql"

   # 3. Run migrations
   prisma migrate deploy

   # 4. Seed data (if needed)
   prisma db seed
   ```

3. **Schema Changes for Production:**
   - Add indexes on frequently queried fields (e.g., `Course.instructorId`, `Assignment.courseId`)
   - Add soft delete fields (`deletedAt`)
   - Add full-text search indexes (for content search)
   - Consider partitioning for large tables (Submission, Grade)

4. **Connection Pooling:**
   - Implement connection pooling (Prisma Accelerate or PgBouncer)
   - Configure appropriate pool size based on traffic

---

## Performance Considerations

### Recommended Indexes (not yet implemented)

```prisma
@@index([instructorId])           // Course: Find by instructor
@@index([courseId])                // Assignment: Find by course
@@index([studentId])               // Submission: Find by student
@@index([courseId, isActive])      // Course: Active courses filter
@@index([courseId, isPublished])   // Assignment: Published assignments
@@index([discussionId, parentId])  // DiscussionPost: Thread hierarchy
```

### Query Optimization Opportunities

1. **N+1 Query Prevention:**
   - Use Prisma `include` for eager loading related data
   - Example: Load course with instructor in single query

2. **Pagination:**
   - Implement cursor-based pagination for large lists
   - Currently missing from all list endpoints

3. **Caching:**
   - Cache frequently accessed data (course lists, user sessions)
   - Consider Redis for session storage

---

## Security Considerations

1. **Password Storage:**
   - ✅ Passwords hashed with bcrypt
   - ✅ Never returned in API responses

2. **Cascade Deletes:**
   - ⚠️ Be careful with course deletions (removes all student work)
   - Recommendation: Implement soft deletes + confirmation workflow

3. **Data Validation:**
   - ✅ Prisma provides type safety
   - ⚠️ Add runtime validation (Zod schemas)
   - ⚠️ Sanitize user input to prevent injection

4. **File Uploads:**
   - ⚠️ No file type validation at schema level
   - ⚠️ No file size limits in database
   - Recommendation: Add File metadata table with validation

---

## Schema Statistics

- **Total Models:** 10
- **Total Relations:** 25
- **Cascade Deletes:** 7
- **Unique Constraints:** 5
- **Enums:** 2
- **Self-Referential:** 1 (DiscussionPost)

---

**Generated by:** BMM Document Project Workflow
**Schema Version:** Current as of 2025-11-24
**ORM:** Prisma 6.9.0
**Next Review:** Before production deployment
