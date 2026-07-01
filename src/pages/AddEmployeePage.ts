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
   * Creates a single employee and waits for OrangeHRM to confirm success by
   * redirecting to the freshly created employee's Personal Details page.
   */
  async addEmployee(first: string, last: string, middle = ''): Promise<void> {
    await this.fillWhenReady(this.firstName, first);
    if (middle) {
      await this.fillWhenReady(this.middleName, middle);
    }
    await this.fillWhenReady(this.lastName, last);
    await this.clickWhenReady(this.saveButton);

    // On success the app routes to .../pim/viewPersonalDetails/empNumber/<id>.
    await this.page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+$/);
    await this.waitForPageReady();
  }
}
