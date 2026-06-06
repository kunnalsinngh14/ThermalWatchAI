# Handoff Report: Fault Check Model Error (TypeError Vulnerability)

## Observation
In `backend/ml_service.py` lines 38-46:
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
The previous iteration only catches `ValueError`. However, `float([])`, `float({})`, or `float(None)` raises a `TypeError`.

In `backend/routes.py` lines 217-220:
```python
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500
```
Because `TypeError` is not caught and raised as a `ValueError` in `ml_service.py`, it propagates to `routes.py`, misses the `ValueError` except block, and hits the generic exception handler, resulting in a `500 Server Error` instead of the desired `400 Bad Request`.

Furthermore, if the `telemetry` object itself is passed as a non-dictionary (e.g. `None` or a string/array), evaluating `'rpm' in telemetry` will also raise a `TypeError` before even reaching the `float()` cast.

## Logic Chain
1. The gate failure indicates that when `null` or arrays are passed to `float()`, a `TypeError` occurs.
2. The endpoint in `routes.py` specifically listens for `ValueError` from `predict_fault` to return a `400` status.
3. Therefore, any type coercion error (`TypeError`) inside `predict_fault` must be captured and re-raised as a `ValueError` to integrate correctly with the existing routing logic.
4. Modifying the `except` block in `ml_service.py` to catch `(ValueError, TypeError)` safely ensures that all malformed types trigger the intended `ValueError`. 
5. Additionally, a safety check to ensure `telemetry` is a `dict` protects against top-level malformed payloads causing an unhandled `TypeError` during the `in` operation.

## Caveats
No caveats. The required scope is fully addressed by updating the exception handling in `ml_service.py`.

## Conclusion
Update `backend/ml_service.py` to catch both `ValueError` and `TypeError`. 
Additionally, handle the case where `telemetry` might not be a dictionary before processing it.

**Proposed Changes:**
In `backend/ml_service.py`, replace lines 38-46 with:
```python
    if not isinstance(telemetry, dict):
        raise ValueError("Telemetry data must be a dictionary")

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

## Verification Method
1. Start the Flask application.
2. Send a POST request to `/api/predict` with a payload containing invalid types (e.g. `{"telemetry": {"rpm": []}}`, `{"telemetry": {"rpm": null}}`, or `{"telemetry": []}`).
3. Verify that the response status code is `400 Bad Request` and not `500 Internal Server Error`.
