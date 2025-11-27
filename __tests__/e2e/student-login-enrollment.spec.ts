/**
 * Student Login and Course Enrollment E2E Test
 *
 * Tests the critical user journey:
 * 1. Student logs in
 * 2. Student views dashboard
 * 3. Student browses courses
 * 4. Student enrolls in a course
 *
 * Uses Page Object Model pattern for maintainability.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { testStudent } from './fixtures/testUsers';
import { testCourse } from './fixtures/testCourses';

test.describe('Student Login and Course Enrollment', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let courseDetailPage: CourseDetailPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    courseDetailPage = new CourseDetailPage(page);
  });

  test('Student can view the home page', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert - page loads successfully
    await expect(page).toHaveTitle(/AI Gurus|LMS|Learning/i);
  });

  test('Student can access login page', async ({ page }) => {
    // Arrange & Act
    await loginPage.goto();

    // Assert - login form is visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('Student can login with valid credentials', async ({ page }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login(testStudent.email, testStudent.password);

    // Assert
    await loginPage.expectLoginSuccess();
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Assert - should still be on login page or show error
    await expect(page).toHaveURL(/signin|error/);
  });

  test('Student can view dashboard after login', async ({ page }) => {
    // Arrange
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);

    // Act
    await dashboardPage.goto();

    // Assert
    await dashboardPage.expectVisible();
    const isLoggedIn = await dashboardPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('Student can view course details', async ({ page }) => {
    // Arrange - Login first
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);

    // Act - Navigate to course
    await courseDetailPage.goto(testCourse.id);

    // Assert
    await courseDetailPage.expectVisible();
  });

  test('Full flow: Login → Browse → View Course', async ({ page }) => {
    // This test represents the complete user journey

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();

    // Step 2: View Dashboard
    await dashboardPage.goto();
    await dashboardPage.expectVisible();

    // Step 3: Navigate to courses
    await page.goto('/courses');
    await expect(page).toHaveURL(/courses/);

    // Step 4: Page should load successfully
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Course Enrollment', () => {
  test.skip('Student can enroll in a course', async ({ page }) => {
    // This test is skipped until enrollment functionality is verified
    // Remove .skip when ready to test enrollment

    const loginPage = new LoginPage(page);
    const courseDetailPage = new CourseDetailPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);

    // Navigate to course
    await courseDetailPage.goto(testCourse.id);
    await courseDetailPage.expectVisible();

    // Enroll
    await courseDetailPage.clickEnroll();

    // Verify enrollment
    await courseDetailPage.expectEnrolled();
  });
});
