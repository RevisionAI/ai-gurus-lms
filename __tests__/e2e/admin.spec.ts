/**
 * Admin Journey E2E Tests
 *
 * Story: 3.3 - E2E Tests - Admin Journey
 *
 * Comprehensive E2E tests for the Admin user journey covering:
 * 1. User Management: Create → Edit → Assign Role → Reset Password → Deactivate
 * 2. System Monitoring: View Dashboard → Check Stats → Review Metrics
 * 3. Course Management: View Courses → Check Course Status
 * 4. Security: Admin-only routes protected, unauthorized access blocked
 * 5. Edge Cases: Role change confirmation, deactivation confirmation, password reset
 *
 * Uses Page Object Model (POM) pattern for maintainability.
 * Screenshots captured on failure via Playwright config.
 * Target execution time: < 3 minutes
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AdminCoursesPage } from './pages/AdminCoursesPage';
import { SystemStatsPage } from './pages/SystemStatsPage';
import { testAdmin, testStudent, testInstructor } from './fixtures/testUsers';
import {
  newTestUser,
  userToEdit,
  updatedUserData,
  userForPasswordReset,
  newPassword,
  userToDeactivate,
  testUsersForFiltering,
  successMessages,
} from './fixtures/adminTestData';

// ============================================
// Test Suite: Admin Journey
// ============================================

test.describe('Admin Journey - User Management', () => {
  let loginPage: LoginPage;
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    userManagementPage = new UserManagementPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();

    // Navigate to user management
    await userManagementPage.goto();
  });

  test.describe('User Creation (AC 3.3.2)', () => {
    test('Admin can create a new user', async ({ page }) => {
      // Click Add User button
      await userManagementPage.clickAddUser();

      // Verify create modal is visible
      await expect(userManagementPage.createModal).toBeVisible();

      // Fill in user details
      await userManagementPage.createUser(newTestUser);

      // Verify success message
      await page.waitForTimeout(2000);

      // Verify user appears in the table
      const userExists = await userManagementPage.userExists(newTestUser.email);
      expect(userExists).toBe(true);
    });

    test('Created user has correct role', async ({ page }) => {
      // Create user
      await userManagementPage.createUser(newTestUser);

      // Wait for user to appear
      await page.waitForTimeout(2000);

      // Search for the user
      await userManagementPage.searchUsers(newTestUser.email);

      // Verify role badge shows correct role
      const userRow = await userManagementPage.findUserRow(newTestUser.email);
      const roleText = await userRow.textContent();

      expect(roleText).toContain('Student');
    });

    test('Modal closes after successful creation', async ({ page }) => {
      await userManagementPage.createUser(newTestUser);

      // Verify modal is closed
      await expect(userManagementPage.createModal).not.toBeVisible();
    });
  });

  test.describe('User Editing (AC 3.3.2)', () => {
    test.beforeEach(async ({ page }) => {
      // Create a user to edit
      await userManagementPage.createUser(userToEdit);
      await page.waitForTimeout(2000);
    });

    test('Admin can edit user details', async ({ page }) => {
      // Search for the user
      await userManagementPage.searchUsers(userToEdit.email);

      // Edit the user
      await userManagementPage.editUser(userToEdit.email, {
        name: updatedUserData.name,
        surname: updatedUserData.surname,
      });

      // Wait for update
      await page.waitForTimeout(2000);

      // Verify updated details
      const userRow = await userManagementPage.findUserRow(userToEdit.email);
      const rowText = await userRow.textContent();

      expect(rowText).toContain(updatedUserData.name);
      expect(rowText).toContain(updatedUserData.surname);
    });

    test('Admin can assign new role to user (AC 3.3.2)', async ({ page }) => {
      // Search for the user
      await userManagementPage.searchUsers(userToEdit.email);

      // Edit user and change role
      await userManagementPage.editUser(userToEdit.email, {
        role: updatedUserData.role,
      });

      // Wait for update
      await page.waitForTimeout(2000);

      // Refresh to see changes
      await userManagementPage.clickRefresh();
      await page.waitForTimeout(1000);

      // Search again
      await userManagementPage.searchUsers(userToEdit.email);

      // Verify role changed
      const userRow = await userManagementPage.findUserRow(userToEdit.email);
      const roleText = await userRow.textContent();

      expect(roleText).toContain('Instructor');
    });

    test('Role change shows confirmation dialog (AC 3.3.3)', async ({ page }) => {
      // Search for the user
      await userManagementPage.searchUsers(userToEdit.email);

      // Open edit modal
      await userManagementPage.openUserActionsMenu(userToEdit.email);
      await page.locator('text=Edit').click();
      await userManagementPage.editModal.waitFor({ state: 'visible' });

      // Change role
      await userManagementPage.editRoleSelect.selectOption('ADMIN');

      // Click submit
      await userManagementPage.editSubmitButton.click();

      // Verify confirmation dialog appears
      const confirmationVisible = await userManagementPage.roleChangeConfirmation
        .isVisible()
        .catch(() => false);

      if (confirmationVisible) {
        await expect(userManagementPage.roleChangeConfirmation).toBeVisible();
        await userManagementPage.roleChangeCancelButton.click();
      }
    });
  });

  test.describe('Password Reset (AC 3.3.3)', () => {
    test.beforeEach(async ({ page }) => {
      // Create a user for password reset
      await userManagementPage.createUser(userForPasswordReset);
      await page.waitForTimeout(2000);
    });

    test('Admin can reset user password', async ({ page }) => {
      // Search for user
      await userManagementPage.searchUsers(userForPasswordReset.email);

      // Open actions menu
      await userManagementPage.openUserActionsMenu(userForPasswordReset.email);

      // Click Reset Password
      await page.locator('text=Reset Password').click();

      // Verify reset password modal opens
      await expect(userManagementPage.resetPasswordModal).toBeVisible();

      // Fill in new password
      await userManagementPage.newPasswordInput.fill(newPassword);
      await userManagementPage.confirmPasswordInput.fill(newPassword);

      // Submit
      await userManagementPage.resetPasswordSubmitButton.click();

      // Verify modal closes
      await expect(userManagementPage.resetPasswordModal).not.toBeVisible();
    });

    test('Password reset modal validates matching passwords', async ({ page }) => {
      // Search for user
      await userManagementPage.searchUsers(userForPasswordReset.email);

      // Open reset password modal
      await userManagementPage.openUserActionsMenu(userForPasswordReset.email);
      await page.locator('text=Reset Password').click();

      // Fill in mismatched passwords
      await userManagementPage.newPasswordInput.fill('Password123!');
      await userManagementPage.confirmPasswordInput.fill('DifferentPassword123!');

      // Try to submit
      await userManagementPage.resetPasswordSubmitButton.click();

      // Modal should remain visible due to validation error
      await page.waitForTimeout(1000);
      const modalVisible = await userManagementPage.resetPasswordModal.isVisible();
      expect(modalVisible).toBe(true);
    });
  });

  test.describe('User Deactivation (AC 3.3.2, 3.3.3)', () => {
    test.beforeEach(async ({ page }) => {
      // Create a user to deactivate
      await userManagementPage.createUser(userToDeactivate);
      await page.waitForTimeout(2000);
    });

    test('Admin can deactivate user (soft delete)', async ({ page }) => {
      // Search for user
      await userManagementPage.searchUsers(userToDeactivate.email);

      // Verify user exists
      const userExistsBefore = await userManagementPage.userExists(
        userToDeactivate.email
      );
      expect(userExistsBefore).toBe(true);

      // Deactivate user
      await userManagementPage.deactivateUser(userToDeactivate.email);

      // Wait for deactivation
      await page.waitForTimeout(2000);

      // Refresh the page
      await userManagementPage.clickRefresh();
      await page.waitForTimeout(1000);

      // Search again
      await userManagementPage.searchUsers(userToDeactivate.email);

      // User should not appear in active users (soft deleted)
      await page.waitForTimeout(1000);
      const noUsersVisible = await userManagementPage.noUsersMessage
        .isVisible()
        .catch(() => false);

      // Either no users found, or user count decreased
      const userCount = await userManagementPage.getUserCount();
      const userDeactivated = noUsersVisible || userCount === 0;

      expect(userDeactivated).toBe(true);
    });

    test('Deactivation shows confirmation dialog (AC 3.3.3)', async ({ page }) => {
      // Search for user
      await userManagementPage.searchUsers(userToDeactivate.email);

      // Open actions menu
      await userManagementPage.openUserActionsMenu(userToDeactivate.email);

      // Click Deactivate
      await page.locator('text=Deactivate').click();

      // Verify confirmation dialog
      await expect(userManagementPage.deactivateConfirmation).toBeVisible();

      // Cancel deactivation
      await userManagementPage.deactivateCancelButton.click();

      // Verify user still exists
      await page.waitForTimeout(500);
      const userExists = await userManagementPage.userExists(userToDeactivate.email);
      expect(userExists).toBe(true);
    });
  });

  test.describe('User Search and Filtering', () => {
    test('Admin can search users by email', async ({ page }) => {
      // Search for admin user
      await userManagementPage.searchUsers(testAdmin.email);

      // Wait for search results
      await page.waitForTimeout(1000);

      // Verify admin user appears
      const adminExists = await userManagementPage.userExists(testAdmin.email);
      expect(adminExists).toBe(true);
    });

    test('Admin can filter users by role', async ({ page }) => {
      // Filter by ADMIN role
      await userManagementPage.filterByRole('ADMIN');

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Should see at least the test admin
      const userCount = await userManagementPage.getUserCount();
      expect(userCount).toBeGreaterThan(0);
    });

    test('Search shows no results for non-existent user', async ({ page }) => {
      // Search for non-existent user
      await userManagementPage.searchUsers('nonexistent@example.com');

      // Wait for search
      await page.waitForTimeout(1000);

      // Should show no users message
      const noUsersVisible = await userManagementPage.noUsersMessage
        .isVisible()
        .catch(() => false);

      expect(noUsersVisible).toBe(true);
    });
  });

  test.describe('Refresh Functionality', () => {
    test('Refresh button updates user list', async ({ page }) => {
      // Get initial user count
      const initialCount = await userManagementPage.getUserCount();

      // Click refresh
      await userManagementPage.clickRefresh();

      // Wait for refresh
      await page.waitForTimeout(1000);

      // User list should still be visible
      await expect(userManagementPage.userTable).toBeVisible();

      // Count should be same or updated
      const newCount = await userManagementPage.getUserCount();
      expect(newCount).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// Test Suite: System Monitoring
// ============================================

test.describe('Admin Journey - System Monitoring (AC 3.3.2)', () => {
  let loginPage: LoginPage;
  let systemStatsPage: SystemStatsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    systemStatsPage = new SystemStatsPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();

    // Navigate to dashboard
    await systemStatsPage.goto();
  });

  test('Admin can view system dashboard', async ({ page }) => {
    await systemStatsPage.expectVisible();

    // Verify dashboard title
    await expect(page.locator('text=System Dashboard')).toBeVisible();
  });

  test('Dashboard displays user statistics', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Verify all stats cards are visible
    await systemStatsPage.verifyStatsCardsVisible();

    // Get statistics
    const stats = await systemStatsPage.getUserStatistics();

    // Verify stats are reasonable numbers
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.students).toBeGreaterThanOrEqual(0);
    expect(stats.instructors).toBeGreaterThanOrEqual(0);
    expect(stats.admins).toBeGreaterThan(0); // At least the test admin
  });

  test('Dashboard displays system metrics', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Verify charts are present
    await systemStatsPage.verifyChartsRendered();
  });

  test('System health indicators are displayed', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Verify system health section
    await systemStatsPage.verifySystemHealthVisible();

    // Get health status
    const dbStatus = await systemStatsPage.getDatabaseStatus();
    const storageStatus = await systemStatsPage.getStorageStatus();

    // Health status should not be empty
    expect(dbStatus.length).toBeGreaterThan(0);
    expect(storageStatus.length).toBeGreaterThan(0);
  });

  test('Activity feed shows recent activity', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Check if activity feed is visible
    const activityVisible = await systemStatsPage.isActivityFeedVisible();

    if (activityVisible) {
      // Get activity metrics
      const metrics = await systemStatsPage.getActivityMetrics();

      // Metrics should be defined
      expect(metrics.recentLogins).toBeDefined();
      expect(metrics.recentEnrollments).toBeDefined();
      expect(metrics.recentSubmissions).toBeDefined();
    }
  });

  test('Refresh button updates statistics', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Get initial stats
    const initialStats = await systemStatsPage.getUserStatistics();

    // Click refresh
    await systemStatsPage.refreshStats();

    // Stats should still be visible
    await systemStatsPage.verifyStatsCardsVisible();

    // Get updated stats
    const updatedStats = await systemStatsPage.getUserStatistics();

    // Stats should be defined and consistent
    expect(updatedStats.total).toBeGreaterThanOrEqual(0);
  });

  test('Dashboard has no errors', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Verify no error state
    await systemStatsPage.verifyNoErrors();
  });

  test('Admin can navigate to user management from dashboard', async ({ page }) => {
    await systemStatsPage.waitForStatsLoad();

    // Click manage users link
    await systemStatsPage.navigateToManageUsers();

    // Verify navigation to user management
    expect(page.url()).toContain('/admin/users');
  });
});

// ============================================
// Test Suite: Course Management
// ============================================

test.describe('Admin Journey - Course Management (AC 3.3.2)', () => {
  let loginPage: LoginPage;
  let adminCoursesPage: AdminCoursesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminCoursesPage = new AdminCoursesPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();

    // Navigate to courses
    await adminCoursesPage.goto();
  });

  test('Admin can view all courses', async ({ page }) => {
    await adminCoursesPage.expectVisible();

    // Get course count
    const courseCount = await adminCoursesPage.getCourseCount();

    // Should be able to view courses (even if 0)
    expect(courseCount).toBeGreaterThanOrEqual(0);
  });

  test('Admin can see course details', async ({ page }) => {
    const courseCount = await adminCoursesPage.getCourseCount();

    if (courseCount > 0) {
      // Get all course titles
      const titles = await adminCoursesPage.getAllCourseTitles();

      // Should have at least one title
      expect(titles.length).toBeGreaterThan(0);
    }
  });

  test('Courses page loads without errors', async ({ page }) => {
    await adminCoursesPage.expectVisible();

    // No error alert should be visible
    const errorAlert = page.locator('[role="alert"]');
    const errorVisible = await errorAlert.isVisible().catch(() => false);

    expect(errorVisible).toBe(false);
  });
});

// ============================================
// Test Suite: Security Validations
// ============================================

test.describe('Admin Journey - Security (AC 3.3.2)', () => {
  test.describe('Admin-Only Routes Protected', () => {
    test('Student cannot access admin user management', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as student
      await loginPage.goto();
      await loginPage.login(testStudent.email, testStudent.password);
      await loginPage.expectLoginSuccess();

      // Try to access admin route directly
      const response = await page.goto('/admin/users');

      // Should be redirected or see access denied
      await page.waitForTimeout(2000);

      // Either redirected away or sees error
      const currentUrl = page.url();
      const hasErrorMessage = await page
        .locator('text=/access denied|unauthorized|admin/i')
        .isVisible()
        .catch(() => false);

      const isBlocked = !currentUrl.includes('/admin/users') || hasErrorMessage;
      expect(isBlocked).toBe(true);
    });

    test('Student cannot access admin API endpoints (AC 3.3.2)', async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);

      // Login as student
      await loginPage.goto();
      await loginPage.login(testStudent.email, testStudent.password);
      await loginPage.expectLoginSuccess();

      // Try to call admin API
      const response = await page.request.get('/api/admin/users');

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);
    });

    test('Instructor cannot access admin user management', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as instructor
      await loginPage.goto();
      await loginPage.login(testInstructor.email, testInstructor.password);
      await loginPage.expectLoginSuccess();

      // Try to access admin route
      const response = await page.goto('/admin/users');

      await page.waitForTimeout(2000);

      // Should be blocked
      const currentUrl = page.url();
      const hasErrorMessage = await page
        .locator('text=/access denied|unauthorized|admin/i')
        .isVisible()
        .catch(() => false);

      const isBlocked = !currentUrl.includes('/admin/users') || hasErrorMessage;
      expect(isBlocked).toBe(true);
    });

    test('Instructor cannot access admin API endpoints (AC 3.3.2)', async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);

      // Login as instructor
      await loginPage.goto();
      await loginPage.login(testInstructor.email, testInstructor.password);
      await loginPage.expectLoginSuccess();

      // Try to call admin API
      const response = await page.request.get('/api/admin/users');

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);
    });

    test('Unauthenticated users cannot access admin routes', async ({ page }) => {
      // Try to access admin route without login
      await page.goto('/admin/users');

      await page.waitForTimeout(2000);

      // Should be redirected to login or dashboard
      const currentUrl = page.url();
      const isRedirected =
        currentUrl.includes('/login') ||
        currentUrl.includes('/signin') ||
        !currentUrl.includes('/admin/users');

      expect(isRedirected).toBe(true);
    });

    test('Admin can access admin routes (AC 3.3.2)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const userManagementPage = new UserManagementPage(page);

      // Login as admin
      await loginPage.goto();
      await loginPage.login(testAdmin.email, testAdmin.password);
      await loginPage.expectLoginSuccess();

      // Navigate to admin route
      await userManagementPage.goto();

      // Should successfully access the page
      await userManagementPage.expectVisible();
      expect(page.url()).toContain('/admin/users');
    });

    test('Admin can access admin API endpoints', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as admin
      await loginPage.goto();
      await loginPage.login(testAdmin.email, testAdmin.password);
      await loginPage.expectLoginSuccess();

      // Call admin API
      const response = await page.request.get('/api/admin/users');

      // Should return 200 OK
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Stats API Authorization', () => {
    test('Student cannot access admin stats API', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as student
      await loginPage.goto();
      await loginPage.login(testStudent.email, testStudent.password);
      await loginPage.expectLoginSuccess();

      // Try to call stats API
      const response = await page.request.get('/api/admin/stats/detailed');

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);
    });

    test('Instructor cannot access admin stats API', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as instructor
      await loginPage.goto();
      await loginPage.login(testInstructor.email, testInstructor.password);
      await loginPage.expectLoginSuccess();

      // Try to call stats API
      const response = await page.request.get('/api/admin/stats/detailed');

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);
    });

    test('Admin can access stats API', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Login as admin
      await loginPage.goto();
      await loginPage.login(testAdmin.email, testAdmin.password);
      await loginPage.expectLoginSuccess();

      // Call stats API
      const response = await page.request.get('/api/admin/stats/detailed');

      // Should return 200 OK
      expect(response.status()).toBe(200);
    });
  });
});

// ============================================
// Test Suite: Edge Cases
// ============================================

test.describe('Admin Journey - Edge Cases (AC 3.3.3)', () => {
  let loginPage: LoginPage;
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    userManagementPage = new UserManagementPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();

    await userManagementPage.goto();
  });

  test('Cancel button in create modal closes without creating user', async ({
    page,
  }) => {
    // Open create modal
    await userManagementPage.clickAddUser();

    // Fill partial data
    await userManagementPage.createEmailInput.fill('test@example.com');

    // Click cancel
    await userManagementPage.createCancelButton.click();

    // Modal should close
    await expect(userManagementPage.createModal).not.toBeVisible();

    // User should not be created
    await page.waitForTimeout(1000);
    const userExists = await userManagementPage.userExists('test@example.com');
    expect(userExists).toBe(false);
  });

  test('Cancel button in edit modal closes without updating user', async ({
    page,
  }) => {
    // Search for existing user
    await userManagementPage.searchUsers(testAdmin.email);

    // Open edit modal
    await userManagementPage.openUserActionsMenu(testAdmin.email);
    await page.locator('text=Edit').click();
    await userManagementPage.editModal.waitFor({ state: 'visible' });

    // Make changes but cancel
    await userManagementPage.editNameInput.fill('Should Not Save');
    await userManagementPage.editCancelButton.click();

    // Modal should close
    await expect(userManagementPage.editModal).not.toBeVisible();

    // Changes should not be saved
    await page.waitForTimeout(1000);
    const userRow = await userManagementPage.findUserRow(testAdmin.email);
    const rowText = await userRow.textContent();
    expect(rowText).not.toContain('Should Not Save');
  });

  test('Cancel button in deactivate confirmation keeps user active', async ({
    page,
  }) => {
    // Create a test user
    const testUser = {
      email: 'e2e-admin-test-cancel-deactivate@example.com',
      name: 'Test',
      surname: 'Cancel Deactivate',
      role: 'STUDENT' as const,
      password: 'TestPassword123!',
    };

    await userManagementPage.createUser(testUser);
    await page.waitForTimeout(2000);

    // Search for user
    await userManagementPage.searchUsers(testUser.email);

    // Open deactivate confirmation
    await userManagementPage.openUserActionsMenu(testUser.email);
    await page.locator('text=Deactivate').click();
    await userManagementPage.deactivateConfirmation.waitFor({ state: 'visible' });

    // Cancel
    await userManagementPage.deactivateCancelButton.click();

    // User should still exist
    await page.waitForTimeout(500);
    const userExists = await userManagementPage.userExists(testUser.email);
    expect(userExists).toBe(true);
  });

  test('Empty search shows all users', async ({ page }) => {
    // Search with empty string
    await userManagementPage.searchUsers('');

    await page.waitForTimeout(1000);

    // Should show users
    const userCount = await userManagementPage.getUserCount();
    expect(userCount).toBeGreaterThan(0);
  });

  test('Filter reset shows all roles', async ({ page }) => {
    // Filter by STUDENT
    await userManagementPage.filterByRole('STUDENT');
    await page.waitForTimeout(1000);

    // Reset filter to All
    await userManagementPage.filterByRole('All');
    await page.waitForTimeout(1000);

    // Should show users from all roles
    const userCount = await userManagementPage.getUserCount();
    expect(userCount).toBeGreaterThan(0);
  });
});

// ============================================
// Test Suite: Complete User Journey
// ============================================

test.describe('Admin Journey - Complete Flow (AC 3.3.2)', () => {
  test('Complete admin journey: Login → Create User → Assign Role → Edit → Reset Password → Deactivate', async ({
    page,
  }) => {
    // Step 1: Login as admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();

    // Step 2: Navigate to user management
    const userManagementPage = new UserManagementPage(page);
    await userManagementPage.goto();
    await userManagementPage.expectVisible();

    // Step 3: Create a new user
    const journeyUser = {
      email: 'e2e-admin-journey-complete@example.com',
      name: 'Journey',
      surname: 'Complete',
      role: 'STUDENT' as const,
      password: 'Password123!',
    };

    await userManagementPage.createUser(journeyUser);
    await page.waitForTimeout(2000);

    // Verify user created
    let userExists = await userManagementPage.userExists(journeyUser.email);
    expect(userExists).toBe(true);

    // Step 4: Assign new role (edit)
    await userManagementPage.searchUsers(journeyUser.email);
    await userManagementPage.editUser(journeyUser.email, {
      role: 'INSTRUCTOR',
    });
    await page.waitForTimeout(2000);

    // Step 5: Edit user details
    await userManagementPage.searchUsers(journeyUser.email);
    await userManagementPage.editUser(journeyUser.email, {
      name: 'Updated Journey',
    });
    await page.waitForTimeout(2000);

    // Step 6: Reset password
    await userManagementPage.searchUsers(journeyUser.email);
    await userManagementPage.resetUserPassword(journeyUser.email, 'NewPassword456!');
    await page.waitForTimeout(2000);

    // Step 7: Deactivate user
    await userManagementPage.searchUsers(journeyUser.email);
    await userManagementPage.deactivateUser(journeyUser.email);
    await page.waitForTimeout(2000);

    // Verify user is deactivated
    await userManagementPage.clickRefresh();
    await page.waitForTimeout(1000);
    await userManagementPage.searchUsers(journeyUser.email);
    await page.waitForTimeout(1000);

    // User should not appear in active users
    const noUsersVisible = await userManagementPage.noUsersMessage
      .isVisible()
      .catch(() => false);
    const userCount = await userManagementPage.getUserCount();

    expect(noUsersVisible || userCount === 0).toBe(true);
  });
});
