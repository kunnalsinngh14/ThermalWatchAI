import os
import random
from datetime import date, datetime, timedelta
from werkzeug.security import generate_password_hash
from app import app
from models import db, User, Plant, Unit, Request, DailySubmission
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def seed_submissions():
    print("Seeding Daily Submissions...")
    submissions = []
    
    dates_to_seed = [
        date(2026, 6, 2),
        date(2026, 6, 3),
        date(2026, 6, 4),
        date(2026, 6, 5)
    ]
    
    # Ahmedabad (Plant 1)
    for d in dates_to_seed:
        submissions.append(DailySubmission(
            date=d, plant_id=1,
            power_generated=random.randint(17000, 19500),
            auxiliary_power=random.randint(75, 90),
            water_consumption=random.randint(3800, 4300),
            coal_consumption=random.randint(280, 330),
            co2_emissions=random.randint(800, 950),
            fly_ash=random.uniform(38.0, 43.0)
        ))
        
    # Godda (Plant 2)
    for d in dates_to_seed:
        submissions.append(DailySubmission(
            date=d, plant_id=2,
            power_generated=random.randint(11000, 13000),
            auxiliary_power=random.randint(50, 65),
            water_consumption=random.randint(2500, 2900),
            coal_consumption=random.randint(180, 220),
            co2_emissions=random.randint(530, 620),
            fly_ash=random.uniform(25.0, 30.0)
        ))

    for sub in submissions:
        db.session.add(sub)
    db.session.commit()
    print("Daily submissions seeded successfully.")

def seed_database():
    with app.app_context():
        print("Dropping tables to format data...")
        db.drop_all()
        print("Creating tables...")
        db.create_all()

        print("Seeding Users...")
        admin = User(email='dummyadmin@gmail.com', password_hash='adminpassword', role='admin')
        db.session.add(admin)

        engg = User(email='dummyengg@gmail.com', password_hash='enggpass', role='engineer')
        db.session.add(engg)

        print("Seeding Plants...")
        p1 = Plant(name='Ahmedabad Power Plant', nameplate_capacity=1200.0, total_units=10)
        db.session.add(p1)
        db.session.commit()
        
        for i in range(1, 11):
            unit = Unit(plant_id=p1.id, unit_number=i)
            db.session.add(unit)

        p2 = Plant(name='Godda Power Plant', nameplate_capacity=800.0, total_units=10)
        db.session.add(p2)
        db.session.commit()
        
        for i in range(1, 11):
            unit = Unit(plant_id=p2.id, unit_number=i)
            db.session.add(unit)

        db.session.commit()
        
        # Seed Submissions
        seed_submissions()
        
        print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed_database()
