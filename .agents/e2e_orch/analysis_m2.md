# Milestone 2: Fault Detection Tests Synthesis

## Subagent Results Summary
- 3 Explorers completed the analysis of `DiagnosticForm.jsx`, `RaiseRequestModal.jsx`, and `ResultCard.jsx`.
- They identified all DOM locators and defined a matrix of 20 tests (10 for Fault Detection, 10 for Raise Request Pipeline) covering Tier 1 and Tier 2 criteria.

## Aggregated Findings
- **Locators**: 
  - `input[name="plantId"]` (or select), `input[name="unitId"]`, `input[name="rpm"]`, `input[name="steamTemp"]`, `input[name="pressure"]`.
  - Buttons: `Execute Diagnostics`, `Raise Request`, `Submit Request`, `Cancel`.
- **Test Matrix (20 tests)**:
  - F1 (Fault Detection): Happy paths testing normal/faulty execution, UI gauge display, and critical alerts. Boundary tests checking unit boundaries (1-20), empty states, and mock 500 errors.
  - F2 (Raise Request): Happy paths testing High/Medium/Low priority submissions and Cancel button. Boundary tests verifying absent button on 'Normal' status, modal re-rendering, and API failure handling.
- **Critical Update Implementation**:
  - Test `F1-T2-A` addresses the invalid text crash. Playwright natively restricts `.fill()` on `type="number"`, so the test must bypass this via `el.type = 'text'` using `.evaluate()`. It then verifies that the UI handles it gracefully (via validation message or toast), ensuring no 500 crash brings down the UI.
- **Implementation Strategy**:
  - Tests go into `frontend/e2e/fault-detection.spec.ts`.
  - Wrap them in `test.describe('Fault Detection & Raise Request (Engineer)', () => { ... })`.
  - Use `test.beforeEach` to `page.goto('/fault-detection')`, which automatically uses `.auth/engineer.json` via Playwright's project setup.

## Gaps
- None. The Explorers covered all edge cases and the critical requirement.
