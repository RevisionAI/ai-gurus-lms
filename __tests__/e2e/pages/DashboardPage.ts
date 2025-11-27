/**
 * Dashboard Page Object
 *
 * Encapsulates interactions with the main dashboard page.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly courseCards: Locator;
  readonly userMenu: Locator;
  readonly signOutButton: Locator;
  readonly welcomeMessage: Locator;
  readonly navigationLinks: Locator;

  // GPA Locators (Story 2.4)
  readonly overallGPACard: Locator;
  readonly overallGPAValue: Locator;
  readonly overallGPALetterGrade: Locator;
  readonly gpaSummarySection: Locator;
  readonly courseGPAItems: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1');
    this.courseCards = page.locator('[data-testid="course-card"], .course-card, a[href^="/courses/"]');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.signOutButton = page.locator('text=Sign out, text=Logout, text=Sign Out');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"], .welcome');
    this.navigationLinks = page.locator('nav a');

    // GPA locators
    this.overallGPACard = page.locator('[aria-label*="Overall GPA"], text=Overall GPA').first();
    this.overallGPAValue = page.locator('[aria-label*="Overall GPA"]').locator('span.font-bold').first();
    this.overallGPALetterGrade = page.locator('[aria-label*="Overall GPA"]').locator('span[class*="bg-"]').first();
    this.gpaSummarySection = page.locator('text=Academic Progress').first();
    this.courseGPAItems = page.locator('[role="listitem"][aria-label*="GPA"], [role="listitem"]');
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  /**
   * Expect dashboard to be visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  /**
   * Get all visible course cards
   */
  async getCourseCards(): Promise<Locator> {
    return this.courseCards;
  }

  /**
   * Click on a specific course card by title
   */
  async clickCourseCard(courseTitle: string): Promise<void> {
    await this.page.locator(`text=${courseTitle}`).first().click();
  }

  /**
   * Navigate to courses page
   */
  async goToCourses(): Promise<void> {
    await this.page.locator('a[href="/courses"], text=Courses').first().click();
  }

  /**
   * Sign out from dashboard
   */
  async signOut(): Promise<void> {
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
    }
    await this.signOutButton.click();
  }

  /**
   * Check if user is logged in by looking for dashboard elements
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // GPA Methods (Story 2.4)
  // ============================================

  /**
   * Check if GPA card is visible on dashboard
   */
  async isGPACardVisible(): Promise<boolean> {
    try {
      await this.overallGPACard.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the overall GPA value displayed on the dashboard
   * @returns GPA value as string (e.g., "3.75" or "N/A")
   */
  async getOverallGPAValue(): Promise<string> {
    await this.overallGPACard.waitFor({ state: 'visible', timeout: 5000 });
    const text = await this.overallGPAValue.textContent();
    return text?.trim() || 'N/A';
  }

  /**
   * Get the letter grade displayed for overall GPA
   * @returns Letter grade (e.g., "A", "B+") or empty string if not displayed
   */
  async getOverallLetterGrade(): Promise<string> {
    try {
      const text = await this.overallGPALetterGrade.textContent({ timeout: 3000 });
      return text?.trim() || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if GPA Summary section is visible
   */
  async isGPASummaryVisible(): Promise<boolean> {
    try {
      await this.gpaSummarySection.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the count of course GPA items displayed in summary
   */
  async getCourseGPACount(): Promise<number> {
    await this.page.waitForTimeout(1000); // Wait for data to load
    return await this.courseGPAItems.count();
  }

  /**
   * Expect GPA card to display specific value
   */
  async expectGPAValue(expectedValue: string): Promise<void> {
    await expect(this.overallGPAValue).toContainText(expectedValue);
  }

  /**
   * Expect GPA card to display N/A
   */
  async expectGPANotAvailable(): Promise<void> {
    await expect(this.overallGPACard).toContainText('N/A');
  }
}
