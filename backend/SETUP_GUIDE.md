# Backend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database
```bash
# Run migrations
python manage.py migrate

# Create default data
python manage.py create_default_permissions
python manage.py create_dashboard_sections
```

### 3. Create Admin User
```bash
# Interactive admin user creation
python manage.py create_admin_user

# Or create sample users for testing
python manage.py create_sample_users
```

### 4. Start Server
```bash
python manage.py runserver
```

## 🔧 Alternative Setup Methods

### Method 1: Automated Setup
```bash
cd backend
python setup.py
```

### Method 2: Run Server with Auto-Setup
```bash
cd backend
python run_server.py
```

### Method 3: Manual Step-by-Step
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create default data
python manage.py create_default_permissions
python manage.py create_dashboard_sections

# Create admin user
python manage.py create_admin_user

# Start server
python manage.py runserver
```

## 🔍 Verification

### Check Setup Status
```bash
python manage.py check_setup
```

### List Users
```bash
python manage.py list_users
```

### Reset Database (Development Only)
```bash
python manage.py reset_database --confirm
```

## 📋 Sample Credentials

After running `python manage.py create_sample_users`:

- **Admin**: admin@facility.com / SecureAdmin123!
- **Contributor**: operator@facility.com / SecureOp123!
- **Viewer**: viewer@facility.com / SecureView123!

## 🌐 API Endpoints

- **Health Check**: http://localhost:8000/api/health/
- **Admin Panel**: http://localhost:8000/admin/
- **API Root**: http://localhost:8000/api/

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**: Run `pip install -r requirements.txt`
2. **Database Errors**: Run `python manage.py migrate`
3. **Permission Errors**: Run `python manage.py create_default_permissions`
4. **No Admin User**: Run `python manage.py create_admin_user`

### Reset Everything
```bash
python manage.py reset_database --confirm
python manage.py create_admin_user
```

## 📁 Project Structure

```
backend/
├── accounts/              # User management
├── facilities/            # Facility management
├── permissions/           # Permission system
├── security/             # Security features
├── facility_management/  # Django project
├── logs/                 # Log files
├── media/                # Uploaded files
├── staticfiles/          # Static files
├── manage.py             # Django management
├── setup.py              # Automated setup
├── run_server.py         # Development server
└── requirements.txt      # Dependencies
```

The backend is now properly structured and ready for development!