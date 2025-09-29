# Security Deployment Guide

## Overview
This guide provides comprehensive instructions for securely deploying the Facility Management System with enhanced security features.

## Security Features Implemented

### 🔐 Authentication & Authorization
- **Argon2 Password Hashing**: Industry-standard secure password storage
- **Strong Password Policies**: 12+ characters with complexity requirements
- **JWT Authentication**: Secure token-based authentication with short expiry
- **Role-Based Access Control**: Admin, Contributor, Viewer roles with granular permissions
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes

### 🛡️ Account Security
- **Account Lockout**: Automatic lockout after 5 failed login attempts
- **Rate Limiting**: API endpoint throttling to prevent abuse
- **Audit Logging**: Comprehensive logging of all security events
- **Session Security**: Secure session management with HTTPS-only cookies

### 🌐 Web Security
- **CORS Protection**: Configured for specific origins only
- **Security Headers**: HSTS, CSP, X-Frame-Options, XSS Protection
- **CSRF Protection**: Built-in Django CSRF protection
- **SQL Injection Prevention**: Django ORM prevents SQL injection
- **XSS Prevention**: Template auto-escaping and CSP headers

## Deployment Instructions

### 1. Server Setup

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and PostgreSQL
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx redis-server

# Install Node.js for frontend
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

#### Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE facility_management;
CREATE USER facility_user WITH PASSWORD 'secure_database_password';
GRANT ALL PRIVILEGES ON DATABASE facility_management TO facility_user;
ALTER USER facility_user CREATEDB;
\q
```

### 2. Backend Deployment

#### Environment Setup
```bash
# Clone repository and setup virtual environment
git clone <your-repo>
cd facility-management/backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### Environment Configuration
```bash
# Copy and configure environment variables
cp .env.example .env
nano .env

# Generate secure secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Database Migration
```bash
# Run migrations
python manage.py migrate
python manage.py create_default_permissions
python manage.py create_dashboard_sections

# Create superuser
python manage.py createsuperuser
```

#### Static Files
```bash
# Collect static files
python manage.py collectstatic --noinput
```

### 3. Frontend Deployment

#### Build Frontend
```bash
cd ../frontend
npm install
npm run build
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/facility-management
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        root /var/www/facility-management/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Security
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;
    }

    # Admin interface (restrict access)
    location /admin/ {
        # Restrict to specific IPs
        allow 192.168.1.0/24;
        allow 10.0.0.0/8;
        deny all;
        
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Systemd Service

#### Gunicorn Service
```ini
# /etc/systemd/system/facility-management.service
[Unit]
Description=Facility Management Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/facility-management/backend
Environment=PATH=/var/www/facility-management/backend/venv/bin
EnvironmentFile=/var/www/facility-management/backend/.env
ExecStart=/var/www/facility-management/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    --timeout 60 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    facility_management.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 5. SSL Certificate

#### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 7. Monitoring & Logging

#### Log Rotation
```bash
# /etc/logrotate.d/facility-management
/var/log/facility_management/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload facility-management
    endscript
}
```

#### Security Monitoring
```bash
# Install fail2ban for additional protection
sudo apt install fail2ban

# Configure fail2ban for Django
sudo nano /etc/fail2ban/jail.local
```

```ini
[django-auth]
enabled = true
filter = django-auth
logpath = /var/log/facility_management/security.log
maxretry = 5
bantime = 3600
findtime = 600
```

### 8. Environment Variables

Create `.env` file with secure values:

```bash
# Generate secure secret key
SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

# Set production values
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_PASSWORD=$(openssl rand -base64 32)
```

### 9. Security Checklist

#### Pre-Deployment
- [ ] Change default SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Setup PostgreSQL with strong password
- [ ] Configure SSL certificates
- [ ] Set up proper firewall rules
- [ ] Configure secure headers
- [ ] Test all security features

#### Post-Deployment
- [ ] Verify HTTPS is working
- [ ] Test rate limiting
- [ ] Verify account lockout functionality
- [ ] Test 2FA setup and login
- [ ] Check audit logs are being created
- [ ] Verify permission controls work
- [ ] Test password policies
- [ ] Monitor security logs

### 10. Maintenance

#### Regular Tasks
- Monitor security logs daily
- Review failed login attempts
- Update dependencies monthly
- Rotate backup codes quarterly
- Review user permissions quarterly
- Test disaster recovery procedures

#### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Python dependencies
pip install --upgrade -r requirements.txt

# Update Node.js dependencies
npm audit fix
```

## Security Features Usage

### Admin Users
1. **Create Users**: Only admins can create new users with username, password, and role
2. **Manage Permissions**: Use the permissions management tab to control access
3. **Monitor Security**: Review audit logs and security events
4. **Account Management**: Unlock locked accounts when needed

### All Users
1. **Strong Passwords**: System enforces 12+ character passwords with complexity
2. **Two-Factor Auth**: Enable 2FA for enhanced security (required for admins)
3. **Secure Sessions**: Sessions expire after inactivity
4. **Audit Trail**: All actions are logged for security monitoring

### Developers
1. **Permission Checks**: Use `hasPermission()` hook in React components
2. **API Security**: All endpoints are permission-protected
3. **Input Validation**: Server-side validation prevents injection attacks
4. **Error Handling**: Secure error messages that don't leak information

## Troubleshooting

### Common Issues
1. **Account Locked**: Admin can unlock via user management interface
2. **2FA Issues**: Use backup codes or contact admin for reset
3. **Permission Denied**: Check role assignments and permission matrix
4. **SSL Issues**: Verify certificate installation and nginx configuration

### Emergency Access
1. Use Django admin interface with superuser account
2. Direct database access for critical issues
3. Server console access for system-level problems

This security implementation provides enterprise-grade protection for your facility management system while maintaining usability and performance.