# E2E Test Infra: Thermal Plant Monitoring Platform

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Fault Detection Diagnostics | PRD §4.2, §4.2.1    | 5      | 5      | ✓      |
| 2 | Raise Request Pipeline      | PRD §4.2.2          | 5      | 5      | ✓      |
| 3 | Request Hub Display & Sort  | PRD §4.3            | 5      | 5      | ✓      |
| 4 | Request Hub Admin Actions   | PRD §4.3            | 5      | 5      | ✓      |

## Test Architecture
- Test runner: `npx playwright test` (in frontend directory)
- Test case format: Playwright `.spec.ts` files
- Directory layout: `frontend/e2e/` (or `frontend/tests/`)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Engineer detects fault, raises high priority request | F1, F2 | Medium |
| 2 | Admin reviews hub, sorts by priority, repairs unit | F3, F4 | Medium |
| 3 | Admin reviews hub, drops failed unit after sorting | F3, F4 | Medium |
| 4 | Engineer detects multiple faults, raises multiple requests | F1, F2 | High |
| 5 | Engineer checks hub sorting (read-only), Admin actions hidden | F3 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature (20 total)
- Tier 2: ≥5 per feature (where boundaries exist, 20 total)
- Tier 3: pairwise coverage of major feature interactions (4 total)
- Tier 4: ≥5 realistic application scenarios (5 total)
