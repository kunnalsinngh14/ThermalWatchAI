import os
import sys
from dotenv import load_dotenv

# Load env
env_path = r"C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\.env"
load_dotenv(env_path)

# Add backend to path
backend_path = r"C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\backend"
sys.path.append(backend_path)

from app import app
from models import db, Request, Plant, Unit
import json

def run_tests():
    with app.app_context():
        # Setup test client
        client = app.test_client()
        
        # We need an admin user for auth
        from models import User
        import datetime
        import jwt
        
        admin_user = User.query.filter_by(role='admin').first()
        if not admin_user:
            admin_user = User(email='testadmin@test.com', password_hash='mockpass', role='admin')
            db.session.add(admin_user)
            db.session.commit()
            
        token = jwt.encode({
            'user_id': admin_user.id,
            'email': admin_user.email,
            'role': admin_user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test 1: Adversarial JSON to /predict
        print("Running Test 1: Adversarial JSON to /predict")
        res = client.post('/api/predict', json={'telemetry': {'rpm': 'bad_string'}}, headers=headers)
        print(f"/predict response status: {res.status_code}")
        print(f"/predict response body: {res.get_data(as_text=True)}")
        assert res.status_code == 400, f"Should be 400 Bad Request, got {res.status_code}"
        
        # Test 2: Corrupt DB entries for /requests
        print("\nRunning Test 2: Corrupt DB entries for /requests")
        # Insert request with no plant or unit
        bad_req = Request(
            plant_id=9999,
            unit_id=9999,
            engineer_id=admin_user.id,
            priority='High',
            fault_type='Vibration',
            confidence_score=90.5
        )
        db.session.add(bad_req)
        db.session.commit()
        
        # Now call /requests
        res = client.get('/api/requests', headers=headers)
        print(f"/requests response status: {res.status_code}")
        assert res.status_code == 200, "Should be 200 OK despite missing relations"
        
        body = res.get_json()
        found_bad = False
        for r in body:
            if r['plantName'] == 'Unknown Plant' and r['unitId'] == 'Unknown':
                found_bad = True
                break
        assert found_bad, "Should find the corrupt request with defaults applied"
        
        # Cleanup
        db.session.delete(bad_req)
        db.session.commit()
        
        print("\nAll tests PASSED.")

if __name__ == '__main__':
    run_tests()
