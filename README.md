# SDET UI Automation Test — OrangeHRM Employee Management

UI automation for the OrangeHRM demo covering the Employee Management flow:
create five employees that share the same name, then delete the duplicates
until exactly one remains — all through the UI.

- Target: https://opensource-demo.orangehrmlive.com/
- Flow: Login → PIM → Add Employee (×5) → Employee List → search → select via
  checkbox → delete down to 1 → validate before & after.

## Framework

- **Playwright** with **TypeScript**
- **Page Object Model** for structure and reuse
- Chromium (configurable)

## Cara Menjalankan Test

```bash
# 1. Install dependencies (also downloads the Chromium browser via postinstall)
npm install

# 2. (optional) provide your own environment / credentials
cp .env.example .env

# 3. Run the tests (headless)
npm test

# Watch the browser instead
npm run test:headed

# Open the HTML report after a run
npm run report
```

Requires Node.js 18+.

## Struktur Project

```
orangehrm-sdet/
├── src/
│   ├── config/
│   │   ├── env.ts              # Credentials/base URL from environment (no hardcoding in tests)
│   │   └── test-data.ts        # Names, counts, run-scoped surname helper
│   └── pages/                  # Page Object Model
│       ├── BasePage.ts         # Shared nav + spinner handling
│       ├── LoginPage.ts
│       ├── AddEmployeePage.ts
│       └── EmployeeListPage.ts # Search, checkbox selection, delete (core logic)
├── tests/
│   └── employee-management.spec.ts   # 3-stage flow
├── .github/workflows/playwright.yml  # CI: runs the suite on push/PR
├── playwright.config.ts
├── AI-NOTES.md                 # Stage 3 — AI usage notes
└── README.md
```

## Strategi Locator

Locators are **text / role / structural**, never brittle position selectors:

- **Role + accessible name** — `getByRole('button', { name: 'Save' })`,
  `getByRole('link', { name: 'PIM' })`.
- **Placeholder** for form fields — `getByPlaceholder('First Name')`.
- **Structural relationship** for grid rows — a target row is *"a table card
  that contains a cell with the exact first name AND a cell with the exact last
  name"* (`.filter({ has: getByText(..., { exact: true }) })`).

Explicitly **avoided**, per the rules: no `nth-child`, no static index as the
primary selection strategy, no reliance on **Employee ID**, and no hard waits
(`sleep`) — Playwright's web-first `expect`/auto-waiting and explicit spinner
waits handle timing.

## Handling Data dengan Nama Sama

1. **Create** 5 employees with first name `Mardi` (Stage 1).
2. **Search** the Employee List by name.
3. **Identify** the duplicate set by matching row text (first + last name),
   independent of ID or row order.
4. **Select** every duplicate except one via the real UI checkboxes.
5. **Delete Selected** and confirm the dialog.
6. **Re-query** and assert exactly one record remains.

Because the five records are identical by design, *which* single record
survives is irrelevant — only the surviving **count** matters, so the logic
keeps one arbitrary record and removes the rest.

> **Determinism on a shared demo:** the public demo is used by many people, so
> each run tags its 5 records with a run-scoped surname (`Auto<runId>`). The
> required first name is always `Mardi` and the five records remain exact
> duplicates of each other; the surname only isolates this run's dataset so
> assertions can't be polluted by data other users created. This trades a
> literal single "Mardi" for a repeatable, non-destructive test.

## Assertion

- **Login** succeeds → app reaches the dashboard URL.
- **Stage 1** → exactly `5` matching records exist after creation.
- **Stage 2 (before)** → precondition of `5` duplicates.
- **Stage 2 (after)** → exactly `1` matching record remains.

All counts use auto-retrying `expect(locator).toHaveCount(n)` for stability.

## Penggunaan AI

See [AI-NOTES.md](./AI-NOTES.md) for prompts, context, what was accepted,
improved, and rejected.

## Catatan Tambahan

- **Assumption:** the search by first name returns the run's records on the
  first page of results (the demo resets its data periodically, so accumulation
  is unlikely). On a heavily-populated instance you would search by the
  run-scoped surname instead to avoid pagination.
- The flow leaves exactly one `Mardi` record behind (the required end state);
  it does not clean that record up so the result stays verifiable.
- Screenshots, video, and traces are captured automatically on failure
  (`test-results/`, `playwright-report/`).
