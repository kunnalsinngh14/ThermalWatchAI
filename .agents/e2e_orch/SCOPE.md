# Scope: E2E Test Suite

## Architecture
- Implementation: frontend Playwright test specs mapped to PRD requirements.
- Target endpoints: React web UI running locally (usually localhost:5173).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Setup & Playwright | Initialize Playwright in frontend, setup auth helpers | none | DONE |
| 2 | Fault Detection Tests | Implement Tiers 1-2 tests for Fault Detection Diagnostics and Raise Request Pipeline | 1 | PLANNED |
| 3 | Request Hub Tests | Implement Tiers 1-2 tests for Hub Display, Sorting, and Admin Actions | 1 | PLANNED |
| 4 | Integration & Workload | Implement Tier 3 (Cross-feature) and Tier 4 (Workload) scenarios | 2, 3 | PLANNED |

## Interface Contracts
- Playwright config uses standard assertions.
- Requires dummy credentials: `dummyengg@gmail.com`/`enggpass` and `dummyadmin@gmail.com`/`adminpassword`.
