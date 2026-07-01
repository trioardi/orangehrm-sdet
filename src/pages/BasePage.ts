import { Locator, Page } from '@playwright/test';

/**
 * Shared behaviour for every page object.
 *
 * OrangeHRM is a single-page app built on the OXD component library. The whole
 * left navigation is consistent across screens, so the menu helper lives here.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Opens a top-level module from the left sidebar by its visible text.
   * Uses the accessible link role + name (text-based, position-independent).
   */
  protected async openModule(name: string): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).click();
    await this.page.waitForURL(`**/${name.toLowerCase()}/**`);
  }

  /** Waits for the OXD loading spinner to disappear, if one is shown. */
  protected async waitForSpinnerToClear(): Promise<void> {
    const spinner = this.page.locator('.oxd-loading-spinner');
    if (await spinner.count()) {
      await spinner.first().waitFor({ state: 'hidden' }).catch(() => undefined);
    }
  }

  /** Waits for the page DOM to settle and any active spinner to clear. */
  protected async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.waitForSpinnerToClear();
  }

  /** Waits for the page network to become idle, with a fallback to DOM loaded. */
  protected async waitForNetworkIdle(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => undefined);
    });
  }

  /** Waits for a locator to become visible before clicking it. */
  protected async clickWhenReady(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /** Waits for a field to become visible before filling it. */
  protected async fillWhenReady(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
  }
}
