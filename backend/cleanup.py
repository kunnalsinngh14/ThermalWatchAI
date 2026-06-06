import os
from app import app
from models import db, User, Plant, Unit, Request
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

def cleanup():
    with app.app_context():
        print('Cleaning up dummy data...')
        
        # Delete all requests
        Request.query.delete()
        print('  Cleared all requests')
        
        # Reset all unit statuses
        units = Unit.query.all()
        for u in units:
            u.status = 'running'
            u.fault_type = None
            u.confidence_score = None
        print(f'  Reset {len(units)} units to running')
        
        # Reset plant fault counts
        plants = Plant.query.all()
        for p in plants:
            p.faulty_units = 0
        print(f'  Reset fault counts for {len(plants)} plants')
        
        db.session.commit()
        print('Cleanup complete!')

if __name__ == '__main__':
    cleanup()
