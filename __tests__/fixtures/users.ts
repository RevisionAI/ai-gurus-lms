/**
 * User Test Fixtures
 *
 * Mock user objects for testing with complete model fields.
 * Based on the Prisma User model schema.
 */

import { User } from '@prisma/client';

// Fixed dates for deterministic tests
const fixedDate = new Date('2025-01-01T00:00:00.000Z');
const updatedDate = new Date('2025-01-15T00:00:00.000Z');

/**
 * Mock student user
 */
export const mockStudent: User = {
  id: 'student-1',
  email: 'student@test.com',
  name: 'Test',
  surname: 'Student',
  password: '$2b$10$hashedpassword', // bcrypt hash placeholder
  cellNumber: '+27123456789',
  company: 'Test University',
  position: 'Student',
  workAddress: '123 Campus Road, Test City',
  role: 'STUDENT',
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock instructor user
 */
export const mockInstructor: User = {
  id: 'instructor-1',
  email: 'instructor@test.com',
  name: 'Test',
  surname: 'Instructor',
  password: '$2b$10$hashedpassword',
  cellNumber: '+27987654321',
  company: 'Test University',
  position: 'Professor',
  workAddress: '456 Faculty Building, Test City',
  role: 'INSTRUCTOR',
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock admin user
 */
export const mockAdmin: User = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Test',
  surname: 'Admin',
  password: '$2b$10$hashedpassword',
  cellNumber: '+27111222333',
  company: 'Test University',
  position: 'System Administrator',
  workAddress: '789 Admin Building, Test City',
  role: 'ADMIN',
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: null,
};

/**
 * Mock deleted user (soft deleted)
 */
export const mockDeletedUser: User = {
  id: 'deleted-user-1',
  email: 'deleted@test.com',
  name: 'Deleted',
  surname: 'User',
  password: '$2b$10$hashedpassword',
  cellNumber: '+27000000000',
  company: 'Former Company',
  position: 'Former Position',
  workAddress: 'N/A',
  role: 'STUDENT',
  createdAt: fixedDate,
  updatedAt: updatedDate,
  deletedAt: new Date('2025-02-01T00:00:00.000Z'),
};

/**
 * Create a custom mock user with partial overrides
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    ...mockStudent,
    id: `user-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Array of multiple mock users for list testing
 */
export const mockUsers: User[] = [mockStudent, mockInstructor, mockAdmin];
