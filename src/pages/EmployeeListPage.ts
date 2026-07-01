import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PIM -> Employee List screen. This is the core of the technical test: search
 * for duplicate records, identify them by NAME (not by Employee ID or row
 * position), select them via the UI checkboxes, and delete down to one.
 */
export class EmployeeListPage extends BasePage {
  private readonly employeeListTab: Locator;
  private readonly nameFilter: Locator;
  private readonly searchButton: Locator;
  private readonly tableBody: Locator;
  private readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.employeeListTab = page.getByRole('link', { name: 'Employee List' });
    // The Employee Name filter is the first "Type for hints..." autocomplete.
    this.nameFilter = page.getByPlaceholder('Type for hints...').first();
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.tableBody = page.locator('.oxd-table-body');
    this.rows = page.locator('.oxd-table-card');
  }

  /** Navigate PIM -> Employee List purely through the UI. */
  async open(): Promise<void> {
    await this.openModule('PIM');
    await this.clickWhenReady(this.employeeListTab);
    await this.waitForPageReady();
    await expect(this.searchButton).toBeVisible();
  }

  /** Search by (part of) the employee name and wait for the grid to refresh. */
  async searchByName(name: string): Promise<void> {
    await this.fillWhenReady(this.nameFilter, name);
    await this.clickWhenReady(this.searchButton);
    await this.waitForPageReady();
    await expect(this.tableBody).toBeVisible();
  }

  /**
   * Locator for rows that match a full name. A record is identified by the
   * relationship "a row that CONTAINS a cell with the exact first name AND a
   * cell with the exact last name" — driven entirely by text + DOM structure,
   * independent of Employee ID or ordering.
   */
  rowsWithName(first: string, last: string): Locator {
    return this.rows
      .filter({ has: this.page.getByText(first, { exact: true }) })
      .filter({ has: this.page.getByText(last, { exact: true }) });
  }

  /** Ticks the checkbox of a given row via its OXD checkbox control. */
  private async selectRow(row: Locator): Promise<void> {
    // The native <input> is visually hidden; clicking the styled wrapper toggles it.
    await row.locator('.oxd-checkbox-wrapper').first().click();
  }

  /**
   * Deletes duplicates of the given name until exactly one record remains.
   *
   * Strategy: the duplicate SET is identified by name (text). All matches are
   * identical by design, so which single record survives is irrelevant — we
   * simply preserve one and select the rest for deletion. Selection happens
   * through the real UI checkboxes; no row is targeted by a static index or an
   * nth-child selector as the primary strategy.
   *
   * @returns how many rows were selected and deleted.
   */
  async deleteDuplicatesKeepingOne(first: string, last: string): Promise<number> {
    const matches = this.rowsWithName(first, last);
    const total = await matches.count();
    if (total <= 1) {
      return 0;
    }

    const toDelete = total - 1;
    // Select every matching duplicate except one (the last-rendered one stays).
    for (let i = 0; i < toDelete; i++) {
      await this.selectRow(matches.nth(i));
    }

    await this.confirmDeleteSelected();
    return toDelete;
  }

  /** Clicks "Delete Selected" and confirms the modal dialog. */
  private async confirmDeleteSelected(): Promise<void> {
    await this.clickWhenReady(this.page.getByRole('button', { name: /Delete Selected/i }));

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await this.clickWhenReady(dialog.getByRole('button', { name: /Yes, Delete/i }));
    await expect(dialog).toBeHidden();

    await this.waitForPageReady();
    await expect(this.tableBody).toBeVisible();
  }
}
