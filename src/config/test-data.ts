/**
 * Test data for the Employee Management flow.
 *
 * All five employees share the SAME first name ("Mardi") as required by the
 * task. To keep the test deterministic and repeatable on the *shared* public
 * demo (where other users may also create "Mardi" records), every run tags its
 * five records with a run-scoped last name. The five records are still exact
 * duplicates of one another (identical full name), which is what the duplicate-
 * handling logic must cope with — we simply isolate this run's dataset so the
 * assertions cannot be polluted by data created outside the test.
 */
export const DUPLICATE_FIRST_NAME = 'Mardi';
export const EMPLOYEES_TO_CREATE = 5;
export const EMPLOYEES_TO_KEEP = 1;

/** Builds a run-scoped last name, e.g. "Auto481923". */
export function buildRunScopedLastName(runId: string): string {
  return `Auto${runId}`;
}
