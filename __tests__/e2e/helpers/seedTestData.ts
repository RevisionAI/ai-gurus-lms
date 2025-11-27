/**
 * Test Data Seeding Script
 *
 * Seeds the database with test data for E2E tests.
 * All test data is prefixed with 'e2e-test-' for easy identification and cleanup.
 */

import { prisma, connectTestDb, resetTestData } from './setupTestDb';
import { testStudent, testInstructor, testAdmin } from '../fixtures/testUsers';
import { testCourse, testAssignment } from '../fixtures/testCourses';
import bcrypt from 'bcryptjs';

export interface SeededData {
  studentId: string;
  instructorId: string;
  adminId: string;
  courseId: string;
  assignmentId: string;
}

let seededData: SeededData | null = null;

/**
 * Seed test data into the database
 * Returns IDs of created entities for use in tests
 */
export async function seedTestData(): Promise<SeededData> {
  await connectTestDb();

  // Clean up any existing test data first
  await resetTestData();

  // Hash passwords
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create test users
  const student = await prisma.user.create({
    data: {
      id: testStudent.id,
      email: testStudent.email,
      name: testStudent.name,
      password: hashedPassword,
      role: testStudent.role,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      id: testInstructor.id,
      email: testInstructor.email,
      name: testInstructor.name,
      password: hashedPassword,
      role: testInstructor.role,
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      password: hashedPassword,
      role: testAdmin.role,
    },
  });

  // Create test course
  const course = await prisma.course.create({
    data: {
      id: testCourse.id,
      title: testCourse.title,
      description: testCourse.description,
      code: testCourse.code,
      semester: testCourse.semester,
      year: testCourse.year,
      instructorId: instructor.id,
    },
  });

  // Create test assignment
  const assignment = await prisma.assignment.create({
    data: {
      id: testAssignment.id,
      title: testAssignment.title,
      description: testAssignment.description,
      dueDate: testAssignment.dueDate,
      maxPoints: testAssignment.maxPoints,
      courseId: course.id,
    },
  });

  seededData = {
    studentId: student.id,
    instructorId: instructor.id,
    adminId: admin.id,
    courseId: course.id,
    assignmentId: assignment.id,
  };

  return seededData;
}

/**
 * Get the seeded data (for use in tests)
 */
export function getSeededData(): SeededData | null {
  return seededData;
}

/**
 * Check if data has been seeded
 */
export function isSeeded(): boolean {
  return seededData !== null;
}
