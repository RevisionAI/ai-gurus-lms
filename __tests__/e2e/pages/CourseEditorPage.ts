/**
 * Course Editor Page Object
 *
 * Encapsulates interactions with the course creation/editing form.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CourseEditorPage extends BasePage {
  // Form field locators
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly codeInput: Locator;
  readonly semesterSelect: Locator;
  readonly yearInput: Locator;
  readonly prerequisitesTextarea: Locator;
  readonly targetAudienceTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorAlert: Locator;
  readonly loadingSpinner: Locator;

  // Learning objectives
  readonly addObjectiveButton: Locator;
  readonly objectiveInputs: Locator;
  readonly removeObjectiveButtons: Locator;

  // Assignment creation (when on course detail page)
  readonly createAssignmentButton: Locator;
  readonly assignmentTitleInput: Locator;
  readonly assignmentDescriptionTextarea: Locator;
  readonly assignmentDueDateInput: Locator;
  readonly assignmentMaxPointsInput: Locator;
  readonly assignmentSubmitButton: Locator;

  // Enrollment management
  readonly enrollStudentButton: Locator;
  readonly studentEmailInput: Locator;
  readonly enrollButton: Locator;
  readonly enrollmentsList: Locator;

  // Announcements
  readonly createAnnouncementButton: Locator;
  readonly announcementTitleInput: Locator;
  readonly announcementContentTextarea: Locator;
  readonly announcementSubmitButton: Locator;

  constructor(page: Page) {
    super(page);

    // Course form fields
    this.titleInput = page.locator('input[name="title"], input#title');
    this.descriptionTextarea = page.locator('textarea[name="description"], textarea#description');
    this.codeInput = page.locator('input[name="code"], input#code');
    this.semesterSelect = page.locator('select[name="semester"], select#semester');
    this.yearInput = page.locator('input[name="year"], input#year');
    this.prerequisitesTextarea = page.locator('textarea[name="prerequisites"], textarea#prerequisites');
    this.targetAudienceTextarea = page.locator('textarea[name="targetAudience"], textarea#targetAudience');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('a:has-text("Cancel"), button:has-text("Cancel")');
    this.errorAlert = page.locator('[role="alert"], .text-red-700');
    this.loadingSpinner = page.locator('.animate-spin');

    // Learning objectives
    this.addObjectiveButton = page.locator('button:has-text("Add Objective"), button:has-text("Add Learning Objective")');
    this.objectiveInputs = page.locator('input[placeholder*="objective"], input[type="text"][name*="objective"]');
    this.removeObjectiveButtons = page.locator('button[aria-label*="Remove objective"], button:has-text("Remove")');

    // Assignment creation
    this.createAssignmentButton = page.locator('a:has-text("Create Assignment"), button:has-text("Create Assignment")');
    this.assignmentTitleInput = page.locator('input[name="title"]#assignment-title, input[placeholder*="Assignment Title"]');
    this.assignmentDescriptionTextarea = page.locator('textarea[name="description"]#assignment-description');
    this.assignmentDueDateInput = page.locator('input[type="datetime-local"], input[name="dueDate"]');
    this.assignmentMaxPointsInput = page.locator('input[name="maxPoints"], input[placeholder*="points"]');
    this.assignmentSubmitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save Assignment")');

    // Enrollment
    this.enrollStudentButton = page.locator('button:has-text("Enroll Student"), a:has-text("Enroll Student")');
    this.studentEmailInput = page.locator('input[name="email"], input[placeholder*="student email"]');
    this.enrollButton = page.locator('button:has-text("Enroll")');
    this.enrollmentsList = page.locator('[data-testid="enrollments-list"], .enrollments');

    // Announcements
    this.createAnnouncementButton = page.locator('a:has-text("New Announcement"), button:has-text("Create Announcement")');
    this.announcementTitleInput = page.locator('input[name="title"]#announcement-title');
    this.announcementContentTextarea = page.locator('textarea[name="content"], .tox-edit-area');
    this.announcementSubmitButton = page.locator('button[type="submit"]:has-text("Post"), button:has-text("Create Announcement")');
  }

  /**
   * Navigate to new course creation page
   */
  async gotoNew(): Promise<void> {
    await this.page.goto('/instructor/courses/new');
    await this.waitForLoad();
  }

  /**
   * Navigate to course edit page
   */
  async gotoEdit(courseId: string): Promise<void> {
    await this.page.goto(`/instructor/courses/${courseId}/edit`);
    await this.waitForLoad();
  }

  /**
   * Navigate to course detail page
   */
  async gotoCourseDetail(courseId: string): Promise<void> {
    await this.page.goto(`/instructor/courses/${courseId}`);
    await this.waitForLoad();
  }

  /**
   * Fill course form with data
   */
  async fillCourseForm(data: {
    title: string;
    description: string;
    code: string;
    semester: string;
    year: number;
    prerequisites?: string;
    targetAudience?: string;
    learningObjectives?: string[];
  }): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.descriptionTextarea.fill(data.description);
    await this.codeInput.fill(data.code);
    await this.semesterSelect.selectOption(data.semester);
    await this.yearInput.fill(data.year.toString());

    if (data.prerequisites) {
      await this.prerequisitesTextarea.fill(data.prerequisites);
    }

    if (data.targetAudience) {
      await this.targetAudienceTextarea.fill(data.targetAudience);
    }

    // Fill learning objectives
    if (data.learningObjectives && data.learningObjectives.length > 0) {
      for (let i = 0; i < data.learningObjectives.length; i++) {
        if (i > 0) {
          // Add new objective field if not the first one
          await this.addObjectiveButton.click();
          await this.page.waitForTimeout(200); // Wait for new input to appear
        }

        const objectiveInput = this.objectiveInputs.nth(i);
        await objectiveInput.fill(data.learningObjectives[i]);
      }
    }
  }

  /**
   * Submit course form
   */
  async submitCourse(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a complete course (fill form + submit)
   */
  async createCourse(data: {
    title: string;
    description: string;
    code: string;
    semester: string;
    year: number;
    prerequisites?: string;
    targetAudience?: string;
    learningObjectives?: string[];
  }): Promise<void> {
    await this.fillCourseForm(data);
    await this.submitCourse();
  }

  /**
   * Expect form validation error
   */
  async expectError(message: string): Promise<void> {
    await expect(this.errorAlert).toContainText(message);
  }

  /**
   * Expect successful redirect to course detail
   */
  async expectCourseCreated(): Promise<void> {
    await expect(this.page).toHaveURL(/\/instructor\/courses\/[a-zA-Z0-9-]+$/);
  }

  /**
   * Create an assignment for a course
   */
  async createAssignment(data: {
    title: string;
    description: string;
    dueDate: string; // ISO format or datetime-local format
    maxPoints: number;
  }): Promise<void> {
    // Navigate to assignments page if not already there
    if (!this.page.url().includes('/assignments')) {
      await this.createAssignmentButton.click();
      await this.page.waitForURL(/\/assignments\/new/);
    }

    await this.assignmentTitleInput.fill(data.title);
    await this.assignmentDescriptionTextarea.fill(data.description);
    await this.assignmentDueDateInput.fill(data.dueDate);
    await this.assignmentMaxPointsInput.fill(data.maxPoints.toString());
    await this.assignmentSubmitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enroll a student in the course
   */
  async enrollStudent(email: string): Promise<void> {
    await this.enrollStudentButton.click();
    await this.studentEmailInput.waitFor({ state: 'visible' });
    await this.studentEmailInput.fill(email);
    await this.enrollButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create an announcement
   */
  async createAnnouncement(title: string, content: string): Promise<void> {
    await this.createAnnouncementButton.click();
    await this.page.waitForURL(/\/announcements/);

    await this.announcementTitleInput.fill(title);

    // Handle TinyMCE editor if present
    const isTinyMCE = await this.page.locator('.tox-tinymce').isVisible().catch(() => false);
    if (isTinyMCE) {
      await this.page.locator('iframe.tox-edit-area__iframe').contentFrame()
        .locator('body').fill(content);
    } else {
      await this.announcementContentTextarea.fill(content);
    }

    await this.announcementSubmitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify enrollment list contains student
   */
  async expectStudentEnrolled(name: string): Promise<void> {
    await expect(this.enrollmentsList.locator(`text=${name}`)).toBeVisible();
  }

  /**
   * Get count of enrollments
   */
  async getEnrollmentCount(): Promise<number> {
    const enrollmentItems = this.enrollmentsList.locator('li, tr, .enrollment-item');
    return await enrollmentItems.count();
  }

  /**
   * Publish a course (toggle published state)
   */
  async publishCourse(): Promise<void> {
    const publishButton = this.page.locator('button:has-text("Publish"), input[type="checkbox"][name*="publish"]');
    await publishButton.click();
    await this.page.waitForTimeout(500); // Wait for state update
  }
}
