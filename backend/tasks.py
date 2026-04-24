from celery import Celery
from celery.schedules import crontab

celery_app = Celery('ppa_tasks', broker='redis://localhost:6379/1', backend='redis://localhost:6379/1')

celery_app.conf.beat_schedule = {
    'daily-reminder': {
        'task': 'tasks.send_daily_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    'monthly-report': {
        'task': 'tasks.generate_monthly_report',
        'schedule': crontab(day_of_month=1, hour=8, minute=0),
    },
}


def get_flask_app():
    from app import create_app
    return create_app()


@celery_app.task
def send_daily_reminders():
    """Send reminders to students about upcoming application deadlines."""
    app = get_flask_app()
    with app.app_context():
        from models import PlacementDrive, StudentProfile
        from datetime import datetime, timedelta

        upcoming = PlacementDrive.query.filter(
            PlacementDrive.status == 'approved',
            PlacementDrive.application_deadline.between(
                datetime.utcnow(),
                datetime.utcnow() + timedelta(days=3)
            )
        ).all()

        if not upcoming:
            return 'No upcoming deadlines'

        students = StudentProfile.query.filter_by(is_blacklisted=False).all()

        for student in students:
            for drive in upcoming:
                print(f"[REMINDER] {student.name} ({student.user.email}): "
                      f"'{drive.job_title}' by {drive.company.company_name} "
                      f"deadline: {drive.application_deadline}")

        return f'Sent reminders for {len(upcoming)} drives to {len(students)} students'


@celery_app.task
def generate_monthly_report():
    """Generate monthly placement activity report and send to admin."""
    app = get_flask_app()
    with app.app_context():
        from models import db, User, PlacementDrive, Application, CompanyProfile, StudentProfile
        from sqlalchemy import func
        from datetime import datetime, timedelta

        last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
        month_start = last_month.replace(day=1)

        drives_count = PlacementDrive.query.filter(
            PlacementDrive.created_at.between(month_start, last_month)
        ).count()

        apps_count = Application.query.filter(
            Application.created_at.between(month_start, last_month)
        ).count()

        selected_count = Application.query.filter(
            Application.status == 'selected',
            Application.created_at.between(month_start, last_month)
        ).count()

        report_html = f"""
        <html>
        <head><style>
          body {{ font-family: Arial; padding: 20px; }}
          .stat {{ background: #f4f7fa; padding: 15px; margin: 10px 0; border-radius: 8px; }}
          h1 {{ color: #2c3e50; }}
          .num {{ font-size: 24px; font-weight: bold; color: #3498db; }}
        </style></head>
        <body>
          <h1>Monthly Placement Report - {last_month.strftime('%B %Y')}</h1>
          <div class="stat"><span class="num">{drives_count}</span> Placement Drives Conducted</div>
          <div class="stat"><span class="num">{apps_count}</span> Student Applications</div>
          <div class="stat"><span class="num">{selected_count}</span> Students Selected</div>
        </body>
        </html>
        """

        admin = User.query.filter_by(role='admin').first()
        if admin:
            print(f"[MONTHLY REPORT] Sent to {admin.email}")
            print(report_html)

        return f'Monthly report: {drives_count} drives, {apps_count} apps, {selected_count} selected'


@celery_app.task
def export_student_csv(student_id):
    """Export student applications to CSV."""
    app = get_flask_app()
    with app.app_context():
        from models import StudentProfile, Application
        import csv
        import os

        student = StudentProfile.query.get(student_id)
        if not student:
            return 'Student not found'

        apps = student.applications.all()

        export_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'exports')
        os.makedirs(export_dir, exist_ok=True)

        from datetime import datetime
        filename = f"applications_{student_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
        filepath = os.path.join(export_dir, filename)

        with open(filepath, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Application ID', 'Company Name', 'Drive Title', 'Status', 'Application Date'])
            for a in apps:
                writer.writerow([
                    a.id,
                    a.drive.company.company_name if a.drive and a.drive.company else '',
                    a.drive.job_title if a.drive else '',
                    a.status,
                    a.application_date.strftime('%Y-%m-%d') if a.application_date else ''
                ])

        print(f"[CSV EXPORT] File ready: {filename} for student {student.name}")
        return f'Export complete: {filename}'
