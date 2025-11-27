/**
 * Login Page Object
 *
 * Encapsulates interactions with the NextAuth login page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signInWithCredentials: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]');
    this.signInWithCredentials = page.locator('text=Sign in with Credentials');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/api/auth/signin');
    await this.waitForLoad();
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string): Promise<void> {
    // If there are multiple providers, click on Credentials
    if (await this.signInWithCredentials.isVisible()) {
      await this.signInWithCredentials.click();
    }

    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Expect successful login (redirected away from login page)
   */
  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).not.toHaveURL(/signin/);
  }

  /**
   * Expect login failure (error message displayed)
   */
  async expectLoginFailure(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  /**
   * Check if currently on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/signin');
  }
}
