from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, CompanyProfile, PlacementDrive, Application, Interview, StudentProfile
from functools import wraps
from datetime import datetime

company_bp = Blueprint('company', __name__)


def company_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'company':
            return jsonify({'error': 'Company access required'}), 403
        if not user.company_profile:
            return jsonify({'error': 'Company profile not found'}), 404
        if user.company_profile.is_blacklisted:
            return jsonify({'error': 'Your company has been blacklisted'}), 403
        return fn(user.company_profile, *args, **kwargs)
    return wrapper


# ─── Profile ────────────────────────────────────────────────

@company_bp.route('/profile', methods=['GET'])
@company_required
def get_profile(company):
    return jsonify(company.to_dict()), 200


@company_bp.route('/profile', methods=['PUT'])
@company_required
def update_profile(company):
    data = request.get_json()
    for field in ['company_name', 'hr_contact', 'hr_email', 'website', 'industry', 'description']:
        if field in data:
            setattr(company, field, data[field])
    db.session.commit()
    return jsonify(company.to_dict()), 200


# ─── Drives ─────────────────────────────────────────────────

@company_bp.route('/drives', methods=['GET'])
@company_required
def list_drives(company):
    drives = company.drives.order_by(PlacementDrive.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drives]), 200


@company_bp.route('/drives/<int:id>', methods=['GET'])
@company_required
def get_drive(company, id):
    drive = PlacementDrive.query.get_or_404(id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify(drive.to_dict()), 200


@company_bp.route('/drives', methods=['POST'])
@company_required
def create_drive(company):
    if company.approval_status != 'approved':
        return jsonify({'error': 'Company must be approved by admin before creating drives'}), 403

    data = request.get_json()
    if not data.get('job_title'):
        return jsonify({'error': 'Job title is required'}), 400

    deadline = None
    if data.get('application_deadline'):
        try:
            deadline = datetime.fromisoformat(data['application_deadline'])
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400

    drive = PlacementDrive(
        company_id=company.id,
        job_title=data['job_title'],
        job_description=data.get('job_description', ''),
        eligibility_branch=data.get('eligibility_branch', 'all'),
        eligibility_cgpa=data.get('eligibility_cgpa', 0.0),
        eligibility_year=data.get('eligibility_year'),
        application_deadline=deadline,
        package_lpa=data.get('package_lpa'),
        location=data.get('location', ''),
        drive_type=data.get('drive_type', 'full-time'),
        status='pending'
    )
    db.session.add(drive)
    db.session.commit()
    return jsonify(drive.to_dict()), 201


@company_bp.route('/drives/<int:id>', methods=['PUT'])
@company_required
def update_drive(company, id):
    drive = PlacementDrive.query.get_or_404(id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    for field in ['job_title', 'job_description', 'eligibility_branch', 'eligibility_cgpa',
                  'eligibility_year', 'package_lpa', 'location', 'drive_type']:
        if field in data:
            setattr(drive, field, data[field])
    if 'application_deadline' in data and data['application_deadline']:
        drive.application_deadline = datetime.fromisoformat(data['application_deadline'])
    if 'status' in data and data['status'] == 'closed':
        drive.status = 'closed'
    db.session.commit()
    return jsonify(drive.to_dict()), 200


@company_bp.route('/drives/<int:id>', methods=['DELETE'])
@company_required
def delete_drive(company, id):
    drive = PlacementDrive.query.get_or_404(id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403
    if drive.status == 'approved' and drive.applications.count() > 0:
        return jsonify({'error': 'Cannot delete approved drive with applications'}), 400
    db.session.delete(drive)
    db.session.commit()
    return jsonify({'message': 'Drive deleted'}), 200


# ─── Applications ───────────────────────────────────────────

@company_bp.route('/drives/<int:id>/applications', methods=['GET'])
@company_required
def list_applications(company, id):
    drive = PlacementDrive.query.get_or_404(id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403
    apps = drive.applications.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


@company_bp.route('/applications/<int:id>', methods=['GET'])
@company_required
def get_application(company, id):
    app = Application.query.get_or_404(id)
    if app.drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403
    data = app.to_dict()
    # Include full student info
    student = app.student
    if student:
        data['student_detail'] = student.to_dict()
    return jsonify(data), 200


@company_bp.route('/applications/<int:id>/status', methods=['PUT'])
@company_required
def update_application_status(company, id):
    app = Application.query.get_or_404(id)
    if app.drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    new_status = data.get('status', '')
    if new_status not in ('shortlisted', 'interviewed', 'selected', 'rejected'):
        return jsonify({'error': 'Invalid status'}), 400

    app.status = new_status
    db.session.commit()
    return jsonify(app.to_dict()), 200


# ─── Interviews ─────────────────────────────────────────────

@company_bp.route('/interviews', methods=['POST'])
@company_required
def schedule_interview(company):
    data = request.get_json()
    app_id = data.get('application_id')
    if not app_id:
        return jsonify({'error': 'Application ID is required'}), 400

    app = Application.query.get_or_404(app_id)
    if app.drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    if app.interview:
        return jsonify({'error': 'Interview already scheduled for this application'}), 409

    try:
        scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
    except (KeyError, ValueError):
        return jsonify({'error': 'Valid scheduled_date (YYYY-MM-DD) is required'}), 400

    interview = Interview(
        application_id=app_id,
        scheduled_date=scheduled_date,
        scheduled_time=data.get('scheduled_time', ''),
        venue=data.get('venue', ''),
        mode=data.get('mode', 'offline'),
        meeting_link=data.get('meeting_link', ''),
        notes=data.get('notes', '')
    )
    # Update application status to interviewed
    app.status = 'interviewed'
    db.session.add(interview)
    db.session.commit()
    return jsonify(interview.to_dict()), 201


@company_bp.route('/interviews', methods=['GET'])
@company_required
def list_interviews(company):
    interviews = Interview.query.join(Application).join(PlacementDrive)\
        .filter(PlacementDrive.company_id == company.id)\
        .order_by(Interview.scheduled_date.desc()).all()
    result = []
    for i in interviews:
        d = i.to_dict()
        d['student_name'] = i.application.student.name if i.application.student else None
        d['drive_title'] = i.application.drive.job_title if i.application.drive else None
        result.append(d)
    return jsonify(result), 200


@company_bp.route('/interviews/<int:id>', methods=['GET'])
@company_required
def get_interview(company, id):
    interview = Interview.query.get_or_404(id)
    if interview.application.drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403
    d = interview.to_dict()
    d['student_name'] = interview.application.student.name if interview.application.student else None
    d['drive_title'] = interview.application.drive.job_title if interview.application.drive else None
    return jsonify(d), 200


@company_bp.route('/interviews/<int:id>', methods=['PUT'])
@company_required
def update_interview(company, id):
    interview = Interview.query.get_or_404(id)
    if interview.application.drive.company_id != company.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    for field in ['scheduled_time', 'venue', 'mode', 'meeting_link', 'notes', 'status']:
        if field in data:
            setattr(interview, field, data[field])
    if 'scheduled_date' in data:
        interview.scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(interview.to_dict()), 200
