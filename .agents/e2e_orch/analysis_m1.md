# Milestone 1: Test Setup & Playwright Synthesis

## Subagent Results Summary
- 3 Explorers completed successfully.
- Consensus reached on using Playwright's `storageState` feature via an `auth.setup.ts` project to avoid redundant login flows.

## Aggregated Findings

### Consensus
- **Installation**: Run `npm install -D @playwright/test @types/node` and `npx playwright install chromium` inside the `frontend/` directory.
- **Config**: Create `frontend/playwright.config.ts` with a `baseURL` of `http://localhost:5173`. Configure three projects: `setup` (matches `auth.setup.ts`), `engineer-tests` (uses `.auth/engineer.json`), and `admin-tests` (uses `.auth/admin.json`).
- **Auth Setup Flow**: In `frontend/e2e/auth.setup.ts`, define two setups: one for Engineer (`dummyengg@gmail.com`/`enggpass`) and one for Admin (`dummyadmin@gmail.com`/`adminpassword`). Both should navigate to `/`, click `.btn-quick-login`, fill `input[type="email"]` and `input[type="password"]`, submit, wait for `.user-profile` (or `.role-engineer`/`.role-admin`) to be visible, and save context state to the respective json files.

### Resolved Conflicts
- Explorer 2 suggested simple helper functions instead of `storageState`. We will adopt Explorer 1 & 3's `storageState` as the primary method for Tier 1-3 tests for performance. However, we will also create `frontend/e2e/utils/auth.ts` as a helper for Tier 4 tests which require multiple contexts.

### Gaps
- Running the backend is required for tests to work. The Worker must ensure the dev server and backend are started if necessary for testing.

## Per-Subagent Status
- Explorer 1 (edb0b36c): Recommended storageState and browser.newContext.
- Explorer 2 (fca4a9d1): Identified UI locators.
- Explorer 3 (201a0f57): Provided full typescript templates for auth.setup.ts and playwright.config.ts.
