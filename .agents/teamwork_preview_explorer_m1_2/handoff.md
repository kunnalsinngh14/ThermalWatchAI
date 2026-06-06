# Handoff Report

## 1. Observation
- **Fault check model "text is invalid" error**: In `backend/ml_service.py`, the function `predict_fault` casts telemetry string inputs directly to float (`float(telemetry['rpm'])`, etc.). If non-numeric text is passed, Python throws a `ValueError: could not convert string to float`, resulting in a 500 error from the `POST /api/predict` route. Furthermore, the model returns a `numpy.float64` for `confidence_score`, which is not natively JSON serializable by Flask, triggering a `TypeError`.
- **Raised Requests screen loading issue**: In `backend/routes.py` inside the `get_requests` function, `r.created_at.timestamp()` is called without checking if `r.created_at` is `None`. Additionally, `plant.name` and `unit.unit_number` are accessed without ensuring `plant` and `unit` actually exist. If the DB contains a `None` creation date or a orphaned request, an `AttributeError` is thrown causing the endpoint to fail with a 500 error, resulting in an empty or broken screen on the frontend.

## 2. Logic Chain
1. The frontend form allows text input for telemetry (or can be bypassed). When `predict_fault` receives this, it crashes on `float()` conversion. Adding a try-catch for `ValueError` ensures a graceful response.
2. `np.float64` returned from the sklearn model cannot be serialized by `flask.jsonify` natively in the current setup. Converting `confidence_score` to a built-in Python `float()` prevents a 500 internal server error.
3. The `GET /api/requests` endpoint does not validate if `r.created_at`, `plant`, or `unit` are non-null before accessing their properties. If any of these are `None`, the server throws an `AttributeError`, causing the frontend's fetch to fail and the screen to remain empty/broken.

## 3. Caveats
- Did not extensively check other frontend components for related timestamp formatting issues, as the main failure point identified is the backend crashing and returning a 500 error.
- Assumes the parent agent will verify the fixes through the E2E test suite.

## 4. Conclusion
**Recommended Fix Strategy:**
1. **`backend/ml_service.py`**:
   - Wrap the float conversions in a `try-except ValueError` block. Raise a clear error if invalid.
   - Convert `confidence_score` to a standard Python float: `float(round(confidence_score, 2))`.
2. **`backend/routes.py`**:
   - In `get_requests`, add null-checks for `r.created_at` when calculating `timestamp`. Use a fallback like `int(r.created_at.timestamp() * 1000) if r.created_at else 0`.
   - Add null-checks for `plant` and `unit` before accessing their properties (`plant.name if plant else "Unknown"`, etc.).

## 5. Verification Method
- **Bug 1 (Fault check)**: Send a `POST` request to `/api/predict` with `{"telemetry": {"rpm": "invalid text", "steamTemp": "540", "pressure": "14.5"}}`. Verify it returns a 400 Bad Request with an appropriate message instead of a 500 Internal Server Error. Ensure valid data returns a 200 response successfully serialized.
- **Bug 2 (Requests Screen)**: Insert a dummy request in the database with a `NULL` `created_at` date or an invalid `plant_id`. Access the Raised Requests screen. The screen should load properly without returning a 500 server error.
