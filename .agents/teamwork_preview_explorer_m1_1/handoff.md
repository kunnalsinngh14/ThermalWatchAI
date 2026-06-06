# Investigation Handoff

## 1. Observation
- The "text is invalid" error traces back to the backend `POST /api/predict` endpoint, which throws a 500 error (`ValueError: could not convert string to float`) when text data is submitted instead of valid numeric telemetry.
- In `backend/ml_service.py`, `float(telemetry['rpm'])` (and others) are executed without try-catch, causing the server to crash if non-numeric strings are passed.
- For the "Raised Requests screen loading issue", the frontend `RequestsPage.jsx` successfully renders, but the backend `GET /api/requests` endpoint assumes `plant` and `unit` always exist (`plant.name`, `unit.unit_number`). If a database inconsistency occurs where a `Unit` or `Plant` is missing but the `Request` remains, this endpoint will throw an `AttributeError` and return a 500 status, preventing the screen from loading.

## 2. Logic Chain
- The ML prediction requires numerical data. If the API receives invalid strings, the implicit casting to `float` fails. Catching this `ValueError` and returning a 400 Bad Request with a clear message will eliminate the 500 crashes.
- The `get_requests` backend endpoint fetches open requests and joins them with `Plant` and `Unit` objects. Although cascades are configured in `models.py`, any stray requests without a valid `plant` or `unit` will cause a server crash, halting the React `useEffect` data fetch. Adding a null check prevents this.

## 3. Caveats
- I did not test the actual Playwright E2E suite as it's not implemented yet.
- I assumed the "Raised Requests screen" issue on the frontend is primarily an API crash issue as the frontend logic (`handleSort` and `useEffect`) is stable and does not contain infinite loops.

## 4. Conclusion
**Fix Strategy 1 (Predict API)**: In `backend/ml_service.py` (or `routes.py`), wrap the `float()` casting in a `try...except ValueError` block. Return a 400 error (e.g., `{'message': 'Invalid telemetry data. Must be numbers.'}`) instead of letting the application crash.
**Fix Strategy 2 (Requests API)**: In `backend/routes.py` `get_requests`, add defensive null checks (`if not plant or not unit: continue`) before accessing `.name` and `.unit_number` to prevent `AttributeError` from breaking the entire page load.

## 5. Verification Method
- **Predict**: Make a POST request to `/api/predict` with `{"telemetry": {"rpm": "invalid_text"}}`. It should return a 400 status with an error message, not 500.
- **Requests**: Manually delete a `Unit` from the DB without triggering cascade (if possible) or mock a `Request` with an invalid `unit_id`, then load `/api/requests`. It should successfully return the remaining valid requests.
