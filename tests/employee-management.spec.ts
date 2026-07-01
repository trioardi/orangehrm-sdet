import { test, expect } from '@playwright/test';
import { ENV } from '../src/config/env';
import { LoginPage } from '../src/pages/LoginPage';
import { AddEmployeePage } from '../src/pages/AddEmployeePage';
import { EmployeeListPage } from '../src/pages/EmployeeListPage';
import {
  DUPLICATE_FIRST_NAME,
  EMPLOYEES_TO_CREATE,
  EMPLOYEES_TO_KEEP,
  buildRunScopedLastName,
} from '../src/config/test-data';

/**
 * OrangeHRM - Employee Management duplicate-handling flow.
 *
 * Purpose of this suite:
 * 1. Create 5 employee records with the same first name to generate duplicates.
 * 2. Search for those duplicates in Employee List.
 * 3. Keep exactly one duplicate and delete the rest.
 *
 * The tests run serially because Stage 2 depends on the data created in Stage 1.
 * Each test logs in separately in beforeEach so the scenario starts from a clean,
 * known state and the shared demo data is not affected by earlier test sessions.
 */
test.describe.serial('OrangeHRM Employee Management', () => {
  // Use a short, unique suffix so the test data stays isolated on the shared demo site.
  // The first name must stay "Mardi" for the requirement, while the last name is
  // changed per run to avoid accidentally matching other users' employee records.
  const runId = `${Date.now()}`.slice(-6);
  const firstName = DUPLICATE_FIRST_NAME;
  const lastName = buildRunScopedLastName(runId);

  let loginPage: LoginPage;
  let addEmployeePage: AddEmployeePage;
  let employeeListPage: EmployeeListPage;

  test.beforeEach(async ({ page }) => {
    // Prepare page objects for each test so the flow stays readable and reusable.
    loginPage = new LoginPage(page);
    addEmployeePage = new AddEmployeePage(page);
    employeeListPage = new EmployeeListPage(page);

    // Start from the login page and authenticate with the configured OrangeHRM user.
    await loginPage.goto();
    await loginPage.login(ENV.username, ENV.password);
  });

  test('TC-01: Create 5 duplicate employee records with first name Mardi', async () => {
    // Create five employees in sequence. Each employee shares the same required
    // first name so the later duplicate-handling step has something to process.
    for (let i = 0; i < EMPLOYEES_TO_CREATE; i++) {
      await addEmployeePage.open();
      await addEmployeePage.addEmployee(firstName, lastName);
    }

    // After creation, go to the employee list and confirm the exact duplicate set
    // exists in the UI. This is the main proof that Stage 1 completed correctly.
    await employeeListPage.open();
    await employeeListPage.searchByName(firstName);
    await expect(
      employeeListPage.rowsWithName(firstName, lastName),
      `expected ${EMPLOYEES_TO_CREATE} duplicate "${firstName} ${lastName}" records`,
    ).toHaveCount(EMPLOYEES_TO_CREATE);
  });

  test('TC-02: Remove duplicate Mardi employees and keep exactly one record', async () => {
    // Re-open the list and search for the duplicate family by first name.
    await employeeListPage.open();
    await employeeListPage.searchByName(firstName);

    // Before deleting, make sure the duplicate set really exists.
    // This is an important guardrail so later failures are easier to diagnose.
    await expect(
      employeeListPage.rowsWithName(firstName, lastName),
      'precondition: 5 duplicates should exist before delete',
    ).toHaveCount(EMPLOYEES_TO_CREATE);

    // Keep one record and remove the rest by selecting the duplicates in the UI.
    const deleted = await employeeListPage.deleteDuplicatesKeepingOne(firstName, lastName);
    expect(deleted).toBe(EMPLOYEES_TO_CREATE - EMPLOYEES_TO_KEEP);

    // After deletion, search again and confirm that exactly one employee with the
    // required name still exists. This is the final business assertion for Stage 2.
    await employeeListPage.searchByName(firstName);
    await expect(
      employeeListPage.rowsWithName(firstName, lastName),
      'exactly one Mardi record must remain after delete',
    ).toHaveCount(EMPLOYEES_TO_KEEP);
  });
});
