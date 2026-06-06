import datetime
import jwt
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
from models import db, User, Plant, Unit, Request, DailySubmission
from auth_middleware import token_required, roles_required

api_bp = Blueprint('api', __name__)

# --- AUTH ROUTES ---
@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()
    
    # In a real app, use check_password_hash(user.password_hash, data['password'])
    # Here we simulate with direct comparison for the mock passwords
    if not user or user.password_hash != data['password']:
        return jsonify({'message': 'Invalid credentials'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
    })

# --- PLANT ROUTES ---
@api_bp.route('/plants', methods=['GET'])
def get_plants():
    plants = Plant.query.all()
    result = []
    for p in plants:
        result.append({
            'id': p.id,
            'name': p.name,
            'capacity': str(p.nameplate_capacity),
            'units': p.total_units,
            'faults': p.faulty_units
        })
    return jsonify(result)

@api_bp.route('/plants', methods=['POST'])
@roles_required('admin')
def add_plant(current_user):
    data = request.get_json()
    try:
        new_plant = Plant(
            name=data['name'],
            nameplate_capacity=data.get('capacity', 0),
            total_units=data.get('units', 0)
        )
        db.session.add(new_plant)
        db.session.commit()
        
        # Auto-create units
        for i in range(1, new_plant.total_units + 1):
            unit = Unit(plant_id=new_plant.id, unit_number=i)
            db.session.add(unit)
        db.session.commit()
        
        return jsonify({'message': 'Plant and units created successfully', 'id': new_plant.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@api_bp.route('/plants/<int:id>', methods=['DELETE'])
@roles_required('admin')
def delete_plant(current_user, id):
    plant = Plant.query.get_or_404(id)
    db.session.delete(plant)
    db.session.commit()
    return jsonify({'message': 'Plant deleted successfully'})

# --- REQUESTS ROUTES ---
@api_bp.route('/requests', methods=['GET'])
@roles_required('admin', 'engineer')
def get_requests(current_user):
    status = request.args.get('status', 'open')
    reqs = Request.query.filter_by(status=status).order_by(Request.created_at.desc()).all()
    result = []
    for r in reqs:
        plant = Plant.query.get(r.plant_id)
        plantName = plant.name if plant else "Unknown Plant"
        unitNum = r.unit_number
        timestamp = int(r.created_at.timestamp() * 1000) if r.created_at else 0

        result.append({
            'id': r.id,
            'plantName': plantName,
            'unitId': unitNum,
            'faultType': r.fault_type,
            'confidence': str(r.confidence_score),
            'priority': r.priority,
            'timestamp': timestamp,
            'engineerId': r.engineer_id
        })
    return jsonify(result)

@api_bp.route('/requests', methods=['POST'])
@roles_required('admin', 'engineer')
def create_request(current_user):
    data = request.get_json()
    try:
        # Find the actual Unit DB record
        unit = Unit.query.filter_by(plant_id=data['plantId'], unit_number=data['unitId']).first()
        if not unit:
            return jsonify({'message': 'Unit not found'}), 404

        new_req = Request(
            plant_id=data['plantId'],
            unit_id=unit.id,
            unit_number=unit.unit_number,
            engineer_id=current_user.id,
            priority=data['priority'],
            fault_type=data['fault_type'],
            confidence_score=data['confidence_score'],
            telemetry_data=data.get('telemetry', {})
        )
        db.session.add(new_req)
        
        # Update unit status
        unit.status = 'faulty'
        unit.fault_type = data['fault_type']
        unit.confidence_score = data['confidence_score']
        
        # Update plant fault count
        plant = Plant.query.get(data['plantId'])
        if plant:
            plant.faulty_units += 1

        db.session.commit()
        
        # Trigger Email Alert
        from email_service import send_alert_email
        alert_details = {
            'plant_id': data['plantId'],
            'unit_id': data['unitId'],
            'fault_type': data['fault_type'],
            'confidence_score': data['confidence_score'],
            'priority': data['priority'],
            'telemetry': data.get('telemetry', {})
        }
        send_alert_email('dummyadmin@gmail.com', alert_details)
        
        return jsonify({'message': 'Request raised successfully', 'id': new_req.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@api_bp.route('/requests/<int:id>/resolve', methods=['PATCH'])
@roles_required('admin')
def resolve_request(current_user, id):
    req = Request.query.get_or_404(id)
    req.status = 'resolved'
    
    # Restore unit status
    unit = Unit.query.filter_by(plant_id=req.plant_id, unit_number=Unit.query.get(req.unit_id).unit_number).first()
    if unit and unit.status in ('under_maintenance', 'faulty'):
        old_status = unit.status
        unit.status = 'running'
        unit.fault_type = None
        unit.confidence_score = None
        
        plant = Plant.query.get(req.plant_id)
        if plant and old_status == 'faulty' and plant.faulty_units > 0:
            plant.faulty_units -= 1

    db.session.commit()
    return jsonify({'message': 'Request marked as resolved'})

@api_bp.route('/requests/<int:id>/drop', methods=['PATCH'])
@roles_required('admin')
def drop_request(current_user, id):
    req = Request.query.get_or_404(id)
    req.status = 'dropped'
    
    # Remove unit entirely
    unit = Unit.query.get(req.unit_id)
    if unit:
        plant = Plant.query.get(req.plant_id)
        if plant:
            plant.total_units -= 1
            if unit.status == 'faulty' and plant.faulty_units > 0:
                plant.faulty_units -= 1
        db.session.delete(unit)

    db.session.commit()
    return jsonify({'message': 'Request dropped and unit removed'})

@api_bp.route('/requests/<int:id>/maintain', methods=['PATCH'])
@roles_required('admin')
def maintain_request(current_user, id):
    req = Request.query.get_or_404(id)
    req.status = 'under_maintenance'
    
    # Update unit status
    unit = Unit.query.get(req.unit_id)
    if unit:
        unit.status = 'under_maintenance'
        
    # Update plant fault count
    plant = Plant.query.get(req.plant_id)
    if plant and plant.faulty_units > 0:
        plant.faulty_units -= 1
        
    db.session.commit()
    return jsonify({'message': 'Request marked as under maintenance'}), 200

@api_bp.route('/submissions', methods=['POST'])
@roles_required('admin', 'engineer')
def create_submission(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing data'}), 400
        
    try:
        plant = Plant.query.get(data['plantId'])
        if not plant:
            return jsonify({'message': 'Plant not found'}), 404
            
        from datetime import datetime
        try:
            date_val = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format, must be YYYY-MM-DD'}), 400
            
        new_sub = DailySubmission(
            date=date_val,
            plant_id=int(data['plantId']),
            power_generated=float(data['powerGenerated']),
            auxiliary_power=float(data['auxiliaryPower']),
            water_consumption=float(data['waterConsumption']),
            coal_consumption=float(data['coalConsumption']),
            co2_emissions=float(data['co2Emissions']),
            fly_ash=float(data['flyAsh'])
        )
        db.session.add(new_sub)
        db.session.commit()
        return jsonify({'message': 'Stats submitted successfully', 'id': new_sub.id}), 201
    except KeyError as ke:
        return jsonify({'message': f'Missing required field: {str(ke)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


# --- ML PREDICTION ROUTE ---
@api_bp.route('/predict', methods=['POST'])
@roles_required('engineer', 'admin')
def predict(current_user):
    data = request.get_json()
    if not data or 'telemetry' not in data:
        return jsonify({'message': 'Missing telemetry data'}), 400
        
    try:
        from ml_service import predict_fault
        result = predict_fault(data['telemetry'])
        
        # We can also attach the incoming telemetry so the frontend gets it back exactly as it sent it
        result['telemetry'] = data['telemetry']
        
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# --- ENGINEERS ROUTES ---
@api_bp.route('/engineers', methods=['GET'])
@roles_required('admin')
def get_engineers(current_user):
    engineers = User.query.filter_by(role='engineer').all()
    result = []
    for e in engineers:
        result.append({
            'id': e.id,
            'email': e.email,
            'created_at': e.created_at.strftime('%m/%d/%Y') if e.created_at else ''
        })
    return jsonify(result)

@api_bp.route('/engineers', methods=['POST'])
@roles_required('admin')
def add_engineer(current_user):
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    try:
        new_user = User(email=data['email'], password_hash=data['password'], role='engineer')
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Engineer provisioned successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@api_bp.route('/engineers/<int:id>', methods=['DELETE'])
@roles_required('admin')
def delete_engineer(current_user, id):
    user = User.query.get_or_404(id)
    if user.role != 'engineer':
        return jsonify({'message': 'Cannot delete non-engineers'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Engineer access revoked'})

@api_bp.route('/engineers/<int:id>', methods=['PATCH'])
@roles_required('admin')
def update_engineer(current_user, id):
    user = User.query.get_or_404(id)
    if user.role != 'engineer':
        return jsonify({'message': 'Cannot update non-engineers'}), 400
    
    data = request.get_json()
    if 'email' in data and data['email']:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != id:
            return jsonify({'message': 'Email already in use'}), 400
        user.email = data['email']
        
    if 'password' in data and data['password']:
        user.password_hash = data['password']
        
    db.session.commit()
    return jsonify({'message': 'Engineer updated successfully'})

# --- UNITS ROUTES ---
@api_bp.route('/plants/<int:plant_id>/units', methods=['PATCH'])
@roles_required('admin')
def update_plant_units(current_user, plant_id):
    data = request.get_json()
    delta = data.get('delta', 0)
    plant = Plant.query.get_or_404(plant_id)
    
    if delta == 0:
        return jsonify({'message': 'No change'}), 400
        
    try:
        if delta > 0:
            for i in range(delta):
                new_unit_number = plant.total_units + 1
                new_unit = Unit(plant_id=plant.id, unit_number=new_unit_number)
                db.session.add(new_unit)
                plant.total_units += 1
        elif delta < 0:
            if plant.total_units + delta < 0:
                return jsonify({'message': 'Cannot reduce units below 0'}), 400
            for i in range(abs(delta)):
                unit_to_delete = Unit.query.filter_by(plant_id=plant.id, unit_number=plant.total_units).first()
                if unit_to_delete:
                    db.session.delete(unit_to_delete)
                    if unit_to_delete.status == 'faulty' and plant.faulty_units > 0:
                        plant.faulty_units -= 1
                    plant.total_units -= 1
        db.session.commit()
        return jsonify({'message': 'Units updated successfully', 'total_units': plant.total_units})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

# --- ALL UNITS ROUTES ---
@api_bp.route('/units', methods=['GET'])
def get_all_units():
    units = Unit.query.all()
    result = []
    for u in units:
        plant = Plant.query.get(u.plant_id)
        result.append({
            'id': u.id,
            'plantId': u.plant_id,
            'plantName': plant.name if plant else 'Unknown',
            'unitNumber': u.unit_number,
            'status': u.status,
            'faultType': u.fault_type,
            'confidenceScore': str(u.confidence_score) if u.confidence_score else None
        })
    return jsonify(result)

@api_bp.route('/units/<int:id>/status', methods=['PATCH'])
@roles_required('admin')
def update_unit_status(current_user, id):
    unit = Unit.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ('running', 'faulty', 'under_maintenance', 'dropped'):
        return jsonify({'message': 'Invalid status. Must be running, faulty, under_maintenance, or dropped'}), 400
    
    old_status = unit.status
    unit.status = new_status
    
    plant = Plant.query.get(unit.plant_id)
    if plant:
        if old_status == 'faulty' and new_status != 'faulty':
            if plant.faulty_units > 0:
                plant.faulty_units -= 1
        elif old_status != 'faulty' and new_status == 'faulty':
            plant.faulty_units += 1
    
    if new_status == 'under_maintenance' and old_status != 'under_maintenance':
        from models import Request
        new_req = Request(
            plant_id=unit.plant_id,
            unit_id=unit.id,
            unit_number=unit.unit_number,
            engineer_id=current_user.id,
            priority='Medium',
            fault_type='Manual Status Override',
            confidence_score=100.0,
            status='under_maintenance'
        )
        db.session.add(new_req)
        
    if new_status == 'running':
        unit.fault_type = None
        unit.confidence_score = None
        if old_status == 'under_maintenance':
            from models import Request
            active_req = Request.query.filter_by(unit_id=unit.id, status='under_maintenance').first()
            if active_req:
                active_req.status = 'resolved'
    
    db.session.commit()
    return jsonify({'message': f'Unit status updated to {new_status}'})

@api_bp.route('/units/<int:id>', methods=['DELETE'])
@roles_required('admin')
def delete_unit(current_user, id):
    unit = Unit.query.get_or_404(id)
    plant = Plant.query.get(unit.plant_id)
    if plant:
        plant.total_units -= 1
        if unit.status == 'faulty' and plant.faulty_units > 0:
            plant.faulty_units -= 1
            
    # Auto-create a dropped request so it appears in the Dropped History page
    from models import Request
    drop_req = Request(
        plant_id=unit.plant_id,
        unit_id=None,
        unit_number=unit.unit_number,
        engineer_id=current_user.id,
        priority='High',
        fault_type=unit.fault_type or 'Decommissioned by Admin',
        confidence_score=unit.confidence_score or 100.0,
        status='dropped'
    )
    db.session.add(drop_req)
            
    db.session.delete(unit)
    db.session.commit()
    return jsonify({'message': 'Unit deleted successfully'})

@api_bp.route('/plants/<int:plant_id>/units', methods=['POST'])
@roles_required('admin')
def add_unit_to_plant(current_user, plant_id):
    plant = Plant.query.get_or_404(plant_id)
    max_unit = db.session.query(db.func.max(Unit.unit_number)).filter_by(plant_id=plant_id).scalar() or 0
    new_unit = Unit(plant_id=plant_id, unit_number=max_unit + 1, status='running')
    db.session.add(new_unit)
    plant.total_units += 1
    db.session.commit()
    return jsonify({'message': 'Unit added successfully', 'unitNumber': new_unit.unit_number, 'id': new_unit.id}), 201

# --- SUBMISSIONS & HISTORY LOGS ROUTES ---
@api_bp.route('/submissions', methods=['GET'])
def get_submissions():
    plant_id = request.args.get('plant_id')
    query = DailySubmission.query
    if plant_id:
        query = query.filter_by(plant_id=int(plant_id))
    subs = query.order_by(DailySubmission.date.asc()).all()
    result = []
    for s in subs:
        result.append({
            'id': s.id,
            'date': s.date.strftime('%Y-%m-%d'),
            'plantId': s.plant_id,
            'powerGenerated': float(s.power_generated),
            'auxiliaryPower': float(s.auxiliary_power),
            'waterConsumption': float(s.water_consumption),
            'coalConsumption': float(s.coal_consumption),
            'co2Emissions': float(s.co2_emissions),
            'flyAsh': float(s.fly_ash)
        })
    return jsonify(result)

@api_bp.route('/history/faults', methods=['GET'])
@roles_required('admin', 'engineer')
def get_fault_history(current_user):
    reqs = Request.query.order_by(Request.created_at.desc()).all()
    result = []
    for r in reqs:
        plant = Plant.query.get(r.plant_id)
        result.append({
            'id': r.id,
            'plantName': plant.name if plant else "Unknown Plant",
            'unitNumber': r.unit_number,
            'priority': r.priority,
            'faultType': r.fault_type,
            'confidence': str(r.confidence_score),
            'status': r.status,
            'timestamp': int(r.created_at.timestamp() * 1000) if r.created_at else 0
        })
    return jsonify(result)

@api_bp.route('/history/maintenance', methods=['GET'])
@roles_required('admin', 'engineer')
def get_maintenance_history(current_user):
    reqs = Request.query.filter_by(status='resolved').order_by(Request.created_at.desc()).all()
    result = []
    for r in reqs:
        plant = Plant.query.get(r.plant_id)
        result.append({
            'id': r.id,
            'plantName': plant.name if plant else "Unknown Plant",
            'unitNumber': r.unit_number,
            'faultType': r.fault_type,
            'confidence': str(r.confidence_score),
            'timestamp': int(r.created_at.timestamp() * 1000) if r.created_at else 0
        })
    return jsonify(result)

@api_bp.route('/history/dropped', methods=['GET'])
@roles_required('admin', 'engineer')
def get_dropped_history(current_user):
    reqs = Request.query.filter_by(status='dropped').order_by(Request.created_at.desc()).all()
    result = []
    for r in reqs:
        plant = Plant.query.get(r.plant_id)
        result.append({
            'id': r.id,
            'plantName': plant.name if plant else "Unknown Plant",
            'unitNumber': r.unit_number,
            'faultType': r.fault_type,
            'confidence': str(r.confidence_score),
            'timestamp': int(r.created_at.timestamp() * 1000) if r.created_at else 0
        })
    return jsonify(result)
