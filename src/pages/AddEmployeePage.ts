import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PIM -> Add Employee screen.
 * Locators are placeholder/role based (text-driven), never index or nth-child.
 */
export class AddEmployeePage extends BasePage {
  private readonly addEmployeeTab: Locator;
  private readonly firstName: Locator;
  private readonly middleName: Locator;
  private readonly lastName: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addEmployeeTab = page.getByRole('link', { name: 'Add Employee' });
    this.firstName = page.getByPlaceholder('First Name');
    this.middleName = page.getByPlaceholder('Middle Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  /** Navigate PIM -> Add Employee purely through the UI. */
  async open(): Promise<void> {
    await this.openModule('PIM');
    await this.clickWhenReady(this.addEmployeeTab);
    await this.waitForPageReady();
    await expect(this.firstName).toBeVisible();
  }

  /**
   * Opens the form and creates a single employee, retrying the whole open ->
   * fill -> save flow if the shared demo is momentarily slow or drops the save.
   *
   * The public demo occasionally responds slowly enough that a single save
   * confirmation times out; retrying from a fresh form is a deterministic,
   * self-contained way to absorb that transient instability without hard waits.
   */
  async createEmployee(first: string, last: string, middle = '', maxAttempts = 3): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.open();
        await this.addEmployee(first, last, middle);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  /**
   * Fills the form and saves, confirming success by the app's redirect to the
   * freshly created employee's Personal Details page. The URL change only
   * happens on a successful create, so it is a more reliable success signal
   * than matching a specific API response status.
   */
  async addEmployee(first: string, last: string, middle = ''): Promise<void> {
    await this.fillWhenReady(this.firstName, first);
    if (middle) {
      await this.fillWhenReady(this.middleName, middle);
    }
    await this.fillWhenReady(this.lastName, last);
    await this.clickWhenReady(this.saveButton);

    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/, { timeout: 30_000 });
    await this.waitForPageReady();
  }
}
