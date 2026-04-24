# Placement Portal - IIITDM

A comprehensive web-based campus placement portal for managing recruitment drives, company registrations, and student applications.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [User Roles & Permissions](#user-roles--permissions)
- [Contributing](#contributing)

---

## ✨ Features

### Admin Dashboard
- Manage company registrations and approvals
- Blacklist/whitelist companies and students
- Monitor placement drives and applications
- View comprehensive placement reports
- Export data to CSV format
- Manage user accounts

### Company Portal
- Register company profile and details
- Create and manage placement drives
- View student applications
- Schedule interviews
- Track application statistics
- Export applications list

### Student Portal
- Complete student profile management
- Browse available placement drives
- Apply to drives with resume upload
- Track application status
- View interview schedules
- Monitor placement history

### Authentication & Security
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with Werkzeug
- Secure file uploads (max 5MB)
- CORS-enabled API

---

## 🛠 Technology Stack

### Backend
- **Framework:** Flask 3.1.0
- **Database:** SQLite (via SQLAlchemy 3.1.1)
- **Authentication:** Flask-JWT-Extended 4.7.1
- **Task Queue:** Celery 5.4.0
- **Cache/Message Broker:** Redis 5.2.1
- **CORS Support:** Flask-CORS 5.0.1
- **Email:** Flask-Mail 0.10.0
- **Caching:** Flask-Caching 2.3.1
- **WSGI Server:** Werkzeug 3.1.3

### Frontend
- **Framework:** Vue.js 3.4.21
- **Router:** Vue Router 4.3.0
- **HTTP Client:** Axios 1.7.2
- **UI Framework:** Bootstrap 5.3.3
- **Icons:** Bootstrap Icons 1.11.3
- **Charts:** Chart.js 4.4.2
- **Fonts:** Google Fonts (Inter)

### Development & Deployment
- **Python:** 3.9+
- **Package Manager:** pip
- **Version Control:** Git

---

## 📁 Project Structure

```
placement-portal/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration settings
│   ├── models.py              # Database models
│   ├── requirements.txt        # Python dependencies
│   ├── tasks.py               # Celery tasks
│   ├── routes/                # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── admin.py           # Admin management endpoints
│   │   ├── company.py         # Company endpoints
│   │   └── student.py         # Student endpoints
│   ├── instance/              # Instance-specific files
│   └── uploads/               # File uploads directory
│       └── exports/           # CSV exports
│
├── frontend/
│   ├── index.html             # Main HTML file
│   └── static/
│       ├── css/
│       │   └── style.css      # Global styles
│       └── js/
│           ├── app.js         # Vue app initialization
│           └── components/    # Vue components
│               ├── Login.js
│               ├── Register.js
│               ├── Navbar.js
│               ├── AdminDashboard.js
│               ├── AdminCompanies.js
│               ├── AdminStudents.js
│               ├── AdminDrives.js
│               ├── AdminReports.js
│               ├── AdminApplications.js
│               ├── CompanyDashboard.js
│               ├── CompanyDrives.js
│               ├── CompanyApplications.js
│               ├── CompanyInterviews.js
│               ├── StudentDashboard.js
│               ├── StudentApplications.js
│               ├── StudentProfile.js
│               └── StudentHistory.js
│
├── README.md                  # This file
├── .gitignore
└── implementation_plan.md     # Project documentation

```

---

## 📋 Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Redis server (for caching and Celery)
- Git
- Modern web browser

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sujith0513/Placement_Portal.git
cd Placement_Portal
```

### 2. Backend Setup

#### Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install Redis (if not already installed)

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl apt-get install redis-server`

**Linux:**
```bash
sudo apt-get install redis-server
```

**macOS:**
```bash
brew install redis
```

### 4. Start Redis Server

**Windows (WSL):**
```bash
wsl redis-server
```

**Linux/macOS:**
```bash
redis-server
```

---

## ⚙️ Configuration

Edit `backend/config.py` to customize settings:

```python
# Database
SQLALCHEMY_DATABASE_URI = 'sqlite:///placement.db'

# JWT Token Expiration (in seconds)
JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

# Redis Configuration
CACHE_REDIS_URL = 'redis://localhost:6379/0'
CELERY_BROKER_URL = 'redis://localhost:6379/1'

# Email Configuration
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 587
MAIL_USERNAME = 'your-email@gmail.com'
MAIL_PASSWORD = 'your-app-password'

# File Upload
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB
```

### Environment Variables

Create a `.env` file in the backend directory:

```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## 🎯 Running the Application

### Development Mode

1. **Start Backend (from `backend/` directory):**
```bash
python app.py
```
- Backend runs on: `http://127.0.0.1:5000`
- Auto-reloader enabled
- Debugger active

2. **Start Redis (in separate terminal):**
```bash
redis-server
```

3. **Access Frontend:**
Open browser to: `http://localhost:5000`

### Default Credentials

```
Email: admin@ppa.com
Password: admin123
Role: Admin
```

> **⚠️ Change these credentials in production!**

### Production Mode

Change in `app.py`:
```python
app.run(debug=False, port=5000)
```

Or run with a production WSGI server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 📡 API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login user |
| POST | `/register` | Register new user |
| POST | `/logout` | Logout user |
| GET | `/profile` | Get current user profile |
| POST | `/refresh-token` | Refresh JWT token |

### Admin (`/api/admin/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students |
| GET | `/companies` | List all companies |
| GET | `/drives` | List all drives |
| GET | `/applications` | List all applications |
| POST | `/company/<id>/approve` | Approve company registration |
| POST | `/company/<id>/reject` | Reject company registration |
| POST | `/blacklist/student/<id>` | Blacklist student |
| POST | `/blacklist/company/<id>` | Blacklist company |
| GET | `/reports` | Get placement statistics |
| GET | `/export/applications` | Export applications to CSV |

### Company (`/api/company/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get company profile |
| PUT | `/profile` | Update company profile |
| GET | `/drives` | List company drives |
| POST | `/drives` | Create new drive |
| GET | `/applications` | Get drive applications |
| POST | `/interviews` | Schedule interview |
| GET | `/statistics` | Get drive statistics |

### Student (`/api/student/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get student profile |
| PUT | `/profile` | Update student profile |
| POST | `/upload-resume` | Upload resume |
| GET | `/available-drives` | List available drives |
| POST | `/apply` | Apply to drive |
| GET | `/applications` | Get student applications |
| GET | `/interviews` | Get interview schedule |
| GET | `/history` | Get placement history |

---

## 💾 Database Models

### User
```
- id: Integer (Primary Key)
- email: String (Unique)
- password_hash: String
- role: String (admin, company, student)
- is_active: Boolean
- created_at: DateTime
```

### StudentProfile
```
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- name: String
- roll_number: String (Unique)
- branch: String
- cgpa: Float
- year: Integer
- phone: String
- resume_path: String
- is_blacklisted: Boolean
- created_at: DateTime
```

### CompanyProfile
```
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- company_name: String
- hr_contact: String
- hr_email: String
- website: String
- industry: String
- description: Text
- approval_status: String (pending, approved, rejected)
- is_blacklisted: Boolean
- created_at: DateTime
```

### PlacementDrive
```
- id: Integer (Primary Key)
- company_id: Integer (Foreign Key)
- title: String
- description: Text
- position_count: Integer
- location: String
- salary: String
- eligibility_cgpa: Float
- eligible_branches: String
- start_date: DateTime
- end_date: DateTime
- created_at: DateTime
```

### Application
```
- id: Integer (Primary Key)
- student_id: Integer (Foreign Key)
- drive_id: Integer (Foreign Key)
- status: String (applied, selected, rejected)
- applied_at: DateTime
- resume_path: String
```

---

## 👥 User Roles & Permissions

### Admin
- ✅ Approve/reject company registrations
- ✅ Blacklist companies and students
- ✅ View all placements and drives
- ✅ Generate reports and statistics
- ✅ Export data
- ✅ Manage all users

### Company
- ✅ Create placement drives
- ✅ View student applications
- ✅ Schedule interviews
- ✅ View application statistics
- ✅ Export applications

### Student
- ✅ Complete profile with resume
- ✅ View available drives
- ✅ Apply to drives
- ✅ Track application status
- ✅ View interview schedule
- ✅ Access placement history

---

## 🔒 Security Features

- JWT authentication with 24-hour token expiry
- Password hashing with Werkzeug
- Role-based access control (RBAC)
- CORS protection
- File upload restrictions (5MB max)
- Email verification (optional)
- Blacklist functionality for bad actors

---

## 📝 License

This project is part of the MAD-2 curriculum at IIT Madras Online Degree.

---

## 👨‍💻 Contributing

For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact: rsujithgopi@gmail.com

---

## 🙏 Acknowledgments

- Uses open-source libraries: Flask, Vue.js, Bootstrap, SQLAlchemy
- Inspired by real-world placement management systems

---

**Last Updated:** April 24, 2026
