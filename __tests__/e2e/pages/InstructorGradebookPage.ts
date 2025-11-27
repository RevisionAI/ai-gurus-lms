/**
 * Instructor Gradebook Page Object
 *
 * Encapsulates interactions with the instructor gradebook grid view, inline editing,
 * filtering, and CSV export functionality.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class InstructorGradebookPage extends BasePage {
  // Main gradebook elements
  readonly heading: Locator;
  readonly courseSelect: Locator;
  readonly gradebookGrid: Locator;
  readonly gridHeaders: Locator;
  readonly gridRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  // Grid view/list view toggle
  readonly gridViewButton: Locator;
  readonly listViewButton: Locator;

  // Refresh and export
  readonly refreshButton: Locator;
  readonly exportCSVButton: Locator;

  // Filters
  readonly studentFilterInput: Locator;
  readonly assignmentFilterSelect: Locator;
  readonly statusFilterSelect: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly clearFiltersButton: Locator;
  readonly filterActiveIndicator: Locator;

  // Inline editing
  readonly editableGradeCells: Locator;
  readonly gradeInput: Locator;
  readonly confirmationDialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  // Status indicators
  readonly gradedCells: Locator;
  readonly pendingCells: Locator;
  readonly lateCells: Locator;
  readonly missingCells: Locator;

  // Legend
  readonly legend: Locator;

  // Stats summary
  readonly statsCards: Locator;
  readonly studentsCount: Locator;
  readonly assignmentsCount: Locator;

  constructor(page: Page) {
    super(page);

    // Main elements
    this.heading = page.locator('h1:has-text("Gradebook")');
    this.courseSelect = page.locator('#course-select, select[name="course"]');
    this.gradebookGrid = page.locator('[role="grid"], table');
    this.gridHeaders = page.locator('thead th');
    this.gridRows = page.locator('tbody tr');
    this.loadingSpinner = page.locator('.animate-spin');
    this.emptyState = page.locator('text=No students enrolled, text=No matching results');

    // View toggles
    this.gridViewButton = page.locator('button[title="Grid view"]');
    this.listViewButton = page.locator('button[title="List view"]');

    // Actions
    this.refreshButton = page.locator('button[title="Refresh gradebook"]');
    this.exportCSVButton = page.locator('button:has-text("Export CSV")');

    // Filters
    this.studentFilterInput = page.locator('#studentFilter, input[placeholder*="student"]');
    this.assignmentFilterSelect = page.locator('#assignmentFilter, select[name="assignment"]');
    this.statusFilterSelect = page.locator('#statusFilter, select[name="status"]');
    this.dateFromInput = page.locator('#dateFrom, input[name="dateFrom"]');
    this.dateToInput = page.locator('#dateTo, input[name="dateTo"]');
    this.clearFiltersButton = page.locator('text=Clear All Filters');
    this.filterActiveIndicator = page.locator('text=Active, text=(Filters applied)');

    // Inline editing
    this.editableGradeCells = page.locator('[data-testid="editable-grade-cell"]');
    this.gradeInput = page.locator('input[type="text"][name="grade"]');
    this.confirmationDialog = page.locator('[role="alertdialog"], [role="dialog"]');
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Save")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Status cells
    this.gradedCells = page.locator('td.bg-green-100');
    this.pendingCells = page.locator('td.bg-yellow-100');
    this.lateCells = page.locator('td.bg-orange-100');
    this.missingCells = page.locator('td.bg-red-100');

    // Legend
    this.legend = page.locator('.legend, [aria-label="Status legend"]');

    // Stats
    this.statsCards = page.locator('.stats, [data-testid="stats-card"]');
    this.studentsCount = page.locator('text=Students').first();
    this.assignmentsCount = page.locator('text=Assignments').first();
  }

  /**
   * Navigate to gradebook page
   */
  async goto(courseId?: string): Promise<void> {
    if (courseId) {
      await this.page.goto(`/instructor/courses/${courseId}/gradebook`);
    } else {
      await this.page.goto('/instructor/gradebook');
    }
    await this.waitForLoad();
  }

  /**
   * Wait for gradebook to load completely
   */
  async waitForGradebookLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {
      // Loading spinner may not be present
    });
  }

  /**
   * Select a course from dropdown
   */
  async selectCourse(courseName: string): Promise<void> {
    await this.courseSelect.selectOption({ label: courseName });
    await this.waitForGradebookLoad();
  }

  /**
   * Switch to grid view
   */
  async switchToGridView(): Promise<void> {
    await this.gridViewButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to list view
   */
  async switchToListView(): Promise<void> {
    await this.listViewButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Refresh gradebook data
   */
  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForGradebookLoad();
  }

  /**
   * Apply student name filter
   */
  async filterByStudentName(name: string): Promise<void> {
    await this.studentFilterInput.fill(name);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Filter by assignment
   */
  async filterByAssignment(assignmentName: string): Promise<void> {
    await this.assignmentFilterSelect.selectOption({ label: assignmentName });
    await this.page.waitForTimeout(300);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'all' | 'graded' | 'pending' | 'late' | 'missing'): Promise<void> {
    await this.statusFilterSelect.selectOption(status);
    await this.page.waitForTimeout(300);
  }

  /**
   * Filter by date range
   */
  async filterByDateRange(from: string, to: string): Promise<void> {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.page.waitForTimeout(300);
  }

  /**
   * Clear all filters
   */
  async clearAllFilters(): Promise<void> {
    if (await this.clearFiltersButton.isVisible()) {
      await this.clearFiltersButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get count of visible rows
   */
  async getRowCount(): Promise<number> {
    await this.waitForGradebookLoad();
    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      return 0;
    }
    return await this.gridRows.count();
  }

  /**
   * Get count of header columns
   */
  async getColumnCount(): Promise<number> {
    return await this.gridHeaders.count();
  }

  /**
   * Edit a grade inline (double-click)
   */
  async editGradeInline(rowIndex: number, columnIndex: number, newGrade: string): Promise<void> {
    // Find the cell
    const cell = this.gridRows.nth(rowIndex).locator('td').nth(columnIndex);

    // Double-click to enter edit mode
    await cell.dblclick();

    // Wait for input to appear
    const input = cell.locator('input[type="text"]');
    await expect(input).toBeVisible({ timeout: 2000 });

    // Clear and enter new grade
    await input.clear();
    await input.fill(newGrade);

    // Press Enter to submit
    await input.press('Enter');
  }

  /**
   * Edit grade using data-testid selector
   */
  async editGrade(studentName: string, assignmentTitle: string, newGrade: string): Promise<void> {
    // Find the row for the student
    const studentRow = this.gridRows.filter({ hasText: studentName });

    // Find the column for the assignment (by header)
    const headers = await this.gridHeaders.allTextContents();
    const assignmentIndex = headers.findIndex(h => h.includes(assignmentTitle));

    if (assignmentIndex === -1) {
      throw new Error(`Assignment "${assignmentTitle}" not found in headers`);
    }

    // Get the cell
    const cell = studentRow.locator('td').nth(assignmentIndex);

    // Double-click to edit
    await cell.dblclick();

    // Fill new grade
    const input = cell.locator('input[type="text"]');
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.clear();
    await input.fill(newGrade);

    // Submit
    await input.press('Enter');
  }

  /**
   * Confirm grade change in dialog
   */
  async confirmGradeChange(): Promise<void> {
    await expect(this.confirmationDialog).toBeVisible({ timeout: 3000 });
    await this.confirmButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Cancel grade change in dialog
   */
  async cancelGradeChange(): Promise<void> {
    await expect(this.confirmationDialog).toBeVisible({ timeout: 3000 });
    await this.cancelButton.click();
  }

  /**
   * Verify confirmation dialog shows old and new values
   */
  async expectConfirmationDialog(oldValue: string, newValue: string): Promise<void> {
    await expect(this.confirmationDialog).toBeVisible();
    await expect(this.confirmationDialog).toContainText(oldValue);
    await expect(this.confirmationDialog).toContainText(newValue);
  }

  /**
   * Export gradebook to CSV
   */
  async exportToCSV(): Promise<void> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportCSVButton.click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  }

  /**
   * Verify CSV export button is enabled
   */
  async expectExportEnabled(): Promise<void> {
    await expect(this.exportCSVButton).toBeEnabled();
  }

  /**
   * Verify CSV export button is disabled
   */
  async expectExportDisabled(): Promise<void> {
    await expect(this.exportCSVButton).toBeDisabled();
  }

  /**
   * Verify grid has status color coding
   */
  async expectColorCoding(): Promise<void> {
    // At least one type of colored cell should exist
    const hasGraded = await this.gradedCells.count() > 0;
    const hasPending = await this.pendingCells.count() > 0;
    const hasLate = await this.lateCells.count() > 0;
    const hasMissing = await this.missingCells.count() > 0;

    expect(hasGraded || hasPending || hasLate || hasMissing).toBeTruthy();
  }

  /**
   * Verify legend is visible
   */
  async expectLegendVisible(): Promise<void> {
    await expect(this.page.locator('text=Graded').first()).toBeVisible();
    await expect(this.page.locator('text=Pending').first()).toBeVisible();
    await expect(this.page.locator('text=Late').first()).toBeVisible();
    await expect(this.page.locator('text=Missing').first()).toBeVisible();
  }

  /**
   * Get stats summary values
   */
  async getStats(): Promise<{ students: number; assignments: number }> {
    const studentsText = await this.studentsCount.textContent();
    const assignmentsText = await this.assignmentsCount.textContent();

    const students = parseInt(studentsText?.match(/\d+/)?.[0] || '0');
    const assignments = parseInt(assignmentsText?.match(/\d+/)?.[0] || '0');

    return { students, assignments };
  }

  /**
   * Verify filters are active
   */
  async expectFiltersActive(): Promise<void> {
    await expect(this.filterActiveIndicator).toBeVisible();
  }

  /**
   * Verify no filters are active
   */
  async expectNoFiltersActive(): Promise<void> {
    await expect(this.clearFiltersButton).not.toBeVisible();
  }

  /**
   * Get a specific grade cell value
   */
  async getGradeValue(studentName: string, assignmentTitle: string): Promise<string | null> {
    const studentRow = this.gridRows.filter({ hasText: studentName });
    const headers = await this.gridHeaders.allTextContents();
    const assignmentIndex = headers.findIndex(h => h.includes(assignmentTitle));

    if (assignmentIndex === -1) {
      throw new Error(`Assignment "${assignmentTitle}" not found in headers`);
    }

    const cell = studentRow.locator('td').nth(assignmentIndex);
    return await cell.textContent();
  }

  /**
   * Verify grade value in cell
   */
  async expectGradeValue(studentName: string, assignmentTitle: string, expectedValue: string): Promise<void> {
    const actualValue = await this.getGradeValue(studentName, assignmentTitle);
    expect(actualValue).toContain(expectedValue);
  }
}
