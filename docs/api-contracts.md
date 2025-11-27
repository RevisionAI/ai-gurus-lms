# API Contracts - AI Gurus LMS

**Generated:** 2025-11-24
**Project:** AI Gurus LMS
**API Style:** REST-ful (Next.js App Router API Routes)
**Base URL:** `/api`

---

## Authentication & Session Management

### NextAuth Endpoints
- **POST** `/api/auth/[...nextauth]` - NextAuth.js authentication handler
  - Providers: Credentials (email/password)
  - Session: JWT-based
  - Returns: Session tokens

### User Registration
- **POST** `/api/auth/register`
  - **Body:** `{ email, name, surname, password, cellNumber, company, position, workAddress, role }`
  - **Returns:** `{ success: boolean, message: string }`
  - **Auth:** None (public endpoint)

---

## Student Endpoints

### Course Access
- **GET** `/api/student/courses` - List enrolled courses
  - **Auth:** Student session required
  - **Returns:** `Course[]` with enrollment data

- **GET** `/api/student/courses/[id]` - Get specific course details
  - **Auth:** Student must be enrolled
  - **Returns:** `Course` with content, assignments, discussions

- **GET** `/api/student/courses/[id]/content` - Get published course content
  - **Auth:** Student enrollment required
  - **Returns:** `CourseContent[]` sorted by orderIndex

- **GET** `/api/student/available-courses` - Browse available courses
  - **Auth:** Student session
  - **Returns:** `Course[]` (active courses not enrolled in)

- **POST** `/api/student/enroll` - Enroll in a course
  - **Body:** `{ courseId: string }`
  - **Auth:** Student session
  - **Returns:** `{ success: boolean, enrollment: Enrollment }`

### Assignments
- **GET** `/api/student/assignments/upcoming` - Get upcoming assignments
  - **Auth:** Student session
  - **Returns:** `Assignment[]` with due dates

- **GET** `/api/student/assignments/[id]` - Get assignment details
  - **Auth:** Student enrollment in course
  - **Returns:** `Assignment` with submission status

- **POST** `/api/student/assignments/[id]/submission` - Submit assignment
  - **Body:** `{ content: string, fileUrl?: string }`
  - **Auth:** Student session
  - **Returns:** `Submission`

- **POST** `/api/student/assignments/[id]/upload` - Upload assignment file
  - **Body:** FormData with file
  - **Auth:** Student session
  - **Returns:** `{ fileUrl: string }`
  - **Max Size:** 200MB

- **GET** `/api/student/assignments/[id]/grade` - Get assignment grade
  - **Auth:** Student session
  - **Returns:** `Grade | null`

### Discussions
- **GET** `/api/student/courses/[id]/discussions` - List course discussions
  - **Auth:** Student enrollment
  - **Returns:** `Discussion[]`

- **GET** `/api/student/courses/[id]/discussions/[discussionId]` - Get discussion thread
  - **Auth:** Student enrollment
  - **Returns:** `Discussion` with posts

- **POST** `/api/student/courses/[id]/discussions/[discussionId]/posts` - Create post/reply
  - **Body:** `{ content: string, parentId?: string }`
  - **Auth:** Student session
  - **Returns:** `DiscussionPost`

- **PUT** `/api/student/courses/[id]/discussions/[discussionId]/posts/[postId]` - Update post
  - **Body:** `{ content: string }`
  - **Auth:** Post author only
  - **Returns:** `DiscussionPost`

### Announcements
- **GET** `/api/student/announcements/recent` - Get recent announcements
  - **Auth:** Student session
  - **Returns:** `Announcement[]` from enrolled courses

- **GET** `/api/student/courses/[id]/announcements` - Get course announcements
  - **Auth:** Student enrollment
  - **Returns:** `Announcement[]`

---

## Instructor Endpoints

### Course Management
- **GET** `/api/instructor/courses` - List instructor's courses
  - **Auth:** Instructor session
  - **Returns:** `Course[]` with stats

- **POST** `/api/instructor/courses` - Create new course
  - **Body:** `{ title, description, code, semester, year }`
  - **Auth:** Instructor session
  - **Returns:** `Course`

- **GET** `/api/instructor/courses/[id]` - Get course details
  - **Auth:** Instructor must own course
  - **Returns:** `Course` with full data

- **PUT** `/api/instructor/courses/[id]` - Update course
  - **Body:** Partial `Course` data
  - **Auth:** Course instructor
  - **Returns:** `Course`

- **DELETE** `/api/instructor/courses/[id]` - Archive course (cascade soft delete)
  - **Auth:** Course instructor
  - **Returns:** `{ message: "Course archived successfully" }`
  - **Note:** Course and all related content (assignments, discussions, content, announcements) are soft-deleted and can be restored by admin

### Content Management
- **GET** `/api/instructor/courses/[id]/content` - List course content
  - **Auth:** Course instructor
  - **Returns:** `CourseContent[]` sorted by orderIndex

- **POST** `/api/instructor/courses/[id]/content` - Create content item
  - **Body:** `{ title, type, content?, fileUrl?, orderIndex, isPublished }`
  - **Auth:** Course instructor
  - **Returns:** `CourseContent`
  - **Types:** TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE

- **PUT** `/api/instructor/courses/[id]/content/[contentId]` - Update content
  - **Body:** Partial `CourseContent`
  - **Auth:** Course instructor
  - **Returns:** `CourseContent`

- **DELETE** `/api/instructor/courses/[id]/content/[contentId]` - Archive content (soft delete)
  - **Auth:** Course instructor
  - **Returns:** `{ message: "Content archived successfully" }`
  - **Note:** Content is soft-deleted (marked with deletedAt timestamp) and can be restored by admin

- **PUT** `/api/instructor/courses/[id]/content/reorder` - Reorder content items
  - **Body:** `{ items: { id: string, orderIndex: number }[] }`
  - **Auth:** Course instructor
  - **Returns:** `{ success: boolean }`

- **POST** `/api/instructor/courses/[id]/upload` - Upload course file
  - **Body:** FormData with file
  - **Auth:** Course instructor
  - **Returns:** `{ fileUrl: string }`
  - **Max Size:** 200MB

- **POST** `/api/instructor/courses/[id]/upload-thumbnail` - Upload thumbnail
  - **Body:** FormData with image
  - **Auth:** Course instructor
  - **Returns:** `{ thumbnailUrl: string }`

- **POST** `/api/instructor/courses/[id]/youtube-info` - Fetch YouTube metadata
  - **Body:** `{ url: string }`
  - **Auth:** Course instructor
  - **Returns:** `{ title: string, thumbnailUrl: string }`

### Assignment Management
- **GET** `/api/instructor/assignments/recent` - Get recent assignments
  - **Auth:** Instructor session
  - **Returns:** `Assignment[]` across all courses

- **GET** `/api/instructor/assignments/[id]` - Get assignment details
  - **Auth:** Assignment creator
  - **Returns:** `Assignment` with submissions

- **PUT** `/api/instructor/assignments/[id]` - Update assignment
  - **Body:** Partial `Assignment`
  - **Auth:** Assignment creator
  - **Returns:** `Assignment`

- **DELETE** `/api/instructor/assignments/[id]` - Archive assignment (soft delete)
  - **Auth:** Assignment creator
  - **Returns:** `{ message: "Assignment archived successfully" }`
  - **Note:** Assignment is soft-deleted and can be restored by admin

- **POST** `/api/instructor/courses/[id]/assignments` - Create assignment
  - **Body:** `{ title, description, dueDate, maxPoints, isPublished }`
  - **Auth:** Course instructor
  - **Returns:** `Assignment`

- **GET** `/api/instructor/assignments/[id]/submissions` - List submissions
  - **Auth:** Assignment creator
  - **Returns:** `Submission[]` with student data

- **POST** `/api/instructor/assignments/[id]/submissions/[submissionId]/grade` - Grade submission
  - **Body:** `{ points: number, feedback: string }`
  - **Auth:** Assignment creator
  - **Returns:** `Grade`

### Enrollment Management
- **GET** `/api/instructor/courses/[id]/enrollments` - List course enrollments
  - **Auth:** Course instructor
  - **Returns:** `Enrollment[]` with student data

- **POST** `/api/instructor/courses/[id]/enrollments` - Enroll student
  - **Body:** `{ studentId: string }`
  - **Auth:** Course instructor
  - **Returns:** `Enrollment`

### Discussion Management
- **GET** `/api/instructor/courses/[id]/discussions` - List course discussions
  - **Auth:** Course instructor
  - **Returns:** `Discussion[]`

- **GET** `/api/instructor/courses/[id]/discussions/[discussionId]` - Get discussion
  - **Auth:** Course instructor
  - **Returns:** `Discussion` with posts

- **POST** `/api/instructor/courses/[id]/discussions` - Create discussion
  - **Body:** `{ title, description, isPinned }`
  - **Auth:** Course instructor
  - **Returns:** `Discussion`

- **PUT** `/api/instructor/courses/[id]/discussions/[discussionId]` - Update discussion
  - **Body:** Partial `Discussion`
  - **Auth:** Course instructor
  - **Returns:** `Discussion`

- **DELETE** `/api/instructor/courses/[id]/discussions/[discussionId]` - Archive discussion (soft delete)
  - **Auth:** Course instructor
  - **Returns:** `{ message: "Discussion archived successfully" }`
  - **Note:** Discussion is soft-deleted and can be restored by admin

### Announcement Management
- **GET** `/api/instructor/courses/[id]/announcements` - List announcements
  - **Auth:** Course instructor
  - **Returns:** `Announcement[]`

- **POST** `/api/instructor/courses/[id]/announcements` - Create announcement
  - **Body:** `{ title, content }`
  - **Auth:** Course instructor
  - **Returns:** `Announcement`

- **PUT** `/api/instructor/courses/[id]/announcements/[announcementId]` - Update announcement
  - **Body:** Partial `Announcement`
  - **Auth:** Course instructor
  - **Returns:** `Announcement`

- **DELETE** `/api/instructor/courses/[id]/announcements/[announcementId]` - Archive announcement (soft delete)
  - **Auth:** Announcement author
  - **Returns:** `{ message: "Announcement archived successfully" }`
  - **Note:** Announcement is soft-deleted and can be restored by admin

---

## Admin Endpoints

### Dashboard Stats
- **GET** `/api/admin/dashboard/stats` - Get system statistics
  - **Auth:** Admin session
  - **Returns:** `{ totalUsers, totalCourses, activeStudents, etc. }`

### Soft Delete Management (Audit Trail)
- **GET** `/api/admin/deleted-records` - Get all soft-deleted records
  - **Auth:** Admin session required
  - **Query:** `?model=user|course|assignment|grade|discussion|courseContent|announcement` (optional, returns all if not specified)
  - **Returns:** `{ data: { users, courses, assignments, grades, discussions, courseContent, announcements } }`
  - **Note:** Returns soft-deleted records from all models for audit trail review

- **POST** `/api/admin/deleted-records/[id]/restore` - Restore a soft-deleted record
  - **Auth:** Admin session required
  - **Body:** `{ model: "user" | "course" | "assignment" | "grade" | "discussion" | "courseContent" | "announcement", cascadeRestore?: boolean }`
  - **Returns:** `{ message: string, data: RestoredRecord }`
  - **Note:** For courses, `cascadeRestore` defaults to `true` and restores all related content

---

## User Management

### User Search
- **GET** `/api/users/search` - Search users
  - **Query:** `?q=searchTerm`
  - **Auth:** Instructor/Admin
  - **Returns:** `User[]` (filtered)

- **GET** `/api/users/students` - List all students
  - **Auth:** Instructor/Admin
  - **Returns:** `User[]` with role=STUDENT

---

## Common Response Formats

### Success Response
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

### Error Response
```typescript
{
  success: false,
  error: string,
  details?: string
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Flow

1. **User Login:**
   - POST to `/api/auth/callback/credentials` (via NextAuth)
   - Returns JWT session token

2. **Session Validation:**
   - All protected routes validate JWT token
   - Token includes: `{ id, email, name, role }`

3. **Role-Based Access:**
   - Student: Can access own enrollments, submit assignments
   - Instructor: Can manage own courses, grade assignments
   - Admin: Full system access

---

## File Upload Constraints

- **Max File Size:** 200MB (configured in API routes)
- **Allowed Types:** All types (validation on client)
- **Storage:** Local filesystem (temporary - production should use S3/CDN)
- **Upload Endpoints:**
  - `/api/instructor/courses/[id]/upload`
  - `/api/instructor/courses/[id]/upload-thumbnail`
  - `/api/student/assignments/[id]/upload`

---

## Data Validation

- All endpoints validate required fields
- Type validation via TypeScript
- Business logic validation (e.g., enrollment checks, ownership verification)
- NextAuth handles authentication validation

---

## Known Limitations

1. **File Storage:** Currently uses local filesystem (not production-ready)
2. **Pagination:** Not implemented on list endpoints
3. **Rate Limiting:** Not implemented
4. **API Versioning:** Not implemented
5. **Bulk Operations:** No bulk endpoints for grading or enrollment
6. **Soft Delete Automatic Filtering:** Queries must explicitly include `deletedAt: null` filter; no middleware auto-filtering

---

## Production Recommendations

1. **Migrate to PostgreSQL** from SQLite
2. **Implement S3/CDN** for file storage
3. **Add pagination** to all list endpoints
4. **Implement rate limiting** (per user/IP)
5. **Add API versioning** (/api/v1/...)
6. **Add request validation middleware** (Zod schemas)
7. **Implement bulk operations** for common admin tasks
8. **Add comprehensive error logging** (Sentry, etc.)
9. **Add API documentation** (Swagger/OpenAPI)

---

**Total Endpoints:** 50+ (includes soft delete and admin audit endpoints)
**Authentication:** NextAuth.js with JWT
**Database:** Prisma ORM (PostgreSQL)
**Framework:** Next.js 15 App Router
**Soft Delete:** Implemented for User, Course, Assignment, Grade, Discussion, CourseContent, Announcement
