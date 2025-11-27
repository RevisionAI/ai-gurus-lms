/**
 * Course Catalog Page Object
 *
 * Encapsulates interactions with the course catalog/browse page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CourseCatalogPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly courseCards: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly noCoursesMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.locator('h1');
    this.courseCards = page.locator('[data-testid="course-card"], .course-card, a[href^="/courses/"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    this.filterDropdown = page.locator('select, [data-testid="filter-dropdown"]');
    this.noCoursesMessage = page.locator('text=No courses found, text=No courses available');
  }

  /**
   * Navigate to the course catalog page
   */
  async goto(): Promise<void> {
    await this.page.goto('/courses');
    await this.waitForLoad();
  }

  /**
   * Expect catalog page to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Get all visible course cards
   */
  async getCourseCards(): Promise<Locator> {
    return this.courseCards;
  }

  /**
   * Get count of courses displayed
   */
  async getCourseCount(): Promise<number> {
    await this.page.waitForTimeout(1000); // Wait for courses to load
    return await this.courseCards.count();
  }

  /**
   * Click on a specific course card by title
   */
  async clickCourseByTitle(courseTitle: string): Promise<void> {
    await this.page.locator(`text=${courseTitle}`).first().click();
    await this.waitForLoad();
  }

  /**
   * Click on a course card by index
   */
  async clickCourseByIndex(index: number): Promise<void> {
    await this.courseCards.nth(index).click();
    await this.waitForLoad();
  }

  /**
   * Search for courses by query
   */
  async searchCourses(query: string): Promise<void> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.page.keyboard.press('Enter');
      await this.waitForLoad();
    }
  }

  /**
   * Check if any courses are displayed
   */
  async hasCoursesDisplayed(): Promise<boolean> {
    const count = await this.getCourseCount();
    return count > 0;
  }

  /**
   * Expect at least one course to be visible
   */
  async expectCoursesVisible(): Promise<void> {
    await expect(this.courseCards.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Expect no courses message to be visible
   */
  async expectNoCourses(): Promise<void> {
    await expect(this.noCoursesMessage).toBeVisible();
  }
}
