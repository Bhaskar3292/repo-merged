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
```

### 4. Start Server
```bash
python manage.py runserver
```

## 🔍 Verification

### Check Users
```bash
python manage.py list_users
```

### Check API Health
Visit: http://localhost:8000/api/health/

### Access Admin Panel
Visit: http://localhost:8000/admin/

## 📋 Important Commands

```bash
# Create superuser
python manage.py createsuperuser

# List users with details
python manage.py list_users --detailed

# Unlock user account
python manage.py unlock_user <username>

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

## 🔐 Production Considerations

### For Production Deployment:
1. **Change SECRET_KEY** in settings
2. **Set DEBUG=False**
3. **Configure proper database** (PostgreSQL recommended)
4. **Enable HTTPS** and security headers
5. **Set up proper CORS** origins
6. **Configure logging** and monitoring

This guide ensures you can set up the backend with proper security measures in place!