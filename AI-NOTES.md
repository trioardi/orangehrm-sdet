# Catatan Penggunaan AI (Stage 3 — AI-Assisted Improvement)

AI (Claude) was used as a pair-programmer to scaffold and refine the suite. Its
output was reviewed line by line and validated against the actual OrangeHRM DOM
and the task rules — nothing was accepted blindly.

## Prompt yang digunakan

> "Create a Playwright + TypeScript UI automation test for OrangeHRM Employee
> Management: log in, create 5 employees named 'Mardi', then find the duplicates
> and delete them until 1 remains. Use the Page Object Model. No hard waits, no
> nth-child, no static index as the primary selector, do not rely on Employee
> ID. Locators must use text / DOM structure / element relationships, with clear
> assertions and a clean, reusable structure."

Follow-up prompts covered: reducing flakiness, making the run repeatable on a
shared demo, and identifying duplicate rows by name rather than position.

## Konteks yang diberikan ke AI

- The technical-test brief (stages, rules, target site, credentials).
- That the target is the OrangeHRM OXD component library (custom `.oxd-*` grid,
  hidden checkbox inputs, autocomplete name filter, redirect-after-save).

## Output dari AI

- Full project scaffold: `playwright.config.ts`, POM classes, spec, README.
- Locator strategy based on `getByRole` / `getByPlaceholder` and structural
  `.filter({ has: getByText(..., { exact: true }) })` row matching.
- Spinner-aware waiting helper instead of fixed sleeps.

## Bagian yang digunakan

- Page Object Model split (Login / AddEmployee / EmployeeList / Base).
- Role- and text-based locators.
- Auto-retrying `toHaveCount` assertions for the before/after validation.

## Bagian yang diperbaiki

- **Row identification:** an early suggestion matched a single cell by full
  name. That fails because first and last names live in separate cells — it was
  changed to require a row containing *both* exact-text cells.
- **Repeatability:** searching a bare "Mardi" is non-deterministic on a shared
  demo, so a run-scoped surname was introduced to isolate each run's data while
  keeping the required identical first name.
- **Delete confirmation:** waiting on a success toast was fragile (it
  auto-dismisses); replaced with re-querying the grid and asserting the count.

## Bagian yang ditolak

- **Hard waits** (`page.waitForTimeout`) proposed to "stabilize" the grid —
  rejected; replaced with explicit spinner/visibility waits and web-first
  assertions.
- **`nth-child` / fixed-index checkbox selectors** — rejected as they violate
  the rules and break when the row order changes.
- **Selecting rows by Employee ID** — rejected; identification is name-based.

## Alasan teknis

Every rejected item either violated an explicit rule (no hard waits, no
nth-child/static index, no Employee ID dependency) or introduced flakiness. The
accepted items keep the suite readable, deterministic, and resilient to DOM
ordering — which is exactly what the duplicate-handling task stresses.
