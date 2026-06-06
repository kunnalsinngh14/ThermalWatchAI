# Handoff Report: M2 Secondary Bugs

## Observation
1. **Admin Routing**: `frontend/src/App.jsx` lines 40-42 define the routes for `/admin/plants`, `/admin/units`, and `/admin/engineers`. The user prompt indicates these are currently scrambled (e.g., `/admin/plants` rendering "Manage Engineering Personnel"). While local inspection of `App.jsx` currently shows correct mappings (e.g. `element={<ManagePlantsPage />}`), any remaining scramble requires explicit verification of the imported components and their assigned paths.
2. **Recharts Warnings**: `frontend/src/components/dashboard/RequestTracker.jsx` (line 25) and `TelemetryChart.jsx` (line 26) both use `<ResponsiveContainer width="100%" height="100%">`. Recharts throws `width(-1) and height(-1)` warnings when parent containers temporarily have no dimensions during initial flex layout.
3. **Accessibility**: `frontend/src/components/common/Input.jsx` (lines 7-11) contains a `<label>` but lacks a `htmlFor` attribute linking it to the underlying `<input>`. Furthermore, `id` and `name` attributes are not strictly enforced.
4. **DOM**: `frontend/src/components/layout/LoginModal.jsx` (line 56) contains `<input type="password">` but is missing the required `autoComplete="current-password"` attribute.

## Logic Chain
1. **Admin Routing**: To resolve the scramble, we must explicitly ensure that `/admin/plants` renders `<ManagePlantsPage />`, `/admin/units` renders `<ManageUnitsPage />`, and `/admin/engineers` renders `<ManageEngineersPage />` in `App.jsx`, and that the `import` statements at the top of the file point to the correct file paths without aliases.
2. **Recharts Warnings**: Since `width="100%"` and `height="100%"` are already present, adding `minWidth={1}` and `minHeight={1}` directly to the `<ResponsiveContainer>` component will prevent Recharts from calculating negative dimensions during the initial render phase.
3. **Accessibility**: Modifying `Input.jsx` to dynamically generate or accept an `id` prop, and setting `htmlFor={id}` on the label and `id={id}` on the input will resolve the accessibility warning and properly associate the label.
4. **DOM**: Adding `autoComplete="current-password"` to the password input in `LoginModal.jsx` will satisfy DOM and browser autofill requirements.

## Caveats
- The codebase locally appears to already have the correct `App.jsx` route mappings (`/admin/plants` mapped to `<ManagePlantsPage />`). It is possible the scramble exists in a separate branch, or the issue description refers to an older state. The implementer must enforce the correct mapping regardless.

## Conclusion
The M2 secondary bugs can be resolved with the following specific changes:
1. **App.jsx**: Verify and force the correct imports and route elements:
   - `<Route path="/admin/plants" element={<ManagePlantsPage />} />`
   - `<Route path="/admin/units" element={<ManageUnitsPage />} />`
   - `<Route path="/admin/engineers" element={<ManageEngineersPage />} />`
2. **Recharts**: In `RequestTracker.jsx` and `TelemetryChart.jsx`, update the container to: `<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>`.
3. **Input.jsx**: Add an `id` to the `<input>` and `htmlFor` to the `<label>`. For example: `<label htmlFor={props.id || generatedId}>...` and `<input id={props.id || generatedId} ...>`.
4. **LoginModal.jsx**: Add `autoComplete="current-password"` to the password `<input>` field.

## Verification Method
- **Admin Routing**: Run the frontend (`npm run dev`), navigate to `/admin/plants`, and visually confirm the title says "Manage Plants". Repeat for units and engineers.
- **Recharts Warnings**: Open the browser console on the dashboard and ensure no `width(-1) and height(-1)` Recharts warnings appear during initial render.
- **Accessibility/DOM**: Use a tool like Lighthouse or inspect the HTML DOM to confirm labels are associated with inputs via `id`, and that the password field has `autoComplete="current-password"`.
