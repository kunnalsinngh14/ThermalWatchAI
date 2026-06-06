"""Add missing Godda units (7-10) and update total_units to 10"""
import os
from app import app
from models import db, Plant, Unit
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

def add_godda_units():
    with app.app_context():
        p = Plant.query.filter_by(name='Godda Power Plant').first()
        if not p:
            print('Godda Power Plant not found!')
            return
        
        existing = Unit.query.filter_by(plant_id=p.id).count()
        print(f'Godda currently has {existing} units, total_units={p.total_units}')
        
        if existing < 10:
            max_num = db.session.query(db.func.max(Unit.unit_number)).filter_by(plant_id=p.id).scalar() or 0
            for i in range(max_num + 1, 11):
                u = Unit(plant_id=p.id, unit_number=i, status='running')
                db.session.add(u)
                print(f'  Added unit {i}')
            
            p.total_units = 10
            db.session.commit()
            print(f'Godda now has 10 units')
        else:
            print('Godda already has 10+ units, skipping')

if __name__ == '__main__':
    add_godda_units()
