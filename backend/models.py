from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('engineer', 'admin'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requests = db.relationship('Request', backref='engineer', lazy=True, cascade="all, delete-orphan")

class Plant(db.Model):
    __tablename__ = 'plants'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    nameplate_capacity = db.Column(db.Numeric(10, 2), default=0.00)
    total_units = db.Column(db.Integer, nullable=False, default=0)
    faulty_units = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    units = db.relationship('Unit', backref='plant', lazy=True, cascade="all, delete-orphan")
    requests = db.relationship('Request', backref='plant', lazy=True, cascade="all, delete-orphan")

class Unit(db.Model):
    __tablename__ = 'units'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plant_id = db.Column(db.Integer, db.ForeignKey('plants.id', ondelete='CASCADE'), nullable=False)
    unit_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='running')
    fault_type = db.Column(db.String(100), nullable=True)
    confidence_score = db.Column(db.Numeric(5, 2), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requests = db.relationship('Request', backref='unit', lazy=True, cascade="all, delete-orphan")
    
    __table_args__ = (
        db.UniqueConstraint('plant_id', 'unit_number', name='unique_plant_unit'),
    )

class Request(db.Model):
    __tablename__ = 'requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plant_id = db.Column(db.Integer, db.ForeignKey('plants.id', ondelete='CASCADE'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id', ondelete='SET NULL'), nullable=True)
    unit_number = db.Column(db.Integer, nullable=False)
    engineer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    priority = db.Column(db.Enum('Low', 'Medium', 'High'), nullable=False)
    fault_type = db.Column(db.String(100), nullable=False)
    confidence_score = db.Column(db.Numeric(5, 2), nullable=False)
    telemetry_data = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DailySubmission(db.Model):
    __tablename__ = 'daily_submissions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.Date, nullable=False)
    plant_id = db.Column(db.Integer, db.ForeignKey('plants.id', ondelete='CASCADE'), nullable=False)
    power_generated = db.Column(db.Numeric(10, 2), nullable=False)
    auxiliary_power = db.Column(db.Numeric(10, 2), nullable=False)
    water_consumption = db.Column(db.Numeric(10, 2), nullable=False)
    coal_consumption = db.Column(db.Numeric(10, 2), nullable=False)
    co2_emissions = db.Column(db.Numeric(10, 2), nullable=False)
    fly_ash = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    plant = db.relationship('Plant', backref=db.backref('submissions', lazy=True, cascade="all, delete-orphan"))

