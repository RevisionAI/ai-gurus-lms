/**
 * Admin Courses Page Object
 *
 * Encapsulates interactions with the admin courses view for E2E testing.
 * Follows Page Object Model pattern.
 *
 * Story: 3.3 - E2E Tests - Admin Journey
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminCoursesPage extends BasePage {
  // Page URL
  readonly url = '/courses'; // Admin views all courses from main courses page

  // Page Header
  readonly pageTitle: Locator;
  readonly createCourseButton: Locator;

  // Course List
  readonly courseCards: Locator;
  readonly noCourses: Locator;

  // Course Card Elements
  readonly courseTitle: Locator;
  readonly courseStatus: Locator;
  readonly courseEnrollments: Locator;

  // Course Actions (for admin)
  readonly viewCourseButton: Locator;
  readonly editCourseButton: Locator;

  constructor(page: Page) {
    super(page);

    // Page Header
    this.pageTitle = page.locator('h1:has-text("Courses")');
    this.createCourseButton = page.locator('a[href*="/instructor/courses/new"]');

    // Course List
    this.courseCards = page.locator('[data-testid="course-card"]').or(page.locator('article'));
    this.noCourses = page.locator('text=No courses available');

    // Course Card Elements
    this.courseTitle = page.locator('h2, h3');
    this.courseStatus = page.locator('text=/Active|Inactive/');
    this.courseEnrollments = page.locator('text=/\\d+ enrolled/');

    // Actions
    this.viewCourseButton = page.locator('a:has-text("View Course")');
    this.editCourseButton = page.locator('a:has-text("Edit")');
  }

  /**
   * Navigate to courses page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify page is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.page.locator('h1')).toBeVisible();
  }

  /**
   * Get course count
   */
  async getCourseCount(): Promise<number> {
    // Wait for either courses to load or "no courses" message
    await this.page.waitForTimeout(1000);
    const noCoursesVisible = await this.noCourses.isVisible().catch(() => false);

    if (noCoursesVisible) {
      return 0;
    }

    return await this.courseCards.count();
  }

  /**
   * Find a course card by title
   */
  async findCourseByTitle(title: string): Promise<Locator> {
    return this.page.locator(`article:has-text("${title}"), div:has-text("${title}")`).first();
  }

  /**
   * Check if a course exists
   */
  async courseExists(title: string): Promise<boolean> {
    const course = await this.findCourseByTitle(title);
    return course.isVisible().catch(() => false);
  }

  /**
   * View a specific course
   */
  async viewCourse(title: string): Promise<void> {
    const course = await this.findCourseByTitle(title);
    const viewButton = course.locator('a:has-text("View")').first();
    await viewButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all course titles visible on page
   */
  async getAllCourseTitles(): Promise<string[]> {
    const count = await this.getCourseCount();

    if (count === 0) {
      return [];
    }

    const titles: string[] = [];
    const cards = await this.courseCards.all();

    for (const card of cards) {
      const titleElement = card.locator('h2, h3').first();
      const titleText = await titleElement.textContent();
      if (titleText) {
        titles.push(titleText.trim());
      }
    }

    return titles;
  }

  /**
   * Check if a course is active
   */
  async isCourseActive(title: string): Promise<boolean> {
    const course = await this.findCourseByTitle(title);
    const statusText = await course.textContent();
    return statusText?.toLowerCase().includes('active') || false;
  }
}
