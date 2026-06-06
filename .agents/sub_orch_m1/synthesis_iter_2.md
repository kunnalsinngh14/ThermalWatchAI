# Synthesis Report - Iteration 2

## Consensus
All Explorers identified that the 500 error on malformed non-scalar inputs (`null`, arrays) is caused by `float()` throwing a `TypeError`. Because only `ValueError` was caught in `ml_service.py`, the `TypeError` bubbled up to `routes.py` and resulted in a 500 Server Error.

## Recommended Implementation
1. **`backend/ml_service.py`**:
   - Verify that `telemetry` is a dictionary (e.g. `if not isinstance(telemetry, dict): raise ValueError(...)`).
   - Update the try-catch block around the `float()` conversions to catch both exceptions: `except (ValueError, TypeError):`.
   - When caught, raise a custom `ValueError("Invalid telemetry values")`.
2. **`backend/routes.py`**:
   - Keep the `/predict` exception handler as it is from Iteration 1 (catching `ValueError` to return a 400 Bad Request). By ensuring `ml_service.py` raises `ValueError`, this route will automatically work correctly.
