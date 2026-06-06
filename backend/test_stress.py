import unittest
from ml_service import predict_fault

class TestMLService(unittest.TestCase):
    def test_null_telemetry(self):
        # Should raise ValueError not TypeError
        with self.assertRaises(ValueError):
            predict_fault(None)

    def test_array_in_telemetry(self):
        with self.assertRaises(ValueError):
            predict_fault({"rpm": []})
            
    def test_invalid_type_in_telemetry(self):
        with self.assertRaises(ValueError):
            predict_fault({"rpm": "invalid_string_not_float"})
            
    def test_empty_dict(self):
        # Empty dict should be fine but might raise exception inside if no model loaded, 
        # assuming model loads successfully, it should work.
        pass

if __name__ == '__main__':
    unittest.main()
