/**
 * Discussion Page Object
 *
 * Encapsulates interactions with the course discussion forum.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DiscussionPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly createDiscussionButton: Locator;
  readonly discussionTitleInput: Locator;
  readonly discussionContentInput: Locator;
  readonly submitDiscussionButton: Locator;
  readonly discussionThreads: Locator;
  readonly discussionPosts: Locator;
  readonly replyButton: Locator;
  readonly replyInput: Locator;
  readonly submitReplyButton: Locator;
  readonly noDiscussionsMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.locator('h1');
    this.createDiscussionButton = page.locator('button:has-text("New Discussion"), button:has-text("Create Discussion"), [data-testid="create-discussion"]');
    this.discussionTitleInput = page.locator('input[name="title"], [data-testid="discussion-title"]');
    this.discussionContentInput = page.locator('textarea[name="content"], [data-testid="discussion-content"]');
    this.submitDiscussionButton = page.locator('button:has-text("Post"), button:has-text("Create"), [data-testid="submit-discussion"]');
    this.discussionThreads = page.locator('[data-testid="discussion-thread"], .discussion-thread');
    this.discussionPosts = page.locator('[data-testid="discussion-post"], .discussion-post');
    this.replyButton = page.locator('button:has-text("Reply"), [data-testid="reply-button"]');
    this.replyInput = page.locator('textarea[name="reply"], [data-testid="reply-input"]');
    this.submitReplyButton = page.locator('button:has-text("Submit Reply"), [data-testid="submit-reply"]');
    this.noDiscussionsMessage = page.locator('text=No discussions yet, text=No discussions available');
    this.successMessage = page.locator('text=posted successfully, text=created successfully, [data-testid="success-message"]');
  }

  /**
   * Navigate to discussions page for a course
   */
  async gotoDiscussions(courseId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}/discussions`);
    await this.waitForLoad();
  }

  /**
   * Navigate to a specific discussion thread
   */
  async gotoThread(courseId: string, discussionId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}/discussions/${discussionId}`);
    await this.waitForLoad();
  }

  /**
   * Expect discussion page to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Create a new discussion thread
   */
  async createDiscussion(title: string, content: string): Promise<void> {
    await this.createDiscussionButton.click();
    await this.discussionTitleInput.waitFor({ state: 'visible' });
    await this.discussionTitleInput.fill(title);
    await this.discussionContentInput.fill(content);
    await this.submitDiscussionButton.click();
  }

  /**
   * Expect discussion creation success
   */
  async expectDiscussionCreated(): Promise<void> {
    await expect(
      this.page.locator('text=posted, text=created, text=success')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click on a discussion thread by title
   */
  async clickDiscussionThread(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).first().click();
    await this.waitForLoad();
  }

  /**
   * Reply to a discussion thread
   */
  async replyToThread(replyText: string): Promise<void> {
    // Check if reply button exists, click it
    if (await this.replyButton.isVisible()) {
      await this.replyButton.click();
    }

    await this.replyInput.waitFor({ state: 'visible' });
    await this.replyInput.fill(replyText);
    await this.submitReplyButton.click();
  }

  /**
   * Expect reply to be posted successfully
   */
  async expectReplyPosted(): Promise<void> {
    await expect(
      this.page.locator('text=posted, text=replied, text=success')
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get count of discussion threads
   */
  async getThreadCount(): Promise<number> {
    await this.page.waitForTimeout(1000); // Wait for threads to load
    return await this.discussionThreads.count();
  }

  /**
   * Get count of posts in current thread
   */
  async getPostCount(): Promise<number> {
    await this.page.waitForTimeout(1000); // Wait for posts to load
    return await this.discussionPosts.count();
  }

  /**
   * Check if any discussions exist
   */
  async hasDiscussions(): Promise<boolean> {
    const count = await this.getThreadCount();
    return count > 0;
  }

  /**
   * Expect discussions to be visible
   */
  async expectDiscussionsVisible(): Promise<void> {
    await expect(this.discussionThreads.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Expect no discussions message
   */
  async expectNoDiscussions(): Promise<void> {
    await expect(this.noDiscussionsMessage).toBeVisible();
  }

  /**
   * Verify discussion thread exists by title
   */
  async verifyThreadExists(title: string): Promise<boolean> {
    try {
      await this.page.locator(`text=${title}`).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify post exists in thread
   */
  async verifyPostExists(content: string): Promise<boolean> {
    try {
      await this.page.locator(`text=${content}`).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expect success message
   */
  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }
}
