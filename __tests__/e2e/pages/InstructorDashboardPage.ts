/**
 * Instructor Dashboard Page Object
 *
 * Encapsulates interactions with the instructor dashboard and courses listing.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class InstructorDashboardPage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly createCourseButton: Locator;
  readonly courseCards: Locator;
  readonly noCourseMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1:has-text("My Courses")');
    this.createCourseButton = page.locator('a[href="/instructor/courses/new"]');
    this.courseCards = page.locator('[data-testid="course-card"], .bg-white.shadow.rounded-lg');
    this.noCourseMessage = page.locator('text=No courses found');
    this.loadingSpinner = page.locator('.animate-spin');
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Navigate to the instructor courses page
   */
  async goto(): Promise<void> {
    await this.page.goto('/instructor/courses');
    await this.waitForLoad();
  }

  /**
   * Wait for courses to load
   */
  async waitForCoursesLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {
      // Loading spinner may not be present
    });
  }

  /**
   * Expect dashboard to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  /**
   * Click create course button
   */
  async clickCreateCourse(): Promise<void> {
    await this.createCourseButton.click();
    await this.page.waitForURL(/\/instructor\/courses\/new/);
  }

  /**
   * Get count of course cards
   */
  async getCourseCount(): Promise<number> {
    await this.waitForCoursesLoad();
    return await this.courseCards.count();
  }

  /**
   * Check if no courses message is visible
   */
  async hasNoCourses(): Promise<boolean> {
    return await this.noCourseMessage.isVisible().catch(() => false);
  }

  /**
   * Click on a course card by title
   */
  async clickCourseByTitle(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).first().click();
  }

  /**
   * Verify a course appears in the list
   */
  async expectCourseVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`).first()).toBeVisible();
  }

  /**
   * Get course card by title
   */
  getCourseCard(title: string): Locator {
    return this.page.locator('.bg-white.shadow.rounded-lg').filter({ hasText: title });
  }

  /**
   * Navigate to course details
   */
  async goToCourseDetails(courseId: string): Promise<void> {
    await this.page.goto(`/instructor/courses/${courseId}`);
    await this.waitForLoad();
  }
}
