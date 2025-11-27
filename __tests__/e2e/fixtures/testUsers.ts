/**
 * Test User Fixtures for E2E Tests
 *
 * All test users use the 'e2e-test-' prefix for easy identification and cleanup.
 */

export const testStudent = {
  id: 'e2e-test-student-001',
  email: 'e2e-test-student@example.com',
  name: 'E2E Test Student',
  role: 'STUDENT' as const,
  password: 'Password123!', // Plain text for tests, hashed during seeding
};

export const testInstructor = {
  id: 'e2e-test-instructor-001',
  email: 'e2e-test-instructor@example.com',
  name: 'E2E Test Instructor',
  role: 'INSTRUCTOR' as const,
  password: 'Password123!',
};

export const testAdmin = {
  id: 'e2e-test-admin-001',
  email: 'e2e-test-admin@example.com',
  name: 'E2E Test Admin',
  role: 'ADMIN' as const,
  password: 'Password123!',
};

// Additional test users for edge cases
export const testUsers = {
  student: testStudent,
  instructor: testInstructor,
  admin: testAdmin,
};
