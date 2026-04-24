from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, StudentProfile, PlacementDrive, Application, Interview
from functools import wraps
from datetime import datetime
import os

student_bp = Blueprint('student', __name__)


def student_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'student':
            return jsonify({'error': 'Student access required'}), 403
        if not user.student_profile:
            return jsonify({'error': 'Student profile not found'}), 404
        if user.student_profile.is_blacklisted:
            return jsonify({'error': 'Your account has been blacklisted'}), 403
        return fn(user.student_profile, *args, **kwargs)
    return wrapper


# ─── Profile ────────────────────────────────────────────────

@student_bp.route('/profile', methods=['GET'])
@student_required
def get_profile(student):
    return jsonify(student.to_dict()), 200


@student_bp.route('/profile', methods=['PUT'])
@student_required
def update_profile(student):
    data = request.get_json()
    for field in ['name', 'roll_number', 'branch', 'cgpa', 'year', 'phone']:
        if field in data:
            setattr(student, field, data[field])
    db.session.commit()
    return jsonify(student.to_dict()), 200


@student_bp.route('/resume', methods=['POST'])
@student_required
def upload_resume(student):
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    allowed_ext = {'pdf', 'doc', 'docx'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_ext:
        return jsonify({'error': 'Only PDF, DOC, DOCX files allowed'}), 400

    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"resume_{student.id}_{student.roll_number}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    student.resume_path = filename
    db.session.commit()
    return jsonify({'message': 'Resume uploaded', 'filename': filename}), 200


# ─── Drives ─────────────────────────────────────────────────

@student_bp.route('/drives', methods=['GET'])
@student_required
def list_drives(student):
    search = request.args.get('search', '')
    branch = request.args.get('branch', '')
    min_cgpa = request.args.get('min_cgpa', type=float)

    query = PlacementDrive.query.filter_by(status='approved')

    if search:
        query = query.filter(
            db.or_(
                PlacementDrive.job_title.ilike(f'%{search}%'),
                PlacementDrive.location.ilike(f'%{search}%')
            )
        )
    if branch:
        query = query.filter(
            db.or_(
                PlacementDrive.eligibility_branch.ilike(f'%{branch}%'),
                PlacementDrive.eligibility_branch == 'all'
            )
        )

    drives = query.order_by(PlacementDrive.created_at.desc()).all()

    # Add whether student has already applied
    result = []
    for d in drives:
        data = d.to_dict()
        existing_app = Application.query.filter_by(
            student_id=student.id, drive_id=d.id
        ).first()
        data['already_applied'] = existing_app is not None
        data['eligible'] = True
        # Check eligibility
        if d.eligibility_cgpa and student.cgpa and student.cgpa < d.eligibility_cgpa:
            data['eligible'] = False
        if d.eligibility_year and student.year and student.year != d.eligibility_year:
            data['eligible'] = False
        if d.eligibility_branch and d.eligibility_branch != 'all':
            branches = [b.strip().lower() for b in d.eligibility_branch.split(',')]
            if student.branch and student.branch.lower() not in branches:
                data['eligible'] = False
        result.append(data)

    return jsonify(result), 200


@student_bp.route('/drives/<int:id>/apply', methods=['POST'])
@student_required
def apply_to_drive(student, id):
    drive = PlacementDrive.query.get_or_404(id)

    if drive.status != 'approved':
        return jsonify({'error': 'This drive is not accepting applications'}), 400

    if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
        return jsonify({'error': 'Application deadline has passed'}), 400

    # Duplicate check
    existing = Application.query.filter_by(student_id=student.id, drive_id=id).first()
    if existing:
        return jsonify({'error': 'You have already applied to this drive'}), 409

    # Eligibility check
    if drive.eligibility_cgpa and student.cgpa and student.cgpa < drive.eligibility_cgpa:
        return jsonify({'error': f'Minimum CGPA of {drive.eligibility_cgpa} required'}), 400

    if drive.eligibility_year and student.year and student.year != drive.eligibility_year:
        return jsonify({'error': f'This drive is for year {drive.eligibility_year} students only'}), 400

    if drive.eligibility_branch and drive.eligibility_branch != 'all':
        branches = [b.strip().lower() for b in drive.eligibility_branch.split(',')]
        if student.branch and student.branch.lower() not in branches:
            return jsonify({'error': 'Your branch is not eligible for this drive'}), 400

    application = Application(student_id=student.id, drive_id=id)
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201


# ─── Applications ───────────────────────────────────────────

@student_bp.route('/applications', methods=['GET'])
@student_required
def list_applications(student):
    apps = student.applications.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


# ─── Interviews ─────────────────────────────────────────────

@student_bp.route('/interviews', methods=['GET'])
@student_required
def list_interviews(student):
    interviews = Interview.query.join(Application)\
        .filter(Application.student_id == student.id)\
        .order_by(Interview.scheduled_date.desc()).all()
    result = []
    for i in interviews:
        d = i.to_dict()
        d['drive_title'] = i.application.drive.job_title if i.application.drive else None
        d['company_name'] = i.application.drive.company.company_name if i.application.drive and i.application.drive.company else None
        result.append(d)
    return jsonify(result), 200


# ─── History ────────────────────────────────────────────────

@student_bp.route('/history', methods=['GET'])
@student_required
def placement_history(student):
    # History = applications to closed drives or with final status (selected/rejected)
    apps = Application.query.filter(
        Application.student_id == student.id,
        db.or_(
            Application.status.in_(['selected', 'rejected']),
            Application.drive.has(PlacementDrive.status == 'closed')
        )
    ).order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


# ─── CSV Export ─────────────────────────────────────────────

@student_bp.route('/export-csv', methods=['POST'])
@student_required
def export_csv(student):
    try:
        from tasks import export_student_csv
        export_student_csv.delay(student.id)
        return jsonify({'message': 'CSV export started. You will be notified when ready.'}), 202
    except Exception as e:
        # Fallback: generate synchronously if Celery not available
        import csv
        import io
        apps = student.applications.all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Application ID', 'Company Name', 'Drive Title', 'Status', 'Application Date'])
        for a in apps:
            writer.writerow([
                a.id,
                a.drive.company.company_name if a.drive and a.drive.company else '',
                a.drive.job_title if a.drive else '',
                a.status,
                a.application_date.strftime('%Y-%m-%d') if a.application_date else ''
            ])
        csv_content = output.getvalue()

        # Save to file
        export_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'exports')
        os.makedirs(export_dir, exist_ok=True)
        filename = f"applications_{student.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
        filepath = os.path.join(export_dir, filename)
        with open(filepath, 'w', newline='') as f:
            f.write(csv_content)

        return jsonify({
            'message': 'CSV export completed',
            'filename': filename,
            'download_url': f'/api/student/download/{filename}'
        }), 200


@student_bp.route('/download/<filename>', methods=['GET'])
@student_required
def download_export(student, filename):
    from flask import send_from_directory
    export_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'exports')
    return send_from_directory(export_dir, filename, as_attachment=True)
