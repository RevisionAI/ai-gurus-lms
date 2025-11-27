/**
 * Validators Barrel Export
 *
 * Re-exports all validation schemas for easy importing.
 */

// User schemas
export {
  registerUserSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  loginSchema,
  type RegisterUserInput,
  type CreateUserInput,
  type UpdateUserInput,
  type ChangePasswordInput,
  type LoginInput,
} from './user'

// Course schemas
export {
  createCourseSchema,
  updateCourseSchema,
  enrollmentSchema,
  bulkEnrollmentSchema,
  unenrollmentSchema,
  createContentSchema,
  updateContentSchema,
  reorderContentSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type EnrollmentInput,
  type BulkEnrollmentInput,
  type UnenrollmentInput,
  type CreateContentInput,
  type UpdateContentInput,
  type ReorderContentInput,
} from './course'

// Assignment schemas
export {
  createAssignmentSchema,
  updateAssignmentSchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type CreateSubmissionInput,
  type UpdateSubmissionInput,
} from './assignment'

// Grade schemas
export {
  gradeSubmissionSchema,
  updateGradeSchema,
  bulkGradeSchema,
  type GradeSubmissionInput,
  type UpdateGradeInput,
  type BulkGradeInput,
} from './grade'

// Discussion schemas
export {
  createDiscussionSchema,
  updateDiscussionSchema,
  createDiscussionPostSchema,
  updateDiscussionPostSchema,
  type CreateDiscussionInput,
  type UpdateDiscussionInput,
  type CreateDiscussionPostInput,
  type UpdateDiscussionPostInput,
} from './discussion'

// Announcement schemas
export {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from './announcement'

// File upload schemas
export {
  signedUrlRequestSchema,
  uploadCompleteSchema,
  sanitizeFilename,
  UploadErrorCodes,
  createUploadError,
  getMaxFileSize,
  validateFileSize,
  type SignedUrlRequest,
  type UploadCompleteRequest,
  type UploadErrorCode,
} from './file'

// Gradebook schemas
export {
  gradeUpdateSchema,
  bulkGradeUpdateSchema,
  gradebookFiltersSchema,
  courseIdSchema,
  gradeStatusValues,
  parseGradebookFilters,
  hasActiveFilters,
  type GradeUpdateInput,
  type BulkGradeUpdateInput,
  type GradebookFilters,
  type GradebookFiltersInput,
  type GradeStatusFilter,
} from './gradebook'

// Feedback template schemas
export {
  feedbackTemplateSchema,
  updateFeedbackTemplateSchema,
  applyTemplateSchema,
  templateIdSchema,
  templateQuerySchema,
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type FeedbackTemplateInput,
  type UpdateFeedbackTemplateInput,
  type ApplyTemplateInput,
  type TemplateIdInput,
  type TemplateQueryInput,
  type TemplateCategory,
} from './feedbackTemplate'
