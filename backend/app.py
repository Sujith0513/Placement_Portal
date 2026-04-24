from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from models import db, User
from config import Config
import os
import sys
import subprocess

cache = Cache()
jwt = JWTManager()

def install_requirements():
    requirements_file = os.path.join(os.path.dirname(__file__), 'requirements.txt')

    if os.path.exists(requirements_file):
        print("Installing dependencies from requirements.txt...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_file])
            print("Dependencies installed successfully.")
        except Exception as e:
            print(f"Error installing dependencies: {e}")
    else:
        print("requirements.txt not found. Please ensure it exists in the backend directory.")    


def create_app():
    app = Flask(__name__,
                static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static'),
                template_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt.init_app(app)

    try:
        cache.init_app(app)
    except Exception:
        app.config['CACHE_TYPE'] = 'SimpleCache'
        cache.init_app(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Serve frontend (use send_from_directory to avoid Jinja2 processing Vue templates)
    frontend_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend')

    @app.route('/')
    def index():
        return send_from_directory(frontend_folder, 'index.html')

    @app.route('/<path:path>')
    def catch_all(path):
        # Try to serve static file first
        static_path = os.path.join(app.static_folder, path)
        if os.path.isfile(static_path):
            return send_from_directory(app.static_folder, path)
        # Otherwise serve index.html for Vue Router (hash history, so this rarely fires)
        return send_from_directory(frontend_folder, 'index.html')

    # Create tables & seed admin
    with app.app_context():
        db.create_all()
        seed_admin()

    return app


def seed_admin():
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        admin = User(email='admin@ppa.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('[INIT] Admin user created: admin@ppa.com / admin123')


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
