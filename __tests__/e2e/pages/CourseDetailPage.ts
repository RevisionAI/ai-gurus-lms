/**
 * Course Detail Page Object
 *
 * Encapsulates interactions with the course detail page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CourseDetailPage extends BasePage {
  // Locators
  readonly courseTitle: Locator;
  readonly courseDescription: Locator;
  readonly enrollButton: Locator;
  readonly enrolledBadge: Locator;
  readonly contentList: Locator;
  readonly assignmentsList: Locator;
  readonly instructorName: Locator;
  readonly announcementsList: Locator;

  constructor(page: Page) {
    super(page);
    this.courseTitle = page.locator('h1, [data-testid="course-title"]');
    this.courseDescription = page.locator('[data-testid="course-description"], .course-description');
    this.enrollButton = page.locator('button:has-text("Enroll"), [data-testid="enroll-button"]');
    this.enrolledBadge = page.locator('text=Enrolled, [data-testid="enrolled-badge"]');
    this.contentList = page.locator('[data-testid="content-list"], .content-list');
    this.assignmentsList = page.locator('[data-testid="assignments-list"], .assignments-list');
    this.instructorName = page.locator('[data-testid="instructor-name"], .instructor-name');
    this.announcementsList = page.locator('[data-testid="announcements"], .announcements');
  }

  /**
   * Navigate to a specific course by ID
   */
  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}`);
    await this.waitForLoad();
  }

  /**
   * Expect course detail page to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.courseTitle).toBeVisible();
  }

  /**
   * Click the enroll button
   */
  async clickEnroll(): Promise<void> {
    await this.enrollButton.click();
  }

  /**
   * Expect enrollment to be successful
   */
  async expectEnrolled(): Promise<void> {
    // Wait for either the enrolled badge to appear or the enroll button to disappear
    await expect(
      this.page.locator('text=Enrolled, text=You are enrolled, text=Unenroll')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if user is enrolled in the course
   */
  async isEnrolled(): Promise<boolean> {
    return this.enrolledBadge.isVisible();
  }

  /**
   * Get the course title text
   */
  async getTitle(): Promise<string | null> {
    return this.courseTitle.textContent();
  }

  /**
   * Get list of assignments
   */
  async getAssignments(): Promise<Locator> {
    return this.assignmentsList;
  }

  /**
   * Click on an assignment by title
   */
  async clickAssignment(assignmentTitle: string): Promise<void> {
    await this.page.locator(`text=${assignmentTitle}`).click();
  }

  /**
   * Navigate to course content tab
   */
  async goToContent(): Promise<void> {
    await this.page.locator('text=Content, text=Modules').first().click();
  }

  /**
   * Navigate to assignments tab
   */
  async goToAssignments(): Promise<void> {
    await this.page.locator('text=Assignments').first().click();
  }
}
