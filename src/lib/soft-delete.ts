/**
 * Soft Delete Utilities
 *
 * Provides soft delete functionality for compliance and audit trail requirements.
 * Models with soft delete support: User, Course, Assignment, Grade, Discussion,
 * CourseContent, Announcement
 *
 * Data Retention Policy: Soft-deleted records retained for 1 year before eligible
 * for permanent deletion (manual admin action only in MVP).
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Models that support soft delete
export const SOFT_DELETE_MODELS = [
  'user',
  'course',
  'assignment',
  'grade',
  'discussion',
  'courseContent',
  'announcement',
] as const

export type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number]

/**
 * Base where clause for filtering out soft-deleted records.
 * Use this in all queries to exclude soft-deleted records by default.
 *
 * @example
 * const users = await prisma.user.findMany({
 *   where: { ...notDeleted, email: 'test@example.com' }
 * })
 */
export const notDeleted = { deletedAt: null } as const

/**
 * Where clause for finding only soft-deleted records (admin views).
 *
 * @example
 * const deletedUsers = await prisma.user.findMany({
 *   where: { ...onlyDeleted }
 * })
 */
export const onlyDeleted = { deletedAt: { not: null } } as const

/**
 * Soft delete a single record by setting deletedAt to current timestamp.
 *
 * @param model - Prisma model delegate (e.g., prisma.user)
 * @param id - Record ID to soft delete
 * @returns Updated record with deletedAt set
 *
 * @example
 * await softDelete(prisma.user, userId)
 */
export async function softDelete<T>(
  model: { update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<T> },
  id: string
): Promise<T> {
  return await model.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

/**
 * Restore a soft-deleted record by setting deletedAt to null.
 *
 * @param model - Prisma model delegate (e.g., prisma.user)
 * @param id - Record ID to restore
 * @returns Updated record with deletedAt set to null
 *
 * @example
 * await restore(prisma.user, userId)
 */
export async function restore<T>(
  model: { update: (args: { where: { id: string }; data: { deletedAt: null } }) => Promise<T> },
  id: string
): Promise<T> {
  return await model.update({
    where: { id },
    data: { deletedAt: null },
  })
}

/**
 * Cascade soft delete for Course model.
 * Soft-deletes the course and all related content in a single transaction:
 * - Assignments
 * - Discussions
 * - CourseContent
 * - Announcements
 *
 * Note: Enrollments are NOT cascade deleted - they remain active but are
 * filtered out via course.deletedAt check in queries.
 *
 * @param courseId - Course ID to soft delete with cascade
 *
 * @example
 * await cascadeSoftDeleteCourse(courseId)
 */
export async function cascadeSoftDeleteCourse(courseId: string): Promise<void> {
  const now = new Date()

  await prisma.$transaction([
    // Soft delete the course itself
    prisma.courses.update({
      where: { id: courseId },
      data: { deletedAt: now },
    }),
    // Cascade to related Assignments
    prisma.assignments.updateMany({
      where: { courseId },
      data: { deletedAt: now },
    }),
    // Cascade to related Discussions
    prisma.discussions.updateMany({
      where: { courseId },
      data: { deletedAt: now },
    }),
    // Cascade to related CourseContent
    prisma.course_content.updateMany({
      where: { courseId },
      data: { deletedAt: now },
    }),
    // Cascade to related Announcements
    prisma.announcements.updateMany({
      where: { courseId },
      data: { deletedAt: now },
    }),
  ])
}

/**
 * Cascade restore for Course model.
 * Restores the course and all related content that was soft-deleted at the same time.
 *
 * @param courseId - Course ID to restore with cascade
 *
 * @example
 * await cascadeRestoreCourse(courseId)
 */
export async function cascadeRestoreCourse(courseId: string): Promise<void> {
  await prisma.$transaction([
    // Restore the course itself
    prisma.courses.update({
      where: { id: courseId },
      data: { deletedAt: null },
    }),
    // Restore related Assignments
    prisma.assignments.updateMany({
      where: { courseId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    // Restore related Discussions
    prisma.discussions.updateMany({
      where: { courseId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    // Restore related CourseContent
    prisma.course_content.updateMany({
      where: { courseId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    // Restore related Announcements
    prisma.announcements.updateMany({
      where: { courseId, deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
  ])
}

/**
 * Get soft-deleted records for a model (admin view).
 *
 * @param model - Model name ('user', 'course', 'assignment', 'grade', 'discussion')
 * @returns Array of soft-deleted records
 */
export async function getSoftDeletedRecords(model: SoftDeleteModel) {
  switch (model) {
    case 'user':
      return prisma.users.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
          deletedAt: true,
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'course':
      return prisma.courses.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          title: true,
          code: true,
          deletedAt: true,
          users: { select: { name: true, surname: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'assignment':
      return prisma.assignments.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          title: true,
          deletedAt: true,
          courses: { select: { title: true, code: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'grade':
      return prisma.grades.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          points: true,
          deletedAt: true,
          users_grades_studentIdTousers: { select: { name: true, surname: true } },
          assignments: { select: { title: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'discussion':
      return prisma.discussions.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          title: true,
          deletedAt: true,
          courses: { select: { title: true, code: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'courseContent':
      return prisma.course_content.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          title: true,
          type: true,
          deletedAt: true,
          courses: { select: { title: true, code: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    case 'announcement':
      return prisma.announcements.findMany({
        where: onlyDeleted,
        select: {
          id: true,
          title: true,
          deletedAt: true,
          courses: { select: { title: true, code: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    default:
      throw new Error(`Invalid model: ${model}`)
  }
}

/**
 * Restore a soft-deleted record by model type and ID.
 *
 * @param model - Model name ('user', 'course', 'assignment', 'grade', 'discussion')
 * @param id - Record ID to restore
 * @param cascadeRestore - For courses, whether to restore related content (default: true)
 */
export async function restoreRecord(
  model: SoftDeleteModel,
  id: string,
  cascadeRestore: boolean = true
) {
  switch (model) {
    case 'user':
      return restore(prisma.users, id)
    case 'course':
      if (cascadeRestore) {
        await cascadeRestoreCourse(id)
        return prisma.courses.findUnique({ where: { id } })
      }
      return restore(prisma.courses, id)
    case 'assignment':
      return restore(prisma.assignments, id)
    case 'grade':
      return restore(prisma.grades, id)
    case 'discussion':
      return restore(prisma.discussions, id)
    case 'courseContent':
      return restore(prisma.course_content, id)
    case 'announcement':
      return restore(prisma.announcements, id)
    default:
      throw new Error(`Invalid model: ${model}`)
  }
}
