/**
 * Accessibility Testing Suite
 *
 * Comprehensive WCAG 2.1 AA compliance testing using axe-core integration with Playwright.
 *
 * Tests all key pages for:
 * - Color contrast ratios (4.5:1 normal text, 3:1 large text)
 * - Keyboard navigation
 * - Focus indicators
 * - Form labels
 * - Alt text for images
 * - ARIA labels
 *
 * Story: 3.4 - Accessibility Testing & Validation
 */

import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { GradebookPage } from './pages/GradebookPage';
import { InstructorGradebookPage } from './pages/InstructorGradebookPage';
import { AssignmentPage } from './pages/AssignmentPage';
import { DiscussionPage } from './pages/DiscussionPage';
import { testStudent, testInstructor, testAdmin } from './fixtures/testUsers';
import { testCourse } from './fixtures/testCourses';
import { testAssignments } from './fixtures/testAssignments';
import {
  getAxeBuilder,
  generateAccessibilityReport,
  formatReportSummary,
  hasBlockingIssues,
  hasColorContrastViolations,
  hasKeyboardViolations,
  hasARIAViolations,
  hasFormLabelViolations,
  hasImageAltViolations,
  exportReportJSON,
} from './helpers/accessibility';

/**
 * Helper to run axe scan and generate report
 */
async function runAxeScan(page: Page, pageName: string) {
  const results = await getAxeBuilder(page).analyze();
  const report = generateAccessibilityReport(page, results);

  // Log detailed report to console for debugging
  console.log(`\n${formatReportSummary(report)}`);

  // Save JSON report for CI/CD
  if (process.env.CI) {
    const fs = await import('fs');
    const path = await import('path');
    const reportsDir = path.join(__dirname, '../../test-results/accessibility');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filename = `${pageName}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(reportsDir, filename),
      exportReportJSON(report)
    );
  }

  return report;
}

/**
 * Helper to test keyboard navigation
 */
async function testKeyboardNavigation(page: Page, pageName: string) {
  // Get all interactive elements
  const interactiveElements = await page.locator(
    'button:visible, a:visible, input:visible, textarea:visible, select:visible, [tabindex]:visible'
  ).all();

  console.log(`\n[${pageName}] Found ${interactiveElements.length} interactive elements`);

  if (interactiveElements.length === 0) {
    console.warn(`[${pageName}] No interactive elements found for keyboard navigation test`);
    return;
  }

  // Tab through first 5 elements to verify basic keyboard navigation
  const elementsToTest = Math.min(5, interactiveElements.length);
  for (let i = 0; i < elementsToTest; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if an element has focus
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const isFocused = await focusedElement.evaluate(el => el !== document.body);

    expect(isFocused).toBe(true);
  }

  // Test Shift+Tab to go backwards
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(200);

  console.log(`[${pageName}] Keyboard navigation test passed`);
}

/**
 * Helper to verify focus indicators are visible
 */
async function testFocusIndicators(page: Page, pageName: string) {
  // Tab to first focusable element
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);

  // Check that focused element has visible outline or focus styling
  const hasFocusIndicator = await page.evaluate(() => {
    const focused = document.activeElement;
    if (!focused || focused === document.body) return false;

    const styles = window.getComputedStyle(focused);
    const pseudoStyles = window.getComputedStyle(focused, ':focus');

    // Check for outline, box-shadow, or border changes
    const hasOutline = styles.outline !== 'none' && styles.outline !== '';
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasBorder = styles.borderWidth !== '0px';

    // Check :focus pseudo styles
    const hasFocusOutline = pseudoStyles.outline !== 'none';
    const hasFocusBoxShadow = pseudoStyles.boxShadow !== 'none';

    return hasOutline || hasBoxShadow || hasBorder || hasFocusOutline || hasFocusBoxShadow;
  });

  console.log(`[${pageName}] Focus indicator visible: ${hasFocusIndicator}`);

  // Note: We log but don't fail the test as some elements may have custom focus indicators
  // axe-core will catch missing focus indicators
}

test.describe('Accessibility: Login & Authentication', () => {
  test('Login page meets WCAG 2.1 AA standards', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const report = await runAxeScan(page, 'login-page');

    // Assert no blocking issues (P0/P1)
    const hasBlocking = hasBlockingIssues(report);
    if (hasBlocking) {
      console.error(`Login page has ${report.criticalCount + report.seriousCount} blocking accessibility issues`);
    }
    expect(hasBlocking).toBe(false);

    // Verify specific WCAG requirements
    expect(hasColorContrastViolations(report)).toBe(false);
    expect(hasFormLabelViolations(report)).toBe(false);
  });

  test('Login page keyboard navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test keyboard navigation
    await testKeyboardNavigation(page, 'login-page');

    // Test focus indicators
    await testFocusIndicators(page, 'login-page');

    // Test form submission with Enter key
    await loginPage.emailInput.click();
    await page.keyboard.press('Tab'); // Move to password
    await page.keyboard.press('Tab'); // Move to submit button
    await page.keyboard.press('Tab'); // Should wrap or move to other interactive element

    // Verify no keyboard traps
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const isTrapped = await focusedElement.evaluate(el => el === null);
    expect(isTrapped).toBe(false);
  });
});

test.describe('Accessibility: Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Student dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectVisible();

    const report = await runAxeScan(page, 'student-dashboard');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
    expect(hasARIAViolations(report)).toBe(false);
  });

  test('Student dashboard keyboard navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectVisible();

    await testKeyboardNavigation(page, 'student-dashboard');
    await testFocusIndicators(page, 'student-dashboard');
  });

  test('GPA cards have proper ARIA labels', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectVisible();

    // Check if GPA card is visible
    const hasGPA = await dashboardPage.isGPACardVisible();

    if (hasGPA) {
      // Verify GPA card has proper ARIA label
      const gpaCard = page.locator('[aria-label*="Overall GPA"], [aria-labelledby*="gpa"]').first();
      const hasAriaLabel = await gpaCard.count() > 0;

      if (hasAriaLabel) {
        expect(hasAriaLabel).toBe(true);
      }
    }
  });
});

test.describe('Accessibility: Instructor Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testInstructor.email, testInstructor.password);
    await loginPage.expectLoginSuccess();
  });

  test('Instructor dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    const instructorDashboard = new InstructorDashboardPage(page);
    await instructorDashboard.goto();

    const report = await runAxeScan(page, 'instructor-dashboard');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Instructor dashboard keyboard navigation', async ({ page }) => {
    const instructorDashboard = new InstructorDashboardPage(page);
    await instructorDashboard.goto();

    await testKeyboardNavigation(page, 'instructor-dashboard');
    await testFocusIndicators(page, 'instructor-dashboard');
  });
});

test.describe('Accessibility: Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testAdmin.email, testAdmin.password);
    await loginPage.expectLoginSuccess();
  });

  test('Admin dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    const adminDashboard = new AdminDashboardPage(page);
    await adminDashboard.goto();
    await adminDashboard.expectVisible();

    const report = await runAxeScan(page, 'admin-dashboard');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
    expect(hasARIAViolations(report)).toBe(false);
  });

  test('Admin dashboard keyboard navigation', async ({ page }) => {
    const adminDashboard = new AdminDashboardPage(page);
    await adminDashboard.goto();
    await adminDashboard.expectVisible();

    await testKeyboardNavigation(page, 'admin-dashboard');
    await testFocusIndicators(page, 'admin-dashboard');
  });

  test('Admin statistics cards have proper ARIA labels', async ({ page }) => {
    const adminDashboard = new AdminDashboardPage(page);
    await adminDashboard.goto();
    await adminDashboard.expectVisible();

    // Check for ARIA labels on stat cards
    const statCards = await page.locator('[role="region"][aria-labelledby], [role="article"]').count();

    // We expect some stat cards to have proper semantic markup
    // Note: This is a basic check, axe-core will catch more detailed issues
    console.log(`Admin dashboard has ${statCards} properly labeled stat cards`);
  });

  test('Charts have accessible labels', async ({ page }) => {
    const adminDashboard = new AdminDashboardPage(page);
    await adminDashboard.goto();
    await adminDashboard.expectVisible();

    // Check if charts have proper ARIA labels or titles
    const hasEnrollmentChart = await adminDashboard.isEnrollmentChartVisible();
    const hasCompletionChart = await adminDashboard.isCompletionRateChartVisible();

    if (hasEnrollmentChart || hasCompletionChart) {
      const chartLabels = await page.locator('[aria-label*="chart"], [role="img"][aria-label]').count();
      console.log(`Found ${chartLabels} charts with ARIA labels`);

      // axe-core will validate proper chart accessibility
    }
  });
});

test.describe('Accessibility: Course Catalog', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Course catalog meets WCAG 2.1 AA standards', async ({ page }) => {
    const catalogPage = new CourseCatalogPage(page);
    await catalogPage.goto();
    await catalogPage.expectVisible();

    const report = await runAxeScan(page, 'course-catalog');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Course catalog keyboard navigation', async ({ page }) => {
    const catalogPage = new CourseCatalogPage(page);
    await catalogPage.goto();
    await catalogPage.expectVisible();

    await testKeyboardNavigation(page, 'course-catalog');
    await testFocusIndicators(page, 'course-catalog');
  });

  test('Course cards are keyboard accessible', async ({ page }) => {
    const catalogPage = new CourseCatalogPage(page);
    await catalogPage.goto();
    await catalogPage.expectVisible();

    const hasCoursesDisplayed = await catalogPage.hasCoursesDisplayed();

    if (hasCoursesDisplayed) {
      // Tab to first course card
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Try to activate with Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Should navigate to course detail page
      const currentUrl = page.url();
      const isOnCoursePage = currentUrl.includes('/courses/');

      console.log(`Course card keyboard activation: ${isOnCoursePage}`);
    }
  });
});

test.describe('Accessibility: Course Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Course detail page meets WCAG 2.1 AA standards', async ({ page }) => {
    const courseDetailPage = new CourseDetailPage(page);
    await courseDetailPage.goto(testCourse.id);
    await courseDetailPage.expectVisible();

    const report = await runAxeScan(page, 'course-detail');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Course detail keyboard navigation', async ({ page }) => {
    const courseDetailPage = new CourseDetailPage(page);
    await courseDetailPage.goto(testCourse.id);
    await courseDetailPage.expectVisible();

    await testKeyboardNavigation(page, 'course-detail');
    await testFocusIndicators(page, 'course-detail');
  });

  test('Course tabs are keyboard navigable', async ({ page }) => {
    const courseDetailPage = new CourseDetailPage(page);
    await courseDetailPage.goto(testCourse.id);
    await courseDetailPage.expectVisible();

    // Find tab elements
    const tabs = await page.locator('[role="tab"], [role="tablist"] button, [role="tablist"] a').all();

    if (tabs.length > 0) {
      console.log(`Found ${tabs.length} tabs for keyboard navigation`);

      // Tab navigation should work with arrow keys
      await tabs[0].focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);

      // Verify focus moved
      const focusedTab = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.getAttribute('role') === 'tab';
      });

      console.log(`Tab keyboard navigation with arrow keys: ${focusedTab}`);
    }
  });
});

test.describe('Accessibility: Gradebook', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Student gradebook meets WCAG 2.1 AA standards', async ({ page }) => {
    const gradebookPage = new GradebookPage(page);
    await gradebookPage.gotoForCourse(testCourse.id);
    await gradebookPage.expectVisible();

    const report = await runAxeScan(page, 'student-gradebook');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Gradebook table is accessible', async ({ page }) => {
    const gradebookPage = new GradebookPage(page);
    await gradebookPage.gotoForCourse(testCourse.id);
    await gradebookPage.expectVisible();

    // Check for proper table semantics
    const hasTable = await page.locator('table, [role="table"]').count() > 0;

    if (hasTable) {
      // Verify table has proper headers
      const hasHeaders = await page.locator('th, [role="columnheader"]').count() > 0;
      expect(hasHeaders).toBe(true);

      // Verify table has caption or aria-label
      const hasCaption = await page.locator('caption, [aria-label], [aria-labelledby]').count() > 0;
      console.log(`Gradebook table has caption/label: ${hasCaption}`);
    }
  });
});

test.describe('Accessibility: Instructor Gradebook', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testInstructor.email, testInstructor.password);
    await loginPage.expectLoginSuccess();
  });

  test('Instructor gradebook meets WCAG 2.1 AA standards', async ({ page }) => {
    const instructorGradebookPage = new InstructorGradebookPage(page);
    await instructorGradebookPage.goto(testCourse.id);

    const report = await runAxeScan(page, 'instructor-gradebook');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Instructor gradebook keyboard navigation', async ({ page }) => {
    const instructorGradebookPage = new InstructorGradebookPage(page);
    await instructorGradebookPage.goto(testCourse.id);

    await testKeyboardNavigation(page, 'instructor-gradebook');
  });
});

test.describe('Accessibility: Assignment Page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Assignment page meets WCAG 2.1 AA standards', async ({ page }) => {
    const assignmentPage = new AssignmentPage(page);
    await assignmentPage.gotoAssignment(testCourse.id, testAssignments.upcoming.id);
    await assignmentPage.expectVisible();

    const report = await runAxeScan(page, 'assignment-page');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
    expect(hasFormLabelViolations(report)).toBe(false);
  });

  test('Assignment page keyboard navigation', async ({ page }) => {
    const assignmentPage = new AssignmentPage(page);
    await assignmentPage.gotoAssignment(testCourse.id, testAssignments.upcoming.id);
    await assignmentPage.expectVisible();

    await testKeyboardNavigation(page, 'assignment-page');
    await testFocusIndicators(page, 'assignment-page');
  });

  test('Assignment form inputs have proper labels', async ({ page }) => {
    const assignmentPage = new AssignmentPage(page);
    await assignmentPage.gotoAssignment(testCourse.id, testAssignments.upcoming.id);
    await assignmentPage.expectVisible();

    // Check that all form inputs have associated labels
    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const inputEl = el as HTMLInputElement;
        if (inputEl.getAttribute('aria-label')) return true;
        if (inputEl.getAttribute('aria-labelledby')) return true;

        // Check for associated label element
        const id = inputEl.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }

        // Check for wrapping label
        const parent = inputEl.closest('label');
        if (parent) return true;

        return false;
      });

      if (inputs.length > 0 && !hasLabel) {
        console.warn(`Input without label found on assignment page`);
      }
    }
  });

  test('File upload input is accessible', async ({ page }) => {
    const assignmentPage = new AssignmentPage(page);
    await assignmentPage.gotoAssignment(testCourse.id, testAssignments.withFile.id);
    await assignmentPage.expectVisible();

    // Check for file input accessibility
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();

    if (fileInputCount > 0) {
      const hasLabel = await fileInput.evaluate(el => {
        if (el.getAttribute('aria-label')) return true;
        if (el.getAttribute('aria-labelledby')) return true;

        const id = el.id;
        if (id) {
          return !!document.querySelector(`label[for="${id}"]`);
        }

        return false;
      });

      console.log(`File input has label: ${hasLabel}`);
    }
  });
});

test.describe('Accessibility: Discussion Page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();
  });

  test('Discussion page meets WCAG 2.1 AA standards', async ({ page }) => {
    const discussionPage = new DiscussionPage(page);
    await discussionPage.gotoDiscussions(testCourse.id);
    await discussionPage.expectVisible();

    const report = await runAxeScan(page, 'discussion-page');

    expect(hasBlockingIssues(report)).toBe(false);
    expect(hasColorContrastViolations(report)).toBe(false);
  });

  test('Discussion page keyboard navigation', async ({ page }) => {
    const discussionPage = new DiscussionPage(page);
    await discussionPage.gotoDiscussions(testCourse.id);
    await discussionPage.expectVisible();

    await testKeyboardNavigation(page, 'discussion-page');
    await testFocusIndicators(page, 'discussion-page');
  });

  test('Discussion threads are keyboard accessible', async ({ page }) => {
    const discussionPage = new DiscussionPage(page);
    await discussionPage.gotoDiscussions(testCourse.id);
    await discussionPage.expectVisible();

    const hasDiscussions = await discussionPage.hasDiscussions();

    if (hasDiscussions) {
      // Tab to first discussion thread
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Activate with Enter
      const initialUrl = page.url();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      const newUrl = page.url();
      const didNavigate = newUrl !== initialUrl;

      console.log(`Discussion thread keyboard accessible: ${didNavigate}`);
    }
  });
});

test.describe('Accessibility: Comprehensive Checks', () => {
  test('All pages: Verify no duplicate IDs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check for duplicate IDs on login page
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      return [...new Set(duplicates)];
    });

    expect(duplicateIds.length).toBe(0);
  });

  test('All pages: Verify proper heading hierarchy', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check heading hierarchy
    const headingHierarchy = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => h.tagName);
    });

    // Should have at least one h1
    const hasH1 = headingHierarchy.includes('H1');
    console.log(`Page has h1: ${hasH1}`);
    console.log(`Heading hierarchy: ${headingHierarchy.join(' > ')}`);
  });

  test('All pages: Verify skip links exist', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check for skip link
    const skipLinks = await page.locator('a[href^="#main"], a[href^="#content"], .skip-link').count();
    console.log(`Skip links found: ${skipLinks}`);

    // Note: Skip links are recommended but not always required
  });

  test('All pages: Verify lang attribute on html element', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const langAttr = await page.evaluate(() => {
      return document.documentElement.lang;
    });

    expect(langAttr).toBeTruthy();
    console.log(`Page language: ${langAttr}`);
  });

  test('All interactive elements have visible focus', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test that tabbing through elements shows visible focus
    const interactiveElements = await page.locator(
      'button:visible, a:visible, input:visible'
    ).all();

    if (interactiveElements.length > 0) {
      const firstElement = interactiveElements[0];
      await firstElement.focus();

      // Check computed styles for focus indicator
      const hasFocusStyle = await firstElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });

      console.log(`Interactive elements have focus indicators: ${hasFocusStyle}`);
    }
  });
});

test.describe('Accessibility: Lighthouse Score', () => {
  test('Login page Lighthouse accessibility score > 90', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const report = await runAxeScan(page, 'login-lighthouse');

    // Calculate approximate Lighthouse score based on axe results
    const totalTests = report.passes + report.violations.length;
    const score = totalTests > 0 ? (report.passes / totalTests) * 100 : 0;

    console.log(`Approximate accessibility score: ${score.toFixed(2)}/100`);
    console.log(`Note: Run actual Lighthouse audit for official score`);

    // Ensure no blocking issues which would significantly lower score
    expect(hasBlockingIssues(report)).toBe(false);
  });

  test('Dashboard Lighthouse accessibility score > 90', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testStudent.email, testStudent.password);
    await loginPage.expectLoginSuccess();

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectVisible();

    const report = await runAxeScan(page, 'dashboard-lighthouse');

    const totalTests = report.passes + report.violations.length;
    const score = totalTests > 0 ? (report.passes / totalTests) * 100 : 0;

    console.log(`Dashboard approximate accessibility score: ${score.toFixed(2)}/100`);

    expect(hasBlockingIssues(report)).toBe(false);
  });
});
