# Facility Management System - Backend

## Overview
Django REST API backend for the Facility Management System with comprehensive security features, role-based access control, and facility management capabilities.

## Quick Start

### 1. Setup Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Run migrations
python manage.py migrate

# Create default permissions and dashboard sections
python manage.py create_default_permissions
python manage.py create_dashboard_sections
```

### 3. Create Admin User
```bash
# Interactive admin user creation
python manage.py create_admin_user

# Or create Django superuser
python manage.py createsuperuser
```

### 4. Start Development Server
```bash
python manage.py runserver
```

## Project Structure

```
backend/
├── accounts/                    # User authentication and management
│   ├── management/commands/     # Management commands
│   ├── migrations/             # Database migrations
│   ├── models.py              # User models with security features
│   ├── serializers.py         # API serializers
│   ├── views.py               # Authentication views
│   ├── permissions.py         # Custom permissions
│   ├── utils.py               # Utility functions
│   └── validators.py          # Password validators
├── facilities/                 # Facility management
│   ├── management/commands/    # Management commands
│   ├── migrations/            # Database migrations
│   ├── models.py              # Facility, tank, permit models
│   ├── serializers.py         # API serializers
│   └── views.py               # Facility management views
├── permissions/               # Permission management system
│   ├── management/commands/   # Management commands
│   ├── migrations/           # Database migrations
│   ├── models.py             # Permission models
│   ├── serializers.py        # API serializers
│   └── views.py              # Permission views
├── security/                 # Security features
│   ├── migrations/          # Database migrations
│   ├── models.py            # Security models
│   ├── middleware.py        # Security middleware
│   └── admin.py             # Admin configuration
└── facility_management/     # Django project settings
    ├── settings.py          # Main settings
    ├── urls.py              # URL configuration
    └── wsgi.py              # WSGI configuration
```

## Security Features

### Authentication & Authorization
- **Argon2 Password Hashing**: Industry-standard secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Contributor, Viewer roles
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Account Lockout**: Automatic lockout after failed attempts

### Security Monitoring
- **Audit Logging**: Comprehensive logging of all security events
- **Rate Limiting**: API endpoint throttling
- **Security Headers**: HSTS, CSP, X-Frame-Options, XSS Protection
- **CSRF Protection**: Built-in Django CSRF protection

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/password/change/` - Change password

### User Management (Admin only)
- `GET /api/auth/users/` - List all users
- `POST /api/auth/users/create/` - Create new user
- `GET /api/auth/users/{id}/` - Get user details
- `PATCH /api/auth/users/{id}/` - Update user
- `DELETE /api/auth/users/{id}/` - Delete user

### Facilities
- `GET /api/facilities/locations/` - List locations
- `POST /api/facilities/locations/` - Create location
- `GET /api/facilities/locations/{id}/` - Get location details
- `PATCH /api/facilities/locations/{id}/` - Update location
- `DELETE /api/facilities/locations/{id}/` - Delete location

### Tanks
- `GET /api/facilities/tanks/` - List all tanks
- `GET /api/facilities/locations/{id}/tanks/` - List tanks for location
- `POST /api/facilities/tanks/` - Create tank
- `PATCH /api/facilities/tanks/{id}/` - Update tank
- `DELETE /api/facilities/tanks/{id}/` - Delete tank

### Permits
- `GET /api/facilities/permits/` - List all permits
- `GET /api/facilities/locations/{id}/permits/` - List permits for location
- `POST /api/facilities/permits/` - Create permit
- `PATCH /api/facilities/permits/{id}/` - Update permit
- `DELETE /api/facilities/permits/{id}/` - Delete permit

## Management Commands

### User Management
```bash
# Create admin user interactively
python manage.py create_admin_user

# List all users
python manage.py list_users

# List users with details
python manage.py list_users --detailed

# Unlock user account
python manage.py unlock_user <username>
```

### System Setup
```bash
# Create default permissions
python manage.py create_default_permissions

# Create dashboard sections
python manage.py create_dashboard_sections
```

## Environment Variables

Create a `.env` file in the backend directory:

```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=facility_management
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Development

### Running Tests
```bash
python manage.py test
```

### Database Operations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
```

### Debugging
```bash
# Django shell
python manage.py shell

# Check user permissions
python manage.py list_users --detailed

# View logs
tail -f logs/security.log
```

## Production Deployment

See `SECURITY_DEPLOYMENT.md` for comprehensive production deployment instructions including:
- SSL/TLS configuration
- Database security
- Environment variable management
- Security monitoring
- Performance optimization

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in settings
   - Ensure database exists

2. **Permission Denied Errors**
   - Check user role assignments
   - Verify permission configuration
   - Review audit logs for details

3. **Authentication Issues**
   - Check JWT token configuration
   - Verify CORS settings
   - Review security logs

### Getting Help

1. Check the logs in `logs/security.log`
2. Use management commands for debugging
3. Review Django admin panel for data verification
4. Check API endpoints with tools like Postman

This backend provides a secure, scalable foundation for facility management with comprehensive security features and clean architecture.