import os
from datetime import date, datetime, timedelta
from werkzeug.security import generate_password_hash
from app import app
from models import db, User, Plant, Unit, Request, DailySubmission
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def seed_submissions():
    # check if submissions already exist
    if DailySubmission.query.first():
        print("Daily submissions already seeded.")
        return
        
    print("Seeding Daily Submissions...")
    submissions = [
        # Ahmedabad (Plant 1)
        DailySubmission(date=date(2026, 6, 1), plant_id=1, power_generated=18000, auxiliary_power=80, water_consumption=4000, coal_consumption=300, co2_emissions=850, fly_ash=40),
        DailySubmission(date=date(2026, 6, 2), plant_id=1, power_generated=18500, auxiliary_power=82, water_consumption=4100, coal_consumption=310, co2_emissions=870, fly_ash=41),
        DailySubmission(date=date(2026, 6, 3), plant_id=1, power_generated=19000, auxiliary_power=85, water_consumption=4200, coal_consumption=320, co2_emissions=890, fly_ash=42),
        DailySubmission(date=date(2026, 6, 4), plant_id=1, power_generated=17500, auxiliary_power=78, water_consumption=3900, coal_consumption=290, co2_emissions=820, fly_ash=39),
        DailySubmission(date=date(2026, 6, 5), plant_id=1, power_generated=18200, auxiliary_power=81, water_consumption=4050, coal_consumption=305, co2_emissions=860, fly_ash=40.5),
        DailySubmission(date=date(2026, 6, 6), plant_id=1, power_generated=18800, auxiliary_power=84, water_consumption=4150, coal_consumption=315, co2_emissions=885, fly_ash=41.8),
        
        # Godda (Plant 2)
        DailySubmission(date=date(2026, 6, 1), plant_id=2, power_generated=12000, auxiliary_power=55, water_consumption=2700, coal_consumption=200, co2_emissions=570, fly_ash=27),
        DailySubmission(date=date(2026, 6, 2), plant_id=2, power_generated=12300, auxiliary_power=56, water_consumption=2750, coal_consumption=205, co2_emissions=580, fly_ash=28),
        DailySubmission(date=date(2026, 6, 3), plant_id=2, power_generated=12600, auxiliary_power=58, water_consumption=2800, coal_consumption=210, co2_emissions=595, fly_ash=29),
        DailySubmission(date=date(2026, 6, 4), plant_id=2, power_generated=11800, auxiliary_power=54, water_consumption=2650, coal_consumption=195, co2_emissions=560, fly_ash=26),
        DailySubmission(date=date(2026, 6, 5), plant_id=2, power_generated=12100, auxiliary_power=55, water_consumption=2720, coal_consumption=202, co2_emissions=575, fly_ash=27.5),
        DailySubmission(date=date(2026, 6, 6), plant_id=2, power_generated=12500, auxiliary_power=57, water_consumption=2780, coal_consumption=208, co2_emissions=590, fly_ash=28.4),
    ]
    for sub in submissions:
        db.session.add(sub)
    db.session.commit()
    print("Daily submissions seeded successfully.")

def seed_history():
    if Request.query.first():
        print("Historical requests already seeded.")
        return
        
    print("Seeding History Logs...")
    eng = User.query.filter_by(role='engineer').first()
    if not eng:
        return
        
    p1 = Plant.query.filter_by(name='Ahmedabad Power Plant').first()
    
    # Target units to modify/link
    u_p1_2 = Unit.query.filter_by(plant_id=p1.id, unit_number=2).first()
    u_p1_3 = Unit.query.filter_by(plant_id=p1.id, unit_number=3).first()
    
    # 1. Resolved Request (goes into Fault History & Maintenance History)
    req1 = Request(
        plant_id=p1.id,
        unit_id=u_p1_2.id,
        unit_number=2,
        engineer_id=eng.id,
        priority='High',
        fault_type='Vibration Anomaly',
        confidence_score=92.5,
        status='resolved',
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.session.add(req1)
    
    # 2. Under Maintenance Request (goes into Fault History)
    req2 = Request(
        plant_id=p1.id,
        unit_id=u_p1_3.id,
        unit_number=3,
        engineer_id=eng.id,
        priority='Medium',
        fault_type='Overheating',
        confidence_score=85.0,
        status='under_maintenance',
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.session.add(req2)
    
    # Update active unit status
    u_p1_3.status = 'under_maintenance'
    
    # 3. Dropped Request (goes into Fault History & Dropped History)
    u_p1_10 = Unit.query.filter_by(plant_id=p1.id, unit_number=10).first()
    if u_p1_10:
        req3 = Request(
            plant_id=p1.id,
            unit_id=None, # unit is deleted
            unit_number=10,
            engineer_id=eng.id,
            priority='High',
            fault_type='Boiler Tube Leakage',
            confidence_score=95.0,
            status='dropped',
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        db.session.add(req3)
        db.session.delete(u_p1_10)
        p1.total_units -= 1
        
    db.session.commit()
    print("History logs seeded successfully.")

def seed_database():
    with app.app_context():
        print("Creating tables...")
        db.create_all()

        print("Seeding Users...")
        # Check if users already exist
        if not User.query.filter_by(email='dummyadmin@gmail.com').first():
            admin = User(email='dummyadmin@gmail.com', password_hash='adminpassword', role='admin')
            db.session.add(admin)

        if not User.query.filter_by(email='dummyengg@gmail.com').first():
            engg = User(email='dummyengg@gmail.com', password_hash='enggpass', role='engineer')
            db.session.add(engg)

        print("Seeding Plants...")
        if not Plant.query.filter_by(name='Ahmedabad Power Plant').first():
            p1 = Plant(name='Ahmedabad Power Plant', nameplate_capacity=1200.0, total_units=10)
            db.session.add(p1)
            db.session.commit()
            
            for i in range(1, 11):
                unit = Unit(plant_id=p1.id, unit_number=i)
                db.session.add(unit)

        if not Plant.query.filter_by(name='Godda Power Plant').first():
            p2 = Plant(name='Godda Power Plant', nameplate_capacity=800.0, total_units=10)
            db.session.add(p2)
            db.session.commit()
            
            for i in range(1, 11):
                unit = Unit(plant_id=p2.id, unit_number=i)
                db.session.add(unit)

        db.session.commit()
        
        # Seed Submissions and History Logs
        seed_submissions()
        seed_history()
        
        print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed_database()
