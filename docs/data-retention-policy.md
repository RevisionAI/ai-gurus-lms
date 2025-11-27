# Data Retention Policy

## Overview

This document outlines the data retention practices for the AI Gurus LMS platform, specifically focusing on soft-deleted records and their lifecycle management for regulatory compliance.

## Soft Delete Implementation

### Purpose

Soft deletes are implemented to:
- Maintain audit trails for regulatory compliance
- Enable data recovery in case of accidental deletion
- Support compliance investigations and reporting
- Preserve referential integrity across database relations

### Models with Soft Delete Support

The following database models implement soft delete functionality:

| Model | Description | Cascade Behavior |
|-------|-------------|------------------|
| User | User accounts (students, instructors, admins) | No cascade (independent) |
| Course | Course records | Cascades to: Assignments, Discussions, CourseContent, Announcements |
| Assignment | Course assignments | No cascade (independent) |
| Grade | Student grades | No cascade (independent) |
| Discussion | Course discussions | No cascade (independent) |
| CourseContent | Course materials (videos, documents, links) | No cascade (independent) |
| Announcement | Course announcements | No cascade (independent) |

### Soft Delete Behavior

When a record is soft-deleted:
1. The `deletedAt` timestamp is set to the current date/time
2. The record remains in the database
3. The record is excluded from standard queries by default
4. The record appears in the Admin "Deleted Records" audit trail

### Cascade Soft Delete (Courses)

When a **Course** is soft-deleted, the following related records are automatically soft-deleted within a single database transaction:
- All Assignments belonging to the course
- All Discussions belonging to the course
- All CourseContent belonging to the course
- All Announcements belonging to the course

**Note:** Enrollments are NOT cascade-deleted. Students remain enrolled but the course becomes inaccessible.

## Retention Period

### Standard Retention: 1 Year

Soft-deleted records are retained for **1 year (365 days)** from the `deletedAt` timestamp.

After the 1-year retention period, records become **eligible for permanent deletion**. However, permanent deletion is **not automatic** in the MVP phase.

### Permanent Deletion Process (MVP)

During the MVP phase:
- Permanent deletion requires **manual admin action**
- No automated purging is implemented
- System administrators must verify compliance requirements before permanent deletion
- All permanent deletion actions should be logged for audit purposes

### Future Enhancement (Post-MVP)

Post-MVP phases may include:
- Automated permanent deletion scheduler
- Configurable retention periods per model type
- GDPR "right to erasure" compliance automation
- Permanent deletion approval workflows

## Admin Access

### Viewing Soft-Deleted Records

- Access: `/admin/deleted-records`
- Permissions: ADMIN role required
- Features:
  - Filter by model type (Users, Courses, Assignments, Grades, Discussions, Content, Announcements)
  - View deletion timestamp
  - View record context (course, instructor, etc.)
  - Restore individual records

### Restoring Records

Admins can restore soft-deleted records through the Admin UI:

1. Navigate to `/admin/deleted-records`
2. Select the appropriate model tab
3. Click "Restore" on the desired record
4. Confirm the restoration

**Course Restoration:** When restoring a course, all related cascade-deleted content (assignments, discussions, content, announcements) is automatically restored.

### Restoration API

```
POST /api/admin/deleted-records/{id}/restore
Content-Type: application/json

{
  "model": "user" | "course" | "assignment" | "grade" | "discussion" | "courseContent" | "announcement",
  "cascadeRestore": true  // Optional, defaults to true for courses
}
```

## Security Considerations

### Access Controls

- Only users with **ADMIN** role can view soft-deleted records
- Only users with **ADMIN** role can restore soft-deleted records
- Regular users (STUDENT, INSTRUCTOR) cannot access or view deleted records
- Delete operations are logged in the audit trail

### Data Privacy

- Soft-deleted records containing PII (name, email, etc.) remain in the database during the retention period
- Consider GDPR "right to erasure" requirements for EU users (deferred to post-MVP)
- Legal review is required before production launch to ensure compliance with applicable regulations

### Audit Trail Integrity

- `deletedAt` timestamps are immutable after being set
- Restoration events should be logged with admin user ID and timestamp
- All soft-deleted records are excluded from standard queries to prevent accidental exposure

## Technical Implementation

### Database Schema

All models with soft delete support include:

```prisma
model Example {
  // ... existing fields
  deletedAt DateTime? // Soft delete timestamp (NULL = active, timestamp = deleted)

  @@index([deletedAt]) // Index for query performance
}
```

### Query Patterns

**Standard queries (exclude deleted):**
```typescript
import { notDeleted } from '@/lib/soft-delete'

const activeUsers = await prisma.user.findMany({
  where: { ...notDeleted }
})
```

**Admin queries (include deleted):**
```typescript
import { onlyDeleted } from '@/lib/soft-delete'

const deletedUsers = await prisma.user.findMany({
  where: { ...onlyDeleted }
})
```

### Soft Delete Utilities

Located at: `/src/lib/soft-delete.ts`

Key functions:
- `softDelete(model, id)` - Soft delete a single record
- `restore(model, id)` - Restore a single record
- `cascadeSoftDeleteCourse(courseId)` - Cascade soft delete course and related content
- `cascadeRestoreCourse(courseId)` - Cascade restore course and related content
- `getSoftDeletedRecords(model)` - Get all soft-deleted records for a model
- `restoreRecord(model, id)` - Restore a record by model type

## Compliance Notes

### Regulatory Considerations

- **FERPA (US):** Student education records must be retained per institutional policy
- **GDPR (EU):** "Right to erasure" may require hard deletion for EU users (deferred to post-MVP)
- **SOC 2:** Soft delete supports audit trail requirements for Type II compliance

### Legal Review Required

Before production launch, the following should be reviewed with legal counsel:
1. 1-year retention period adequacy for all applicable regulations
2. GDPR compliance requirements for EU users
3. Data subject access request (DSAR) procedures
4. Cross-border data transfer implications

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | AI Gurus Dev Team | Initial data retention policy |

## References

- [Architecture Document: Security Architecture](./architecture.md#security-architecture)
- [Tech Spec Epic 1: Soft Delete Implementation](./tech-spec-epic-1.md#detailed-design)
- [Story 1.9: Soft Deletes Implementation](./stories/1-9-soft-deletes-implementation.md)
