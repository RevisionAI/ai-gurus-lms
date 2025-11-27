/**
 * Admin Dashboard Page Object
 *
 * Encapsulates interactions with the admin dashboard page for E2E testing.
 * Follows Page Object Model pattern.
 *
 * Story: 2-6-admin-dashboard-system-statistics-monitoring
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminDashboardPage extends BasePage {
  // Page URL
  readonly url = '/';

  // Statistics Overview Locators
  readonly totalUsersCard: Locator;
  readonly studentsCard: Locator;
  readonly instructorsCard: Locator;
  readonly adminsCard: Locator;
  readonly activeCoursesCard: Locator;
  readonly enrollmentsCard: Locator;
  readonly assignmentsCard: Locator;
  readonly discussionsCard: Locator;

  // Charts Locators
  readonly enrollmentChart: Locator;
  readonly completionRateChart: Locator;

  // Activity Feed Locators
  readonly activityFeed: Locator;
  readonly recentLoginsCount: Locator;
  readonly recentEnrollmentsCount: Locator;
  readonly recentSubmissionsCount: Locator;

  // System Health Locators
  readonly systemHealth: Locator;
  readonly databaseStatus: Locator;
  readonly storageStatus: Locator;

  // Controls
  readonly refreshButton: Locator;
  readonly autoRefreshToggle: Locator;
  readonly lastUpdatedTimestamp: Locator;

  // Admin Actions
  readonly manageUsersLink: Locator;
  readonly manageCoursesLink: Locator;
  readonly deletedRecordsLink: Locator;
  readonly reportsLink: Locator;

  // Loading and Error States
  readonly loadingSpinner: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Stats Overview
    this.totalUsersCard = page.locator('text=Total Users').first();
    this.studentsCard = page.locator('text=Students').first();
    this.instructorsCard = page.locator('text=Instructors').first();
    this.adminsCard = page.locator('text=Admins').first();
    this.activeCoursesCard = page.locator('text=Active Courses').first();
    this.enrollmentsCard = page.locator('text=Enrollments').first();
    this.assignmentsCard = page.locator('text=Assignments').first();
    this.discussionsCard = page.locator('text=Discussions').first();

    // Charts
    this.enrollmentChart = page.locator('[aria-labelledby="enrollment-chart-heading"]');
    this.completionRateChart = page.locator('[aria-labelledby="completion-chart-heading"]');

    // Activity Feed
    this.activityFeed = page.locator('[aria-labelledby="activity-feed-heading"]');
    this.recentLoginsCount = page.locator('text=Recent Logins').locator('..').locator('span').last();
    this.recentEnrollmentsCount = page.locator('text=New Enrollments').locator('..').locator('span').last();
    this.recentSubmissionsCount = page.locator('text=New Submissions').locator('..').locator('span').last();

    // System Health
    this.systemHealth = page.locator('[aria-labelledby="system-health-heading"]');
    this.databaseStatus = page.locator('text=Database').locator('..').locator('[role="status"]');
    this.storageStatus = page.locator('text=Storage').locator('..').locator('[role="status"]');

    // Controls
    this.refreshButton = page.locator('button:has-text("Refresh")');
    this.autoRefreshToggle = page.locator('[aria-label="Toggle auto-refresh"]');
    this.lastUpdatedTimestamp = page.locator('text=Updated').first();

    // Admin Actions
    this.manageUsersLink = page.locator('a:has-text("Manage Users")');
    this.manageCoursesLink = page.locator('a:has-text("Manage Courses")');
    this.deletedRecordsLink = page.locator('a:has-text("Deleted Records")');
    this.reportsLink = page.locator('a:has-text("Reports")');

    // Loading/Error
    this.loadingSpinner = page.locator('.animate-spin');
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Navigate to admin dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /**
   * Wait for dashboard to load
   */
  async waitForLoad(): Promise<void> {
    // Wait for either stats to load or error state
    await Promise.race([
      this.page.waitForSelector('text=System Dashboard', { timeout: 10000 }),
      this.page.waitForSelector('[role="alert"]', { timeout: 10000 }),
    ]);
  }

  /**
   * Verify dashboard is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.page.locator('text=System Dashboard')).toBeVisible();
  }

  /**
   * Get total users count from card
   */
  async getTotalUsersCount(): Promise<number> {
    const text = await this.totalUsersCard.locator('..').locator('dd').textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Get students count from card
   */
  async getStudentsCount(): Promise<number> {
    const text = await this.studentsCard.locator('..').locator('dd').textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Get instructors count from card
   */
  async getInstructorsCount(): Promise<number> {
    const text = await this.instructorsCard.locator('..').locator('dd').textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Get admins count from card
   */
  async getAdminsCount(): Promise<number> {
    const text = await this.adminsCard.locator('..').locator('dd').textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Click refresh button
   */
  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
  }

  /**
   * Toggle auto-refresh
   */
  async toggleAutoRefresh(): Promise<void> {
    await this.autoRefreshToggle.click();
  }

  /**
   * Check if auto-refresh is enabled
   */
  async isAutoRefreshEnabled(): Promise<boolean> {
    return await this.autoRefreshToggle.isChecked();
  }

  /**
   * Navigate to Manage Users
   */
  async navigateToManageUsers(): Promise<void> {
    await this.manageUsersLink.click();
    await this.page.waitForURL('**/admin/users');
  }

  /**
   * Navigate to Deleted Records
   */
  async navigateToDeletedRecords(): Promise<void> {
    await this.deletedRecordsLink.click();
    await this.page.waitForURL('**/admin/deleted-records');
  }

  /**
   * Check if enrollment chart is visible
   */
  async isEnrollmentChartVisible(): Promise<boolean> {
    return await this.enrollmentChart.isVisible().catch(() => false);
  }

  /**
   * Check if completion rate chart is visible
   */
  async isCompletionRateChartVisible(): Promise<boolean> {
    return await this.completionRateChart.isVisible().catch(() => false);
  }

  /**
   * Check if activity feed is visible
   */
  async isActivityFeedVisible(): Promise<boolean> {
    return await this.activityFeed.isVisible().catch(() => false);
  }

  /**
   * Check if system health section is visible
   */
  async isSystemHealthVisible(): Promise<boolean> {
    return await this.systemHealth.isVisible().catch(() => false);
  }

  /**
   * Get database status text
   */
  async getDatabaseStatus(): Promise<string> {
    const status = await this.databaseStatus.textContent();
    return status?.trim() || '';
  }

  /**
   * Get storage status text
   */
  async getStorageStatus(): Promise<string> {
    const status = await this.storageStatus.textContent();
    return status?.trim() || '';
  }

  /**
   * Check if error alert is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible().catch(() => false);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return (await this.errorAlert.textContent()) || '';
    }
    return '';
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }
}
