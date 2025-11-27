/**
 * User Management Page Object
 *
 * Encapsulates interactions with the admin user management page for E2E testing.
 * Follows Page Object Model pattern.
 *
 * Story: 3.3 - E2E Tests - Admin Journey
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserManagementPage extends BasePage {
  // Page URL
  readonly url = '/admin/users';

  // Page Header
  readonly pageTitle: Locator;
  readonly addUserButton: Locator;
  readonly refreshButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly roleFilter: Locator;

  // User Table
  readonly userTable: Locator;
  readonly tableRows: Locator;
  readonly noUsersMessage: Locator;

  // Pagination
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  // Create User Modal
  readonly createModal: Locator;
  readonly createEmailInput: Locator;
  readonly createNameInput: Locator;
  readonly createSurnameInput: Locator;
  readonly createRoleSelect: Locator;
  readonly createPasswordInput: Locator;
  readonly createConfirmPasswordInput: Locator;
  readonly createSubmitButton: Locator;
  readonly createCancelButton: Locator;

  // Edit User Modal
  readonly editModal: Locator;
  readonly editNameInput: Locator;
  readonly editSurnameInput: Locator;
  readonly editRoleSelect: Locator;
  readonly editSubmitButton: Locator;
  readonly editCancelButton: Locator;

  // Role Change Confirmation
  readonly roleChangeConfirmation: Locator;
  readonly roleChangeConfirmButton: Locator;
  readonly roleChangeCancelButton: Locator;

  // Reset Password Modal
  readonly resetPasswordModal: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordSubmitButton: Locator;
  readonly resetPasswordCancelButton: Locator;

  // Deactivate Confirmation
  readonly deactivateConfirmation: Locator;
  readonly deactivateConfirmButton: Locator;
  readonly deactivateCancelButton: Locator;

  // Toast notifications
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);

    // Page Header
    this.pageTitle = page.locator('h1:has-text("User Management")');
    this.addUserButton = page.locator('button:has-text("Add User")');
    this.refreshButton = page.locator('button[title="Refresh users"]');

    // Filters
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.roleFilter = page.locator('select[aria-label*="Filter by role"]');

    // User Table
    this.userTable = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    this.noUsersMessage = page.locator('text=No users found');

    // Pagination
    this.paginationInfo = page.locator('text=/Page \\d+ of \\d+/');
    this.nextPageButton = page.locator('button[aria-label="Next page"]');
    this.prevPageButton = page.locator('button[aria-label="Previous page"]');

    // Create User Modal
    this.createModal = page.locator('[role="dialog"]:has-text("Add User")');
    this.createEmailInput = page.locator('[role="dialog"] input[name="email"]');
    this.createNameInput = page.locator('[role="dialog"] input[name="name"]');
    this.createSurnameInput = page.locator('[role="dialog"] input[name="surname"]');
    this.createRoleSelect = page.locator('[role="dialog"] select[name="role"]');
    this.createPasswordInput = page.locator('[role="dialog"] input[name="password"]');
    this.createConfirmPasswordInput = page.locator('[role="dialog"] input[name="confirmPassword"]');
    this.createSubmitButton = page.locator('[role="dialog"] button[type="submit"]:has-text("Create")');
    this.createCancelButton = page.locator('[role="dialog"] button:has-text("Cancel")');

    // Edit User Modal
    this.editModal = page.locator('[role="dialog"]:has-text("Edit User")');
    this.editNameInput = page.locator('[role="dialog"]:has-text("Edit User") input[name="name"]');
    this.editSurnameInput = page.locator('[role="dialog"]:has-text("Edit User") input[name="surname"]');
    this.editRoleSelect = page.locator('[role="dialog"]:has-text("Edit User") select[name="role"]');
    this.editSubmitButton = page.locator('[role="dialog"]:has-text("Edit User") button[type="submit"]');
    this.editCancelButton = page.locator('[role="dialog"]:has-text("Edit User") button:has-text("Cancel")');

    // Role Change Confirmation
    this.roleChangeConfirmation = page.locator('[role="dialog"]:has-text("Confirm Role Change")');
    this.roleChangeConfirmButton = page.locator('[role="dialog"]:has-text("Confirm Role Change") button:has-text("Confirm")');
    this.roleChangeCancelButton = page.locator('[role="dialog"]:has-text("Confirm Role Change") button:has-text("Cancel")');

    // Reset Password Modal
    this.resetPasswordModal = page.locator('[role="dialog"]:has-text("Reset Password")');
    this.newPasswordInput = page.locator('[role="dialog"]:has-text("Reset Password") input[name="newPassword"]');
    this.confirmPasswordInput = page.locator('[role="dialog"]:has-text("Reset Password") input[name="confirmPassword"]');
    this.resetPasswordSubmitButton = page.locator('[role="dialog"]:has-text("Reset Password") button[type="submit"]');
    this.resetPasswordCancelButton = page.locator('[role="dialog"]:has-text("Reset Password") button:has-text("Cancel")');

    // Deactivate Confirmation
    this.deactivateConfirmation = page.locator('[role="dialog"]:has-text("Deactivate User")');
    this.deactivateConfirmButton = page.locator('[role="dialog"]:has-text("Deactivate User") button:has-text("Deactivate")');
    this.deactivateCancelButton = page.locator('[role="dialog"]:has-text("Deactivate User") button:has-text("Cancel")');

    // Toast notifications
    this.successToast = page.locator('[role="status"]:has-text("success")');
    this.errorToast = page.locator('[role="status"]:has-text("error")');
  }

  /**
   * Navigate to user management page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Verify page is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Filter by role
   */
  async filterByRole(role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'All'): Promise<void> {
    await this.roleFilter.selectOption(role);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Add User button
   */
  async clickAddUser(): Promise<void> {
    await this.addUserButton.click();
    await this.createModal.waitFor({ state: 'visible' });
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    name: string;
    surname: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    password: string;
  }): Promise<void> {
    await this.clickAddUser();

    await this.createEmailInput.fill(data.email);
    await this.createNameInput.fill(data.name);
    await this.createSurnameInput.fill(data.surname);
    await this.createRoleSelect.selectOption(data.role);
    await this.createPasswordInput.fill(data.password);
    await this.createConfirmPasswordInput.fill(data.password);

    await this.createSubmitButton.click();

    // Wait for modal to close
    await this.createModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Find user row by email
   */
  async findUserRow(email: string): Promise<Locator> {
    return this.page.locator(`tr:has-text("${email}")`);
  }

  /**
   * Open user actions menu
   */
  async openUserActionsMenu(email: string): Promise<void> {
    const row = await this.findUserRow(email);
    const actionsButton = row.locator('button[aria-label="User actions"]');
    await actionsButton.click();
  }

  /**
   * Edit a user
   */
  async editUser(email: string, data: {
    name?: string;
    surname?: string;
    role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  }): Promise<void> {
    await this.openUserActionsMenu(email);
    await this.page.locator('text=Edit').click();
    await this.editModal.waitFor({ state: 'visible' });

    if (data.name) {
      await this.editNameInput.fill(data.name);
    }
    if (data.surname) {
      await this.editSurnameInput.fill(data.surname);
    }
    if (data.role) {
      await this.editRoleSelect.selectOption(data.role);

      // If role changed, confirm the change
      const roleChangeVisible = await this.roleChangeConfirmation.isVisible().catch(() => false);
      if (roleChangeVisible) {
        await this.roleChangeConfirmButton.click();
      }
    }

    await this.editSubmitButton.click();

    // Wait for modal to close
    await this.editModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Reset user password
   */
  async resetUserPassword(email: string, newPassword: string): Promise<void> {
    await this.openUserActionsMenu(email);
    await this.page.locator('text=Reset Password').click();
    await this.resetPasswordModal.waitFor({ state: 'visible' });

    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);

    await this.resetPasswordSubmitButton.click();

    // Wait for modal to close
    await this.resetPasswordModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivateUser(email: string): Promise<void> {
    await this.openUserActionsMenu(email);
    await this.page.locator('text=Deactivate').click();
    await this.deactivateConfirmation.waitFor({ state: 'visible' });

    await this.deactivateConfirmButton.click();

    // Wait for confirmation to close
    await this.deactivateConfirmation.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Get user count from table
   */
  async getUserCount(): Promise<number> {
    const rows = await this.tableRows.count();
    return rows;
  }

  /**
   * Check if user exists in table
   */
  async userExists(email: string): Promise<boolean> {
    const row = await this.findUserRow(email);
    return row.isVisible().catch(() => false);
  }

  /**
   * Get user role badge text
   */
  async getUserRole(email: string): Promise<string> {
    const row = await this.findUserRow(email);
    const roleBadge = row.locator('[class*="badge"]');
    return (await roleBadge.textContent()) || '';
  }

  /**
   * Click refresh button
   */
  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for success toast
   */
  async waitForSuccessToast(message?: string): Promise<void> {
    if (message) {
      await this.page.locator(`text="${message}"`).waitFor({ state: 'visible', timeout: 5000 });
    } else {
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Wait for error toast
   */
  async waitForErrorToast(): Promise<void> {
    await this.page.waitForTimeout(1000);
  }
}
