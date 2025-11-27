/**
 * Admin Test Data Fixtures
 *
 * Test data for admin E2E test scenarios.
 * All test data uses the 'e2e-admin-test-' prefix for easy identification and cleanup.
 *
 * Story: 3.3 - E2E Tests - Admin Journey
 */

/**
 * Test user data for admin creation scenarios
 */
export const newTestUser = {
  email: 'e2e-admin-test-newuser@example.com',
  name: 'E2E Admin Test',
  surname: 'New User',
  role: 'STUDENT' as const,
  password: 'TestPassword123!',
};

/**
 * User to be edited in tests
 */
export const userToEdit = {
  email: 'e2e-admin-test-edituser@example.com',
  name: 'E2E Edit',
  surname: 'Test User',
  role: 'STUDENT' as const,
  password: 'TestPassword123!',
};

/**
 * Updated user data after editing
 */
export const updatedUserData = {
  name: 'E2E Edited',
  surname: 'Updated User',
  role: 'INSTRUCTOR' as const,
};

/**
 * User to have password reset
 */
export const userForPasswordReset = {
  email: 'e2e-admin-test-resetpw@example.com',
  name: 'E2E Password',
  surname: 'Reset User',
  role: 'STUDENT' as const,
  password: 'OldPassword123!',
};

/**
 * New password for reset scenario
 */
export const newPassword = 'NewPassword456!';

/**
 * User to be deactivated
 */
export const userToDeactivate = {
  email: 'e2e-admin-test-deactivate@example.com',
  name: 'E2E Deactivate',
  surname: 'Test User',
  role: 'STUDENT' as const,
  password: 'TestPassword123!',
};

/**
 * Multiple users for filtering tests
 */
export const testUsersForFiltering = [
  {
    email: 'e2e-admin-test-filter-student1@example.com',
    name: 'Filter Student',
    surname: 'One',
    role: 'STUDENT' as const,
    password: 'TestPassword123!',
  },
  {
    email: 'e2e-admin-test-filter-student2@example.com',
    name: 'Filter Student',
    surname: 'Two',
    role: 'STUDENT' as const,
    password: 'TestPassword123!',
  },
  {
    email: 'e2e-admin-test-filter-instructor@example.com',
    name: 'Filter Instructor',
    surname: 'Test',
    role: 'INSTRUCTOR' as const,
    password: 'TestPassword123!',
  },
];

/**
 * Admin role change scenarios
 */
export const roleChangeScenarios = [
  {
    from: 'STUDENT' as const,
    to: 'INSTRUCTOR' as const,
    requiresConfirmation: true,
  },
  {
    from: 'INSTRUCTOR' as const,
    to: 'ADMIN' as const,
    requiresConfirmation: true,
  },
  {
    from: 'ADMIN' as const,
    to: 'STUDENT' as const,
    requiresConfirmation: true,
  },
];

/**
 * Expected error messages
 */
export const errorMessages = {
  duplicateEmail: 'Email already exists',
  invalidEmail: 'Invalid email format',
  weakPassword: 'Password too weak',
  unauthorized: 'Unauthorized',
  notFound: 'User not found',
};

/**
 * Expected success messages
 */
export const successMessages = {
  userCreated: 'User created successfully',
  userUpdated: 'User updated successfully',
  userDeactivated: 'User deactivated successfully',
  passwordReset: 'Password reset successfully',
};

/**
 * Test configuration
 */
export const testConfig = {
  searchDebounceMs: 500,
  toastTimeoutMs: 5000,
  modalAnimationMs: 300,
  apiResponseTimeoutMs: 10000,
};
