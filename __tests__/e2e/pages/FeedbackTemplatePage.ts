/**
 * Feedback Template Page Object
 *
 * Encapsulates interactions with the instructor feedback templates page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FeedbackTemplatePage extends BasePage {
  // Template list
  readonly templateList: Locator;
  readonly templateCards: Locator;
  readonly noTemplatesMessage: Locator;

  // Create/Edit template
  readonly createTemplateButton: Locator;
  readonly templateNameInput: Locator;
  readonly templateContentTextarea: Locator;
  readonly templateCategorySelect: Locator;
  readonly saveTemplateButton: Locator;
  readonly cancelButton: Locator;

  // Template actions
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly applyButtons: Locator;

  // Template application
  readonly applyTemplateDialog: Locator;
  readonly studentSelect: Locator;
  readonly assignmentSelect: Locator;
  readonly applyConfirmButton: Locator;

  // Status
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  // Template categories
  readonly categoryFilter: Locator;
  readonly categories: {
    excellent: Locator;
    good: Locator;
    needsImprovement: Locator;
    incomplete: Locator;
  };

  constructor(page: Page) {
    super(page);

    // Template list
    this.templateList = page.locator('[data-testid="template-list"], .template-list');
    this.templateCards = page.locator('[data-testid="template-card"], .template-card');
    this.noTemplatesMessage = page.locator('text=No templates found, text=No feedback templates');

    // Create/Edit
    this.createTemplateButton = page.locator('button:has-text("Create Template"), a:has-text("New Template")');
    this.templateNameInput = page.locator('input[name="name"], input#template-name');
    this.templateContentTextarea = page.locator('textarea[name="content"], textarea#template-content');
    this.templateCategorySelect = page.locator('select[name="category"], select#template-category');
    this.saveTemplateButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create Template")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Actions
    this.editButtons = page.locator('button[aria-label*="Edit"], button:has-text("Edit")');
    this.deleteButtons = page.locator('button[aria-label*="Delete"], button:has-text("Delete")');
    this.applyButtons = page.locator('button:has-text("Apply"), button:has-text("Use Template")');

    // Application dialog
    this.applyTemplateDialog = page.locator('[role="dialog"]:has-text("Apply Template")');
    this.studentSelect = page.locator('select[name="student"], select#student-select');
    this.assignmentSelect = page.locator('select[name="assignment"], select#assignment-select');
    this.applyConfirmButton = page.locator('button:has-text("Apply Template"), button:has-text("Confirm")');

    // Status
    this.successMessage = page.locator('[role="status"]:has-text("Success"), .text-green-700');
    this.errorMessage = page.locator('[role="alert"], .text-red-700');
    this.loadingSpinner = page.locator('.animate-spin');

    // Categories
    this.categoryFilter = page.locator('select[name="categoryFilter"], #category-filter');
    this.categories = {
      excellent: page.locator('[data-category="excellent"], .category-excellent'),
      good: page.locator('[data-category="good"], .category-good'),
      needsImprovement: page.locator('[data-category="needs_improvement"], .category-needs-improvement'),
      incomplete: page.locator('[data-category="incomplete"], .category-incomplete'),
    };
  }

  /**
   * Navigate to feedback templates page
   */
  async goto(): Promise<void> {
    await this.page.goto('/instructor/templates');
    await this.waitForLoad();
  }

  /**
   * Wait for templates to load
   */
  async waitForTemplatesLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {
      // Loading spinner may not be present
    });
  }

  /**
   * Create a new feedback template
   */
  async createTemplate(data: {
    name: string;
    content: string;
    category?: 'excellent' | 'good' | 'needs_improvement' | 'incomplete';
  }): Promise<void> {
    // Click create button
    await this.createTemplateButton.click();
    await this.page.waitForTimeout(300);

    // Fill form
    await this.templateNameInput.fill(data.name);
    await this.templateContentTextarea.fill(data.content);

    if (data.category) {
      await this.templateCategorySelect.selectOption(data.category);
    }

    // Save
    await this.saveTemplateButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get count of templates
   */
  async getTemplateCount(): Promise<number> {
    await this.waitForTemplatesLoad();
    const hasNoTemplates = await this.noTemplatesMessage.isVisible().catch(() => false);
    if (hasNoTemplates) {
      return 0;
    }
    return await this.templateCards.count();
  }

  /**
   * Verify template exists
   */
  async expectTemplateVisible(name: string): Promise<void> {
    await expect(this.templateList.locator(`text=${name}`)).toBeVisible();
  }

  /**
   * Edit a template
   */
  async editTemplate(templateName: string, newData: {
    name?: string;
    content?: string;
    category?: string;
  }): Promise<void> {
    // Find the template and click edit
    const templateCard = this.templateCards.filter({ hasText: templateName });
    await templateCard.locator(this.editButtons).first().click();

    await this.page.waitForTimeout(300);

    // Update fields
    if (newData.name) {
      await this.templateNameInput.fill(newData.name);
    }

    if (newData.content) {
      await this.templateContentTextarea.fill(newData.content);
    }

    if (newData.category) {
      await this.templateCategorySelect.selectOption(newData.category);
    }

    // Save changes
    await this.saveTemplateButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateName: string): Promise<void> {
    // Find the template and click delete
    const templateCard = this.templateCards.filter({ hasText: templateName });
    await templateCard.locator(this.deleteButtons).first().click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    const isConfirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isConfirmVisible) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Apply a template to a submission
   */
  async applyTemplate(templateName: string, data?: {
    studentName?: string;
    assignmentTitle?: string;
  }): Promise<void> {
    // Find the template and click apply
    const templateCard = this.templateCards.filter({ hasText: templateName });
    await templateCard.locator(this.applyButtons).first().click();

    // Wait for application dialog
    await expect(this.applyTemplateDialog).toBeVisible({ timeout: 3000 });

    // Select student and assignment if provided
    if (data?.studentName) {
      await this.studentSelect.selectOption({ label: data.studentName });
    }

    if (data?.assignmentTitle) {
      await this.assignmentSelect.selectOption({ label: data.assignmentTitle });
    }

    // Confirm application
    await this.applyConfirmButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Apply template directly from gradebook context
   * (This assumes the template can be applied from gradebook page)
   */
  async applyTemplateFromGradebook(templateName: string): Promise<void> {
    // Look for template selector/dropdown in gradebook
    const templateSelect = this.page.locator('select[name="template"], #feedback-template-select');
    await templateSelect.selectOption({ label: templateName });

    // Click apply button
    const applyButton = this.page.locator('button:has-text("Apply Template")');
    await applyButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter templates by category
   */
  async filterByCategory(category: 'all' | 'excellent' | 'good' | 'needs_improvement' | 'incomplete'): Promise<void> {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify template has specific category badge
   */
  async expectTemplateCategory(templateName: string, category: string): Promise<void> {
    const templateCard = this.templateCards.filter({ hasText: templateName });
    await expect(templateCard.locator(`text=${category}`)).toBeVisible();
  }

  /**
   * Get template card by name
   */
  getTemplateCard(name: string): Locator {
    return this.templateCards.filter({ hasText: name });
  }

  /**
   * Verify success message
   */
  async expectSuccess(message?: string): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  /**
   * Verify error message
   */
  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Check if template exists
   */
  async hasTemplate(name: string): Promise<boolean> {
    return await this.templateList.locator(`text=${name}`).isVisible().catch(() => false);
  }

  /**
   * Get count of templates by category
   */
  async getTemplateCountByCategory(category: 'excellent' | 'good' | 'needsImprovement' | 'incomplete'): Promise<number> {
    return await this.categories[category].count();
  }
}
