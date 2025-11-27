/**
 * Authentication Helpers for E2E Tests
 *
 * Provides utilities for handling authentication in Playwright tests.
 */

import { Page, BrowserContext } from '@playwright/test';
import { testStudent, testInstructor, testAdmin } from '../fixtures/testUsers';

/**
 * Login as a specific user
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/api/auth/signin');

  // Wait for the login form to be visible
  await page.waitForSelector('input[name="email"]', { state: 'visible' });

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for redirect to complete
  await page.waitForURL((url) => !url.pathname.includes('/signin'), {
    timeout: 10000,
  });
}

/**
 * Login as the test student
 */
export async function loginAsStudent(page: Page): Promise<void> {
  await login(page, testStudent.email, testStudent.password);
}

/**
 * Login as the test instructor
 */
export async function loginAsInstructor(page: Page): Promise<void> {
  await login(page, testInstructor.email, testInstructor.password);
}

/**
 * Login as the test admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, testAdmin.email, testAdmin.password);
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/api/auth/signout');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

/**
 * Save authentication state to file for reuse across tests
 */
export async function saveAuthState(
  context: BrowserContext,
  filename: string
): Promise<void> {
  await context.storageState({ path: `__tests__/e2e/.auth/${filename}.json` });
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for session cookie or authenticated UI elements
  const cookies = await page.context().cookies();
  return cookies.some(
    (cookie) =>
      cookie.name.includes('session') || cookie.name.includes('auth')
  );
}
