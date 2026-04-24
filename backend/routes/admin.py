from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, CompanyProfile, StudentProfile, PlacementDrive, Application
from functools import wraps

admin_bp = Blueprint('admin', __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ─── Dashboard & Reports ────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    total_students = StudentProfile.query.count()
    total_companies = CompanyProfile.query.count()
    total_drives = PlacementDrive.query.count()
    total_applications = Application.query.count()
    total_selected = Application.query.filter_by(status='selected').count()
    pending_companies = CompanyProfile.query.filter_by(approval_status='pending').count()
    pending_drives = PlacementDrive.query.filter_by(status='pending').count()

    return jsonify({
        'total_students': total_students,
        'total_companies': total_companies,
        'total_drives': total_drives,
        'total_applications': total_applications,
        'total_selected': total_selected,
        'pending_companies': pending_companies,
        'pending_drives': pending_drives
    }), 200


@admin_bp.route('/reports', methods=['GET'])
@admin_required
def reports():
    from sqlalchemy import func

    # Drives by month
    drives_by_month = db.session.query(
        func.strftime('%Y-%m', PlacementDrive.created_at).label('month'),
        func.count(PlacementDrive.id).label('count')
    ).group_by('month').order_by('month').all()

    # Selections by company
    selections_by_company = db.session.query(
        CompanyProfile.company_name,
        func.count(Application.id).label('selected_count')
    ).join(PlacementDrive, PlacementDrive.company_id == CompanyProfile.id)\
     .join(Application, Application.drive_id == PlacementDrive.id)\
     .filter(Application.status == 'selected')\
     .group_by(CompanyProfile.company_name).all()

    # Branch-wise applications
    branch_stats = db.session.query(
        StudentProfile.branch,
        func.count(Application.id).label('total_apps'),
        func.sum(db.case((Application.status == 'selected', 1), else_=0)).label('selected')
    ).join(Application, Application.student_id == StudentProfile.id)\
     .group_by(StudentProfile.branch).all()

    return jsonify({
        'drives_by_month': [{'month': r[0], 'count': r[1]} for r in drives_by_month],
        'selections_by_company': [{'company': r[0], 'selected': r[1]} for r in selections_by_company],
        'branch_stats': [{'branch': r[0], 'applications': r[1], 'selected': r[2]} for r in branch_stats]
    }), 200


# ─── Companies CRUD ─────────────────────────────────────────

@admin_bp.route('/companies', methods=['GET'])
@admin_required
def list_companies():
    search = request.args.get('search', '')
    query = CompanyProfile.query
    if search:
        query = query.filter(CompanyProfile.company_name.ilike(f'%{search}%'))
    companies = query.order_by(CompanyProfile.created_at.desc()).all()
    return jsonify([c.to_dict() for c in companies]), 200


@admin_bp.route('/companies/<int:id>', methods=['GET'])
@admin_required
def get_company(id):
    company = CompanyProfile.query.get_or_404(id)
    return jsonify(company.to_dict()), 200


@admin_bp.route('/companies/<int:id>', methods=['PUT'])
@admin_required
def update_company(id):
    company = CompanyProfile.query.get_or_404(id)
    data = request.get_json()
    for field in ['company_name', 'hr_contact', 'hr_email', 'website', 'industry', 'description']:
        if field in data:
            setattr(company, field, data[field])
    db.session.commit()
    return jsonify(company.to_dict()), 200


@admin_bp.route('/companies/<int:id>', methods=['DELETE'])
@admin_required
def delete_company(id):
    company = CompanyProfile.query.get_or_404(id)
    user = User.query.get(company.user_id)
    db.session.delete(company)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Company deleted'}), 200


@admin_bp.route('/companies/<int:id>/approve', methods=['PUT'])
@admin_required
def approve_company(id):
    company = CompanyProfile.query.get_or_404(id)
    data = request.get_json()
    status = data.get('status', 'approved')
    if status not in ('approved', 'rejected'):
        return jsonify({'error': 'Status must be approved or rejected'}), 400
    company.approval_status = status
    db.session.commit()
    return jsonify(company.to_dict()), 200


@admin_bp.route('/companies/<int:id>/blacklist', methods=['PUT'])
@admin_required
def blacklist_company(id):
    company = CompanyProfile.query.get_or_404(id)
    company.is_blacklisted = not company.is_blacklisted
    db.session.commit()
    return jsonify(company.to_dict()), 200


# ─── Students CRUD ──────────────────────────────────────────

@admin_bp.route('/students', methods=['GET'])
@admin_required
def list_students():
    search = request.args.get('search', '')
    query = StudentProfile.query
    if search:
        query = query.filter(
            db.or_(
                StudentProfile.name.ilike(f'%{search}%'),
                StudentProfile.roll_number.ilike(f'%{search}%'),
                StudentProfile.branch.ilike(f'%{search}%')
            )
        )
    students = query.order_by(StudentProfile.created_at.desc()).all()
    return jsonify([s.to_dict() for s in students]), 200


@admin_bp.route('/students/<int:id>', methods=['GET'])
@admin_required
def get_student(id):
    student = StudentProfile.query.get_or_404(id)
    return jsonify(student.to_dict()), 200


@admin_bp.route('/students/<int:id>', methods=['PUT'])
@admin_required
def update_student(id):
    student = StudentProfile.query.get_or_404(id)
    data = request.get_json()
    for field in ['name', 'roll_number', 'branch', 'cgpa', 'year', 'phone']:
        if field in data:
            setattr(student, field, data[field])
    db.session.commit()
    return jsonify(student.to_dict()), 200


@admin_bp.route('/students/<int:id>', methods=['DELETE'])
@admin_required
def delete_student(id):
    student = StudentProfile.query.get_or_404(id)
    user = User.query.get(student.user_id)
    db.session.delete(student)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Student deleted'}), 200


@admin_bp.route('/students/<int:id>/blacklist', methods=['PUT'])
@admin_required
def blacklist_student(id):
    student = StudentProfile.query.get_or_404(id)
    student.is_blacklisted = not student.is_blacklisted
    db.session.commit()
    return jsonify(student.to_dict()), 200


# ─── Drives CRUD ────────────────────────────────────────────

@admin_bp.route('/drives', methods=['GET'])
@admin_required
def list_drives():
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    query = PlacementDrive.query
    if search:
        query = query.filter(
            db.or_(
                PlacementDrive.job_title.ilike(f'%{search}%'),
                PlacementDrive.location.ilike(f'%{search}%')
            )
        )
    if status:
        query = query.filter_by(status=status)
    drives = query.order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives]), 200


@admin_bp.route('/drives/<int:id>', methods=['GET'])
@admin_required
def get_drive(id):
    drive = PlacementDrive.query.get_or_404(id)
    return jsonify(drive.to_dict()), 200


@admin_bp.route('/drives/<int:id>', methods=['PUT'])
@admin_required
def update_drive(id):
    drive = PlacementDrive.query.get_or_404(id)
    data = request.get_json()
    for field in ['job_title', 'job_description', 'eligibility_branch', 'eligibility_cgpa',
                  'eligibility_year', 'package_lpa', 'location', 'drive_type', 'status']:
        if field in data:
            setattr(drive, field, data[field])
    if 'application_deadline' in data and data['application_deadline']:
        from datetime import datetime
        drive.application_deadline = datetime.fromisoformat(data['application_deadline'])
    db.session.commit()
    return jsonify(drive.to_dict()), 200


@admin_bp.route('/drives/<int:id>', methods=['DELETE'])
@admin_required
def delete_drive(id):
    drive = PlacementDrive.query.get_or_404(id)
    db.session.delete(drive)
    db.session.commit()
    return jsonify({'message': 'Drive deleted'}), 200


@admin_bp.route('/drives/<int:id>/approve', methods=['PUT'])
@admin_required
def approve_drive(id):
    drive = PlacementDrive.query.get_or_404(id)
    data = request.get_json()
    status = data.get('status', 'approved')
    if status not in ('approved', 'closed'):
        return jsonify({'error': 'Status must be approved or closed'}), 400
    drive.status = status
    db.session.commit()
    return jsonify(drive.to_dict()), 200


# ─── Applications ───────────────────────────────────────────

@admin_bp.route('/applications', methods=['GET'])
@admin_required
def list_applications():
    drive_id = request.args.get('drive_id', type=int)
    student_id = request.args.get('student_id', type=int)
    status = request.args.get('status', '')
    query = Application.query
    if drive_id:
        query = query.filter_by(drive_id=drive_id)
    if student_id:
        query = query.filter_by(student_id=student_id)
    if status:
        query = query.filter_by(status=status)
    apps = query.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


@admin_bp.route('/applications/<int:id>', methods=['GET'])
@admin_required
def get_application(id):
    app = Application.query.get_or_404(id)
    return jsonify(app.to_dict()), 200
