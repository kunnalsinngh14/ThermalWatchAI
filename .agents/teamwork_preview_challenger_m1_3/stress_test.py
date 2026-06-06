import sys
import os

backend_path = r"C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from ml_service import predict_fault

def run_test(name, telemetry_input, expected_exception, expected_message=None):
    try:
        predict_fault(telemetry_input)
        print(f"FAIL: {name} - Expected {expected_exception.__name__} but got no exception.")
        return False
    except expected_exception as e:
        if expected_message and expected_message not in str(e):
            print(f"FAIL: {name} - Expected message '{expected_message}' but got '{str(e)}'.")
            return False
        print(f"PASS: {name}")
        return True
    except Exception as e:
        print(f"FAIL: {name} - Expected {expected_exception.__name__} but got {type(e).__name__}: {e}")
        return False

tests = [
    ("Null telemetry", None, ValueError, "Invalid telemetry values"),
    ("List telemetry", [], ValueError, "Invalid telemetry values"),
    ("String telemetry", "test", ValueError, "Invalid telemetry values"),
    ("Dict with list value (TypeError on float)", {"rpm": []}, ValueError, "Invalid telemetry values"),
    ("Dict with dict value (TypeError on float)", {"steamTemp": {}}, ValueError, "Invalid telemetry values"),
    ("Dict with None value (TypeError on float)", {"pressure": None}, ValueError, "Invalid telemetry values"),
    ("Dict with string non-convertible value (ValueError on float)", {"rpm": "abc"}, ValueError, "Invalid telemetry values"),
]

all_passed = True
for name, val, exc, msg in tests:
    if not run_test(name, val, exc, msg):
        all_passed = False

if all_passed:
    print("\nALL STRESS TESTS PASSED.")
else:
    print("\nSOME STRESS TESTS FAILED.")
    sys.exit(1)
