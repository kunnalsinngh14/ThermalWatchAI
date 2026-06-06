"""
Migration script to change the units.status column from ENUM('normal','faulty') to VARCHAR(20).
Run this ONCE before cleanup.py.
"""
import os
from app import app
from models import db
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

def migrate():
    with app.app_context():
        print('Migrating units.status column...')
        
        # Step 1: ALTER the column from ENUM to VARCHAR(20)
        db.session.execute(db.text(
            "ALTER TABLE units MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'running'"
        ))
        db.session.commit()
        print('  Column type changed to VARCHAR(20)')
        
        # Step 2: Update existing values
        db.session.execute(db.text(
            "UPDATE units SET status = 'running' WHERE status IN ('normal', 'faulty', '')"
        ))
        db.session.commit()
        print('  All existing statuses set to running')
        
        print('Migration complete!')

if __name__ == '__main__':
    migrate()
