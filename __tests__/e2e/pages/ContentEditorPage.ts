/**
 * Content Editor Page Object
 *
 * Encapsulates interactions with the course content upload and management page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContentEditorPage extends BasePage {
  // Content list locators
  readonly contentList: Locator;
  readonly contentItems: Locator;
  readonly noContentMessage: Locator;

  // Upload section
  readonly uploadButton: Locator;
  readonly fileInput: Locator;
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly orderInput: Locator;
  readonly submitUploadButton: Locator;
  readonly cancelUploadButton: Locator;

  // Content management
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly reorderButtons: Locator;

  // Drag and drop
  readonly draggableItems: Locator;
  readonly dropZones: Locator;

  // Status indicators
  readonly uploadProgress: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);

    // Content list
    this.contentList = page.locator('[data-testid="content-list"], ul.space-y-2, .content-list');
    this.contentItems = page.locator('[data-testid="content-item"], .content-item, li');
    this.noContentMessage = page.locator('text=No content available, text=No content uploaded');

    // Upload controls
    this.uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add Content")');
    this.fileInput = page.locator('input[type="file"]');
    this.titleInput = page.locator('input[name="title"], input#content-title');
    this.descriptionTextarea = page.locator('textarea[name="description"], textarea#content-description');
    this.orderInput = page.locator('input[name="order"], input[type="number"]');
    this.submitUploadButton = page.locator('button[type="submit"]:has-text("Upload"), button:has-text("Save")');
    this.cancelUploadButton = page.locator('button:has-text("Cancel")');

    // Content management buttons
    this.editButtons = page.locator('button[aria-label*="Edit"], button:has-text("Edit")');
    this.deleteButtons = page.locator('button[aria-label*="Delete"], button:has-text("Delete")');
    this.reorderButtons = page.locator('button[aria-label*="Reorder"], button[aria-label*="Move"]');

    // Drag and drop
    this.draggableItems = page.locator('[draggable="true"], [data-draggable="true"]');
    this.dropZones = page.locator('[data-drop-zone="true"], .drop-zone');

    // Status
    this.uploadProgress = page.locator('[role="progressbar"], .progress-bar');
    this.successMessage = page.locator('[role="status"]:has-text("Success"), .text-green-700');
    this.errorMessage = page.locator('[role="alert"], .text-red-700');
    this.loadingSpinner = page.locator('.animate-spin');
  }

  /**
   * Navigate to content management page
   */
  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/instructor/courses/${courseId}/content`);
    await this.waitForLoad();
  }

  /**
   * Wait for content list to load
   */
  async waitForContentLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {
      // Loading spinner may not be present
    });
  }

  /**
   * Upload a file with metadata
   */
  async uploadContent(data: {
    filePath: string;
    title: string;
    description?: string;
    order?: number;
  }): Promise<void> {
    // Click upload button to open form
    await this.uploadButton.click();
    await this.page.waitForTimeout(300);

    // Upload file
    await this.fileInput.setInputFiles(data.filePath);

    // Fill metadata
    await this.titleInput.fill(data.title);

    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }

    if (data.order !== undefined) {
      await this.orderInput.fill(data.order.toString());
    }

    // Submit upload
    await this.submitUploadButton.click();

    // Wait for upload to complete
    await this.page.waitForLoadState('networkidle');

    // Wait for success message or content to appear in list
    await this.page.waitForTimeout(1000);
  }

  /**
   * Upload content via drag and drop
   */
  async uploadViaDragDrop(filePath: string): Promise<void> {
    // This is a placeholder - actual drag and drop file upload
    // requires more complex handling in Playwright
    const fileInput = this.fileInput;
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Get count of content items
   */
  async getContentCount(): Promise<number> {
    await this.waitForContentLoad();
    const hasNoContent = await this.noContentMessage.isVisible().catch(() => false);
    if (hasNoContent) {
      return 0;
    }
    return await this.contentItems.count();
  }

  /**
   * Verify content appears in list
   */
  async expectContentVisible(title: string): Promise<void> {
    await expect(this.contentList.locator(`text=${title}`)).toBeVisible();
  }

  /**
   * Edit content item
   */
  async editContent(contentTitle: string, newData: {
    title?: string;
    description?: string;
  }): Promise<void> {
    // Find the content item and click edit
    const contentItem = this.contentList.locator(`text=${contentTitle}`).locator('..');
    await contentItem.locator(this.editButtons).first().click();

    await this.page.waitForTimeout(300);

    // Update fields
    if (newData.title) {
      await this.titleInput.fill(newData.title);
    }

    if (newData.description) {
      await this.descriptionTextarea.fill(newData.description);
    }

    // Save changes
    await this.submitUploadButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete content item
   */
  async deleteContent(contentTitle: string): Promise<void> {
    // Find the content item and click delete
    const contentItem = this.contentList.locator(`text=${contentTitle}`).locator('..');
    await contentItem.locator(this.deleteButtons).first().click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    const isConfirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isConfirmVisible) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reorder content items using drag and drop
   */
  async reorderContent(fromIndex: number, toIndex: number): Promise<void> {
    const items = this.draggableItems;
    const sourceItem = items.nth(fromIndex);
    const targetItem = items.nth(toIndex);

    // Get bounding boxes
    const sourceBox = await sourceItem.boundingBox();
    const targetBox = await targetItem.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag and drop');
    }

    // Perform drag and drop
    await this.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await this.page.mouse.up();

    await this.page.waitForTimeout(500); // Wait for reorder to complete
  }

  /**
   * Reorder content using up/down buttons
   */
  async reorderContentWithButtons(contentTitle: string, direction: 'up' | 'down'): Promise<void> {
    const contentItem = this.contentList.locator(`text=${contentTitle}`).locator('..');
    const buttonText = direction === 'up' ? 'Move up' : 'Move down';
    const button = contentItem.locator(`button[aria-label*="${buttonText}"]`);

    await button.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify content order
   */
  async expectContentOrder(titles: string[]): Promise<void> {
    for (let i = 0; i < titles.length; i++) {
      const item = this.contentItems.nth(i);
      await expect(item).toContainText(titles[i]);
    }
  }

  /**
   * Check if upload progress is visible
   */
  async isUploadInProgress(): Promise<boolean> {
    return await this.uploadProgress.isVisible().catch(() => false);
  }

  /**
   * Wait for upload to complete
   */
  async waitForUploadComplete(): Promise<void> {
    await this.uploadProgress.waitFor({ state: 'detached', timeout: 30000 }).catch(() => {
      // Progress bar may not be present
    });

    // Wait for success message
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      // Success message may be transient
    });
  }

  /**
   * Verify upload success
   */
  async expectUploadSuccess(): Promise<void> {
    const hasSuccess = await this.successMessage.isVisible().catch(() => false);
    const hasError = await this.errorMessage.isVisible().catch(() => false);

    expect(hasSuccess || !hasError).toBeTruthy();
  }

  /**
   * Verify upload error
   */
  async expectUploadError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();

    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
