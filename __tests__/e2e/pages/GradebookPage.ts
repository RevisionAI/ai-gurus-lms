/**
 * Gradebook Page Object (Student View)
 *
 * Encapsulates interactions with the student gradebook/grades page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class GradebookPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly courseSelector: Locator;
  readonly gradeTable: Locator;
  readonly gradeRows: Locator;
  readonly gpaDisplay: Locator;
  readonly gpaValue: Locator;
  readonly letterGrade: Locator;
  readonly assignmentGrades: Locator;
  readonly feedbackLinks: Locator;
  readonly noGradesMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.locator('h1');
    this.courseSelector = page.locator('select[name="course"], [data-testid="course-selector"]');
    this.gradeTable = page.locator('table, [data-testid="grades-table"]');
    this.gradeRows = page.locator('table tbody tr, [data-testid="grade-row"]');
    this.gpaDisplay = page.locator('[data-testid="gpa-display"], text=/GPA:/');
    this.gpaValue = page.locator('[data-testid="gpa-value"], .gpa-value');
    this.letterGrade = page.locator('[data-testid="letter-grade"], .letter-grade');
    this.assignmentGrades = page.locator('[data-testid="assignment-grade"], .assignment-grade');
    this.feedbackLinks = page.locator('a:has-text("View Feedback"), [data-testid="view-feedback"]');
    this.noGradesMessage = page.locator('text=No grades yet, text=No grades available');
  }

  /**
   * Navigate to the gradebook page (general)
   */
  async goto(): Promise<void> {
    await this.page.goto('/gradebook');
    await this.waitForLoad();
  }

  /**
   * Navigate to gradebook for a specific course
   */
  async gotoForCourse(courseId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}/grades`);
    await this.waitForLoad();
  }

  /**
   * Expect gradebook page to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Select a specific course from dropdown
   */
  async selectCourse(courseName: string): Promise<void> {
    if (await this.courseSelector.isVisible()) {
      await this.courseSelector.selectOption({ label: courseName });
      await this.waitForLoad();
    }
  }

  /**
   * Get GPA value displayed
   */
  async getGPA(): Promise<string | null> {
    try {
      await this.gpaValue.waitFor({ state: 'visible', timeout: 5000 });
      const text = await this.gpaValue.textContent();
      return text?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Get letter grade displayed
   */
  async getLetterGrade(): Promise<string | null> {
    try {
      await this.letterGrade.waitFor({ state: 'visible', timeout: 3000 });
      const text = await this.letterGrade.textContent();
      return text?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if GPA is displayed
   */
  async isGPADisplayed(): Promise<boolean> {
    try {
      await this.gpaDisplay.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expect GPA to be displayed
   */
  async expectGPADisplayed(): Promise<void> {
    await expect(this.gpaDisplay).toBeVisible();
  }

  /**
   * Get count of graded assignments
   */
  async getGradeCount(): Promise<number> {
    await this.page.waitForTimeout(1000); // Wait for grades to load
    return await this.assignmentGrades.count();
  }

  /**
   * Get all assignment grades
   */
  async getAllGrades(): Promise<string[]> {
    const count = await this.getGradeCount();
    const grades: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.assignmentGrades.nth(i).textContent();
      if (text) grades.push(text.trim());
    }

    return grades;
  }

  /**
   * Click on feedback link for an assignment
   */
  async viewFeedback(assignmentTitle: string): Promise<void> {
    await this.page.locator(`tr:has-text("${assignmentTitle}") a:has-text("Feedback")`).click();
    await this.waitForLoad();
  }

  /**
   * Check if any grades are displayed
   */
  async hasGrades(): Promise<boolean> {
    const count = await this.getGradeCount();
    return count > 0;
  }

  /**
   * Expect grades to be visible
   */
  async expectGradesVisible(): Promise<void> {
    await expect(this.assignmentGrades.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Expect no grades message
   */
  async expectNoGrades(): Promise<void> {
    await expect(this.noGradesMessage).toBeVisible();
  }

  /**
   * Get grade for a specific assignment
   */
  async getGradeForAssignment(assignmentTitle: string): Promise<string | null> {
    const gradeCell = this.page.locator(`tr:has-text("${assignmentTitle}") [data-testid="grade"], tr:has-text("${assignmentTitle}") td:nth-child(2)`);

    try {
      await gradeCell.waitFor({ state: 'visible', timeout: 3000 });
      return gradeCell.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if feedback is available for an assignment
   */
  async hasFeedbackForAssignment(assignmentTitle: string): Promise<boolean> {
    const feedbackLink = this.page.locator(`tr:has-text("${assignmentTitle}") a:has-text("Feedback")`);

    try {
      await feedbackLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
