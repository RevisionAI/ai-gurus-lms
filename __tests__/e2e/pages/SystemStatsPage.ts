/**
 * System Stats Page Object
 *
 * Encapsulates interactions with system statistics and monitoring for E2E testing.
 * This extends AdminDashboardPage with additional methods for detailed stats verification.
 * Follows Page Object Model pattern.
 *
 * Story: 3.3 - E2E Tests - Admin Journey
 */

import { Page, Locator, expect } from '@playwright/test';
import { AdminDashboardPage } from './AdminDashboardPage';

export class SystemStatsPage extends AdminDashboardPage {
  // Additional stats locators
  readonly statsRefreshButton: Locator;
  readonly lastRefreshTime: Locator;

  // Detailed metrics
  readonly activeStudentsMetric: Locator;
  readonly activeInstructorsMetric: Locator;
  readonly avgCompletionRate: Locator;

  // Quick actions
  readonly viewAllUsersLink: Locator;
  readonly viewAllCoursesLink: Locator;
  readonly systemLogsLink: Locator;

  constructor(page: Page) {
    super(page);

    // Stats controls
    this.statsRefreshButton = page.locator('button:has-text("Refresh")');
    this.lastRefreshTime = page.locator('text=/Last updated|Updated/');

    // Detailed metrics
    this.activeStudentsMetric = page.locator('text=Active Students');
    this.activeInstructorsMetric = page.locator('text=Active Instructors');
    this.avgCompletionRate = page.locator('text=Avg. Completion Rate');

    // Quick actions
    this.viewAllUsersLink = page.locator('a:has-text("View All Users")').or(
      page.locator('a:has-text("Manage Users")')
    );
    this.viewAllCoursesLink = page.locator('a:has-text("View All Courses")').or(
      page.locator('a:has-text("Manage Courses")')
    );
    this.systemLogsLink = page.locator('a:has-text("System Logs")');
  }

  /**
   * Get all user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    students: number;
    instructors: number;
    admins: number;
  }> {
    await this.waitForLoad();

    return {
      total: await this.getTotalUsersCount(),
      students: await this.getStudentsCount(),
      instructors: await this.getInstructorsCount(),
      admins: await this.getAdminsCount(),
    };
  }

  /**
   * Verify all stats cards are visible
   */
  async verifyStatsCardsVisible(): Promise<void> {
    await expect(this.totalUsersCard).toBeVisible();
    await expect(this.studentsCard).toBeVisible();
    await expect(this.instructorsCard).toBeVisible();
    await expect(this.adminsCard).toBeVisible();
    await expect(this.activeCoursesCard).toBeVisible();
    await expect(this.enrollmentsCard).toBeVisible();
  }

  /**
   * Verify system health section is visible
   */
  async verifySystemHealthVisible(): Promise<void> {
    const healthVisible = await this.isSystemHealthVisible();
    expect(healthVisible).toBe(true);
  }

  /**
   * Get activity metrics
   */
  async getActivityMetrics(): Promise<{
    recentLogins: string;
    recentEnrollments: string;
    recentSubmissions: string;
  }> {
    const logins = (await this.recentLoginsCount.textContent()) || '0';
    const enrollments = (await this.recentEnrollmentsCount.textContent()) || '0';
    const submissions = (await this.recentSubmissionsCount.textContent()) || '0';

    return {
      recentLogins: logins,
      recentEnrollments: enrollments,
      recentSubmissions: submissions,
    };
  }

  /**
   * Verify charts are rendering
   */
  async verifyChartsRendered(): Promise<void> {
    // Wait for page to load
    await this.page.waitForTimeout(2000);

    // Check for chart sections
    const enrollmentChartHeader = this.page.locator('text=Enrollments Over Time');
    const completionChartHeader = this.page.locator('text=Top 10 Courses by Completion Rate');

    await expect(enrollmentChartHeader).toBeVisible();
    await expect(completionChartHeader).toBeVisible();
  }

  /**
   * Refresh stats and wait for update
   */
  async refreshStats(): Promise<void> {
    await this.clickRefresh();

    // Wait for refresh to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate to user management from stats
   */
  async navigateToUserManagement(): Promise<void> {
    await this.viewAllUsersLink.click();
    await this.page.waitForURL('**/admin/users');
  }

  /**
   * Verify no error state
   */
  async verifyNoErrors(): Promise<void> {
    const hasError = await this.hasError();
    expect(hasError).toBe(false);
  }

  /**
   * Wait for stats to load completely
   */
  async waitForStatsLoad(): Promise<void> {
    await this.waitForLoad();

    // Wait for key stats to be visible
    await this.totalUsersCard.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);
  }
}
