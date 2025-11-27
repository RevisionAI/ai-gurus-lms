/**
 * Course Test Fixtures
 *
 * Mock course objects for testing with complete model fields.
 * Based on the Prisma Course model schema.
 */

import { Course, Assignment, Enrollment } from '@prisma/client';
import { mockInstructor, mockStudent } from './users';

// Fixed dates for deterministic tests
const fixedDate = new Date('2025-01-01T00:00:00.000Z');
const updatedDate = new Date('2025-01-15T00:00:00.000Z');

/**
 * Mock course
 */
export const mockCourse: Course = {
  id: 'course-1',
  title: 'Introduction to AI',
  description: 'Learn the fundamentals of artificial intelligence and machine learning.',
  code: 'AI101',
  semester: 'Spring',
  year: 2025,
  isActive: true,
  prerequisites: 'Basic programming knowledge in Python',
  learningObjectives: ['Understand AI fundamentals', 'Build simple ML models'],
  targetAudience: 'Students with programming experience',
  instructorId: mockInstructor.id,
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock inactive course
 */
export const mockInactiveCourse: Course = {
  id: 'course-2',
  title: 'Advanced AI',
  description: 'Deep dive into advanced AI concepts.',
  code: 'AI201',
  semester: 'Fall',
  year: 2024,
  isActive: false,
  prerequisites: 'Completion of AI101, Strong math background',
  learningObjectives: ['Master deep learning', 'Implement neural networks'],
  targetAudience: 'Advanced students and professionals',
  instructorId: mockInstructor.id,
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock deleted course (soft deleted)
 */
export const mockDeletedCourse: Course = {
  id: 'course-3',
  title: 'Deleted Course',
  description: 'This course has been deleted.',
  code: 'DEL101',
  semester: 'Spring',
  year: 2024,
  isActive: false,
  prerequisites: null,
  learningObjectives: [],
  targetAudience: null,
  instructorId: mockInstructor.id,
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: new Date('2025-02-01T00:00:00.000Z'),
};

/**
 * Mock assignment for the course
 */
export const mockAssignment: Assignment = {
  id: 'assignment-1',
  title: 'AI Fundamentals Quiz',
  description: 'Test your knowledge of AI basics.',
  dueDate: new Date('2025-02-15T23:59:59.000Z'),
  maxPoints: 100,
  isPublished: true,
  courseId: mockCourse.id,
  createdById: mockInstructor.id,
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock enrollment linking student to course
 */
export const mockEnrollment: Enrollment = {
  id: 'enrollment-1',
  userId: mockStudent.id,
  courseId: mockCourse.id,
  enrolledAt: fixedDate,
};

/**
 * Create a custom mock course with partial overrides
 */
export function createMockCourse(overrides: Partial<Course> = {}): Course {
  return {
    ...mockCourse,
    id: `course-${Date.now()}`,
    code: `COURSE${Date.now()}`,
    ...overrides,
  };
}

/**
 * Create a custom mock assignment with partial overrides
 */
export function createMockAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    ...mockAssignment,
    id: `assignment-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Array of multiple mock courses for list testing
 */
export const mockCourses: Course[] = [mockCourse, mockInactiveCourse];
