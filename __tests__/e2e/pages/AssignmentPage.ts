/**
 * Assignment Page Object
 *
 * Encapsulates interactions with the assignment submission page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AssignmentPage extends BasePage {
  // Locators
  readonly assignmentTitle: Locator;
  readonly assignmentDescription: Locator;
  readonly dueDate: Locator;
  readonly maxPoints: Locator;
  readonly textSubmissionInput: Locator;
  readonly fileUploadInput: Locator;
  readonly submitButton: Locator;
  readonly submissionConfirmation: Locator;
  readonly submittedStatus: Locator;
  readonly submittedText: Locator;
  readonly submittedFile: Locator;
  readonly gradeDisplay: Locator;
  readonly feedbackDisplay: Locator;
  readonly lateSubmissionWarning: Locator;

  constructor(page: Page) {
    super(page);
    this.assignmentTitle = page.locator('h1, [data-testid="assignment-title"]');
    this.assignmentDescription = page.locator('[data-testid="assignment-description"], .assignment-description');
    this.dueDate = page.locator('[data-testid="due-date"], text=/Due:/, text=/Deadline:/');
    this.maxPoints = page.locator('[data-testid="max-points"], text=/Points:/, text=/pts/');
    this.textSubmissionInput = page.locator('textarea[name="text"], textarea[name="submission"], [data-testid="text-submission"]');
    this.fileUploadInput = page.locator('input[type="file"]');
    this.submitButton = page.locator('button:has-text("Submit"), [data-testid="submit-assignment"]');
    this.submissionConfirmation = page.locator('text=submitted successfully, text=Submission received, [data-testid="submission-success"]');
    this.submittedStatus = page.locator('text=Submitted, text=Already submitted, [data-testid="submitted-badge"]');
    this.submittedText = page.locator('[data-testid="submitted-text"], .submitted-content');
    this.submittedFile = page.locator('[data-testid="submitted-file"], .submitted-file a');
    this.gradeDisplay = page.locator('[data-testid="grade"], text=/Grade:/, text=/Score:/');
    this.feedbackDisplay = page.locator('[data-testid="feedback"], .feedback');
    this.lateSubmissionWarning = page.locator('text=late, text=past due, [data-testid="late-warning"]');
  }

  /**
   * Navigate to a specific assignment by course and assignment ID
   */
  async gotoAssignment(courseId: string, assignmentId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}/assignments/${assignmentId}`);
    await this.waitForLoad();
  }

  /**
   * Expect assignment page to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.assignmentTitle).toBeVisible();
  }

  /**
   * Get assignment title text
   */
  async getTitle(): Promise<string | null> {
    return this.assignmentTitle.textContent();
  }

  /**
   * Submit text-only assignment
   */
  async submitTextOnly(text: string): Promise<void> {
    await this.textSubmissionInput.waitFor({ state: 'visible' });
    await this.textSubmissionInput.fill(text);
    await this.submitButton.click();
  }

  /**
   * Submit assignment with file upload
   */
  async submitWithFile(filePath: string, text?: string): Promise<void> {
    // Fill text if provided
    if (text) {
      await this.textSubmissionInput.waitFor({ state: 'visible' });
      await this.textSubmissionInput.fill(text);
    }

    // Upload file
    await this.fileUploadInput.setInputFiles(filePath);

    // Wait for upload to process (if there's a progress indicator)
    await this.page.waitForTimeout(1000);

    // Submit
    await this.submitButton.click();
  }

  /**
   * Submit assignment with text and file
   */
  async submitComplete(text: string, filePath: string): Promise<void> {
    await this.submitWithFile(filePath, text);
  }

  /**
   * Expect submission to be successful
   */
  async expectSubmissionSuccess(): Promise<void> {
    await expect(
      this.page.locator('text=submitted, text=success, text=received')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expect submission confirmation message
   */
  async expectConfirmationMessage(): Promise<void> {
    await expect(this.submissionConfirmation).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if assignment has been submitted
   */
  async isSubmitted(): Promise<boolean> {
    try {
      await this.submittedStatus.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the submitted text content
   */
  async getSubmittedText(): Promise<string | null> {
    if (await this.isSubmitted()) {
      return this.submittedText.textContent();
    }
    return null;
  }

  /**
   * Check if a file was submitted
   */
  async hasSubmittedFile(): Promise<boolean> {
    try {
      await this.submittedFile.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get grade if available
   */
  async getGrade(): Promise<string | null> {
    try {
      await this.gradeDisplay.waitFor({ state: 'visible', timeout: 3000 });
      return this.gradeDisplay.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get feedback if available
   */
  async getFeedback(): Promise<string | null> {
    try {
      await this.feedbackDisplay.waitFor({ state: 'visible', timeout: 3000 });
      return this.feedbackDisplay.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if late submission warning is displayed
   */
  async hasLateWarning(): Promise<boolean> {
    try {
      await this.lateSubmissionWarning.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expect late submission warning
   */
  async expectLateWarning(): Promise<void> {
    await expect(this.lateSubmissionWarning).toBeVisible();
  }

  /**
   * Expect submit button to be disabled (already submitted)
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }
}
