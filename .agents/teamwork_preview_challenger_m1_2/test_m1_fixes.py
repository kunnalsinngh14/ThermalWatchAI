import sys
import os
import unittest
import json
import jwt
import datetime

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from app import app
from models import db, Request, Plant, Unit

class TestM1Fixes(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SECRET_KEY'] = 'test_secret'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.drop_all()

    def _get_token(self, role='admin'):
        token = jwt.encode({
            'user_id': 1,
            'email': 'admin@test.com',
            'role': role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return token

    def test_predict_invalid_telemetry_returns_400(self):
        token = self._get_token(role='engineer')
        headers = {'Authorization': f'Bearer {token}'}
        payload = {
            'telemetry': {
                'rpm': 'invalid_string',
                'steamTemp': 500,
                'pressure': 15
            }
        }
        res = self.app.post('/api/predict', json=payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertIn('Invalid telemetry value', data['message'])

    def test_predict_valid_telemetry_returns_200_and_serializes_json(self):
        token = self._get_token(role='engineer')
        headers = {'Authorization': f'Bearer {token}'}
        payload = {
            'telemetry': {
                'rpm': '3000',
                'steamTemp': 500,
                'pressure': 15
            }
        }
        res = self.app.post('/api/predict', json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('confidence_score', data)
        self.assertIsInstance(data['confidence_score'], float)

    def test_get_requests_with_null_relations(self):
        token = self._get_token(role='admin')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Insert a request with null created_at, non-existent plant, non-existent unit
        with app.app_context():
            # Not creating any plant or unit, so plant_id and unit_id will be orphaned
            req = Request(
                plant_id=999,
                unit_id=999,
                engineer_id=1,
                priority='high',
                fault_type='Test Fault',
                confidence_score=95.0,
                status='open'
            )
            # simulate null created_at
            req.created_at = None
            db.session.add(req)
            db.session.commit()
            
        res = self.app.get('/api/requests', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['plantName'], 'Unknown Plant')
        self.assertEqual(data[0]['unitId'], 'Unknown')
        self.assertEqual(data[0]['timestamp'], 0)

if __name__ == '__main__':
    unittest.main()
