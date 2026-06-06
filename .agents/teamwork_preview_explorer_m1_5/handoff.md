# Handoff Report: Fault Check Model Input Parsing Fix

## 1. Observation
- `SCOPE.md` states the milestone is to fix the fault check model error and Raised Requests screen loading issue.
- `gate_failure_iter_1.md` explains that Iteration 1 failed because the `float()` casting in `backend/ml_service.py` is only wrapped in a `try...except ValueError` block.
- `gate_failure_iter_1.md` notes that non-scalar JSON arrays (like `[]`) or `null` (parsed as `None`) cause `float()` to throw a `TypeError` rather than a `ValueError`. This `TypeError` is unhandled and results in a 500 Server Error via `backend/routes.py`.
- Viewing `backend/ml_service.py` (lines 38-46) confirms the logic:
  ```python
      try:
          if 'rpm' in telemetry:
              input_dict['Velocity (m/s)'] = float(telemetry['rpm'])
          if 'steamTemp' in telemetry:
              input_dict['Main steam temperature (turbine side) (℃)'] = float(telemetry['steamTemp'])
          if 'pressure' in telemetry:
              input_dict['Main steam pressure (turbine side) (MPa)'] = float(telemetry['pressure'])
      except ValueError:
          raise ValueError("Invalid telemetry value, must be numeric")
  ```
- Viewing `backend/routes.py` (lines 202-221) confirms that the `/predict` route catches `ValueError` explicitly to return a 400 Bad Request, but falls back to returning a generic 500 Server Error for all other exceptions (`Exception as e`), which would include `TypeError`.

## 2. Logic Chain
1. The objective is to return a 400 Bad Request for any invalid telemetry input type (including strings, arrays, and nulls).
2. The current implementation in `ml_service.py` safely catches string inputs using `except ValueError`, triggering a 400 response from `routes.py`.
3. If an array (`[]`) or `None` is provided for a telemetry value, `float()` raises a `TypeError` instead of a `ValueError`.
4. Additionally, if the `telemetry` object itself is not iterable or accessible like a dictionary (e.g., if it is an integer), the expression `'rpm' in telemetry` will also raise a `TypeError`.
5. Because `TypeError` is not caught by `ml_service.py`, it propagates to `routes.py`, falling into the generic `except Exception` handler and yielding an incorrect 500 status code.
6. By modifying the `except` block in `ml_service.py` to catch `(ValueError, TypeError)`, any `TypeError` raised during parsing or casting will be caught and re-raised as a `ValueError`. This leverages the existing `ValueError` handler in `routes.py` to correctly issue a 400 response.

## 3. Caveats
- I did not investigate the Raised Requests screen loading issue mentioned in `SCOPE.md`, as the prompt explicitly scopes this analysis to refining the fix for the Fault check model error's `TypeError` vulnerability.
- Assumes no other downstream functions within `predict_fault` depend on catching `TypeError` for alternative handling.

## 4. Conclusion
To fix the `TypeError` vulnerability, the `except ValueError:` clause at line 45 in `backend/ml_service.py` must be updated to `except (ValueError, TypeError):`. This ensures that `TypeError` exceptions from both invalid data types inside the dictionary (`[]`, `None`) and from an invalid `telemetry` root object are caught, re-raising as a `ValueError` which the controller already maps to a 400 Bad Request.

**Proposed Code Change (`backend/ml_service.py`, lines 38-47):**
```python
    try:
        if 'rpm' in telemetry:
            input_dict['Velocity (m/s)'] = float(telemetry['rpm'])
        if 'steamTemp' in telemetry:
            input_dict['Main steam temperature (turbine side) (℃)'] = float(telemetry['steamTemp'])
        if 'pressure' in telemetry:
            input_dict['Main steam pressure (turbine side) (MPa)'] = float(telemetry['pressure'])
    except (ValueError, TypeError):
        raise ValueError("Invalid telemetry value, must be numeric")
```

## 5. Verification Method
1. Make the change to `backend/ml_service.py`.
2. Start the backend server.
3. Send POST requests to `/api/predict` with malformed telemetry values.
   - Example 1 (String): `{"telemetry": {"rpm": "invalid"}}`
   - Example 2 (Array): `{"telemetry": {"rpm": []}}`
   - Example 3 (Null): `{"telemetry": {"rpm": null}}`
   - Example 4 (Non-dict telemetry): `{"telemetry": 5}`
4. Verify that all responses return an HTTP status code of `400` with the message `"Invalid telemetry value, must be numeric"`. If any return `500`, the conclusion is invalidated.
