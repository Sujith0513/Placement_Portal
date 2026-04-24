from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, CompanyProfile, StudentProfile

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '')

    if not email or not password or not role:
        return jsonify({'error': 'Email, password, and role are required'}), 400

    if role not in ('student', 'company'):
        return jsonify({'error': 'Role must be student or company'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == 'student':
        profile = StudentProfile(
            user_id=user.id,
            name=data.get('name', ''),
            roll_number=data.get('roll_number', ''),
            branch=data.get('branch', ''),
            cgpa=data.get('cgpa', 0.0),
            year=data.get('year', 1),
            phone=data.get('phone', '')
        )
        db.session.add(profile)
    elif role == 'company':
        profile = CompanyProfile(
            user_id=user.id,
            company_name=data.get('company_name', ''),
            hr_contact=data.get('hr_contact', ''),
            hr_email=data.get('hr_email', ''),
            website=data.get('website', ''),
            industry=data.get('industry', ''),
            description=data.get('description', '')
        )
        db.session.add(profile)

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Registration successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    # Check blacklist
    if user.role == 'company' and user.company_profile and user.company_profile.is_blacklisted:
        return jsonify({'error': 'Your company has been blacklisted'}), 403
    if user.role == 'student' and user.student_profile and user.student_profile.is_blacklisted:
        return jsonify({'error': 'Your account has been blacklisted'}), 403

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = user.to_dict()
    if user.role == 'company' and user.company_profile:
        data['profile'] = user.company_profile.to_dict()
    elif user.role == 'student' and user.student_profile:
        data['profile'] = user.student_profile.to_dict()

    return jsonify(data), 200
