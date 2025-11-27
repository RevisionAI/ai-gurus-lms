/**
 * Base Page Object
 *
 * Base class for all Page Objects.
 * Provides common navigation and utility methods.
 */

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for page to load completely
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForVisible(locator: Locator, timeout = 5000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  /**
   * Get text content of an element
   */
  async getText(locator: Locator): Promise<string | null> {
    return locator.textContent();
  }

  /**
   * Click an element
   */
  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  /**
   * Fill an input field
   */
  async fill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  /**
   * Press a key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }
}
