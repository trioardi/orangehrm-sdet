# SDET UI Automation Test — OrangeHRM Employee Management

UI automation for the OrangeHRM demo covering the Employee Management flow:
create five employees that share the same name, then delete the duplicates
until exactly one remains — all through the UI.

- Target: https://opensource-demo.orangehrmlive.com/
- Flow: Login → PIM → Add Employee (×5) → Employee List → search → select via
  checkbox → delete down to 1 → validate before & after.

## AI Usage Disclaimer

This solution was built with the assistance of **Claude (Anthropic AI)** as a
pair-programming tool. This is intentional and transparent: in my current role,
using AI in our daily engineering work is a normal, encouraged practice, and I
wanted this submission to reflect how a modern QA/SDET team actually operates —
pairing automation expertise with the latest AI tooling to move faster.

Crucially, **AI output was never accepted blindly.** Every locator, wait
strategy, and assertion was reviewed line by line and validated against the real
OrangeHRM DOM and the technical-test rules to guard against hallucination or
brittle code. Where the AI suggested something that violated the rules (hard
waits, `nth-child`, Employee-ID-based selection) or introduced flakiness, it was
rejected and replaced. I can explain and defend every engineering decision in
this repository. A full breakdown of prompts, accepted output, corrected output,
and rejected output is in [AI-NOTES.md](./AI-NOTES.md).

## Screen Recording

A screen recording walking through the implementation and a live run is included
in the repository at
[`docs/Explanation short - Satrio Ardi.mov`](./docs/Explanation%20short%20-%20Satrio%20Ardi.mov).

## Framework

- **Playwright** with **TypeScript**
- **Page Object Model** for structure and reuse
- Chromium (configurable)

## How to Run the Test

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

## Project Structure

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
│   └── employee-management.spec.ts   # 2 serial tests: create (TC-01), delete (TC-02)
├── .github/workflows/playwright.yml  # CI: push/PR, manual dispatch, and nightly (06:00 UTC)
├── playwright.config.ts
├── AI-NOTES.md                 # Stage 3 — AI usage notes
└── README.md
```

## Locator Strategy

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

## Handling Duplicate Names

1. **Create** 5 employees with first name `Mardi` (Stage 1).
2. **Search** the Employee List by the run-scoped **full name** (`Mardi Auto<runId>`).
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
>
> Crucially, **every search filters by the full name, not the bare `Mardi`**.
> A first-name-only search on the public demo returns a large, paginated grid of
> everyone else's leftover `Mardi` records; that grid re-renders after loading
> and clears the checkbox selection mid-delete, which was a real source of
> flakiness. Filtering by `Mardi Auto<runId>` keeps the grid to exactly this
> run's five rows, so selection and deletion stay deterministic no matter how
> polluted the shared instance is.

## Assertion

- **Login** succeeds → app reaches the dashboard URL.
- **Stage 1** → exactly `5` matching records exist after creation.
- **Stage 2 (before)** → precondition of `5` duplicates.
- **Stage 2 (after)** → exactly `1` matching record remains.

All counts use auto-retrying `expect(locator).toHaveCount(n)` for stability.

## AI Usage

See [AI-NOTES.md](./AI-NOTES.md) for prompts, context, what was accepted,
improved, and rejected.

## Additional Notes

- **Creation is retried and confirmed by navigation.** Each employee save is
  confirmed by the app's redirect to the new employee's Personal Details page
  (a definitive success signal), and the whole open → fill → save flow retries
  up to 3× to absorb the demo's occasional slow/dropped saves — no hard waits.
- **Known limitation — shared-demo interference.** Because the target is the
  *public* demo, other people run this same "create/delete Mardi" task
  concurrently, and their first-name-only bulk-deletes can remove our rows even
  though our surname is unique. This is not preventable from the client. It is
  the one residual, environment-driven flake; CI runs with `retries: 1`
  (see [playwright.config.ts](./playwright.config.ts)), which re-runs the serial
  group and absorbs it. For a guaranteed-deterministic run, point `BASE_URL` at
  a private/Dockerized OrangeHRM instance.
- The flow leaves exactly one `Mardi` record behind (the required end state);
  it does not clean that record up so the result stays verifiable.
- Screenshots, video, and traces are captured automatically on failure
  (`test-results/`, `playwright-report/`).
