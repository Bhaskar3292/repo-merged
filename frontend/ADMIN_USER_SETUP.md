# Admin User Creation Guide

## 🔐 **Creating Admin Users for Facility Management System**

This guide provides step-by-step instructions for creating admin users in your facility management application.

## 📋 **Prerequisites**

Before creating admin users, ensure:
- Django backend is properly set up and running
- Database migrations have been applied
- Required dependencies are installed

## 🚀 **Method 1: Django Superuser (Recommended for Initial Setup)**

### **Step 1: Navigate to Backend Directory**
```bash
cd backend
```

### **Step 2: Activate Virtual Environment (if using one)**
```bash
# If using virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

### **Step 3: Create Django Superuser**
```bash
python manage.py createsuperuser
```

### **Step 4: Follow the Interactive Prompts**
```
Username: admin
Email address: admin@facility.com
Password: [Enter a strong password - minimum 12 characters]
Password (again): [Confirm password]
```

### **Step 5: Update User Role (Important!)**
After creating the superuser, you need to set the role to 'admin':

```bash
python manage.py shell
```

Then in the Django shell:
```python
from accounts.models import User
user = User.objects.get(username='admin')
user.role = 'admin'
user.save()
print(f"User {user.username} role updated to: {user.role}")
exit()
```

## 🛠 **Method 2: Using Management Command (Automated)**

### **Step 1: Run the Sample Users Command**
```bash
cd backend
python manage.py create_sample_users
```

This creates three test users:
- **Admin**: admin@facility.com / SecureAdmin123!
- **Contributor**: operator@facility.com / SecureOp123!
- **Viewer**: viewer@facility.com / SecureView123!

### **Step 2: Reset Sample Users (if needed)**
```bash
python manage.py create_sample_users --reset
```

## 🎯 **Method 3: Through Django Admin Interface**

### **Step 1: Access Django Admin**
1. Start the Django development server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Navigate to: `http://localhost:8000/admin/`

3. Login with your superuser credentials

### **Step 2: Create New User**
1. Click on **"Users"** under the **ACCOUNTS** section
2. Click **"Add User"** button
3. Fill in the required fields:
   - **Username**: Choose a unique username
   - **Password**: Enter a strong password (12+ characters)
   - **Password confirmation**: Confirm the password

### **Step 3: Set User Details**
After creating the basic user:
1. **Personal info**:
   - First name: Enter first name
   - Last name: Enter last name
   - Email address: Enter valid email

2. **Permissions**:
   - ✅ Active: Check this box
   - ✅ Staff status: Check for admin access
   - ✅ Superuser status: Check for full admin rights

3. **Role Information**:
   - **Role**: Select "Administrator"

4. Click **"Save"**

## 🔧 **Method 4: Programmatic Creation (Advanced)**

### **Create Admin User Script**
Create a file `create_admin.py` in the backend directory:

```python
#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
django.setup()

from accounts.models import User
from django.contrib.auth.hashers import make_password

def create_admin_user():
    """Create an admin user programmatically"""
    
    # User details
    username = input("Enter username: ")
    email = input("Enter email: ")
    first_name = input("Enter first name: ")
    last_name = input("Enter last name: ")
    password = input("Enter password (min 12 chars): ")
    
    # Validate password length
    if len(password) < 12:
        print("❌ Password must be at least 12 characters long")
        return
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"❌ User '{username}' already exists")
        return
    
    if User.objects.filter(email=email).exists():
        print(f"❌ Email '{email}' already exists")
        return
    
    # Create the user
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        print(f"✅ Admin user '{username}' created successfully!")
        print(f"   Email: {email}")
        print(f"   Role: {user.role}")
        print(f"   Staff: {user.is_staff}")
        print(f"   Superuser: {user.is_superuser}")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")

if __name__ == "__main__":
    create_admin_user()
```

### **Run the Script**
```bash
cd backend
python create_admin.py
```

## 🔍 **Verification Steps**

### **Step 1: Verify User Creation**
```bash
cd backend
python manage.py shell
```

```python
from accounts.models import User

# List all admin users
admin_users = User.objects.filter(role='admin')
for user in admin_users:
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
    print(f"Staff: {user.is_staff}")
    print(f"Superuser: {user.is_superuser}")
    print("---")
```

### **Step 2: Test Login**
1. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   python manage.py runserver

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

2. Navigate to the frontend URL (usually `http://localhost:5173`)

3. Try logging in with your admin credentials

### **Step 3: Verify Admin Access**
After logging in:
- ✅ Check that "Admin Panel" appears in the sidebar
- ✅ Verify you can access User Management
- ✅ Confirm you can create new users
- ✅ Test permissions management functionality

## 🔒 **Security Best Practices**

### **Password Requirements**
- ✅ **Minimum 12 characters**
- ✅ **Uppercase and lowercase letters**
- ✅ **Numbers and special characters**
- ✅ **No personal information**
- ✅ **No common patterns or sequences**

### **Admin Account Security**
1. **Enable 2FA**: Go to Settings → Security → Enable 2FA
2. **Strong Password**: Use a password manager
3. **Regular Updates**: Change password every 90 days
4. **Monitor Access**: Review audit logs regularly

### **Example Strong Passwords**
```
✅ Good: MyF@cility2024!Secure
✅ Good: Admin#Facility$2024
✅ Good: SecureF@c1l1ty!2024
❌ Bad: password123
❌ Bad: admin123
❌ Bad: facility
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Issue: "Password too weak" error**
**Solution**: Ensure password meets all requirements:
```bash
# Check password strength in Django shell
from django.contrib.auth.password_validation import validate_password
from accounts.models import User

try:
    validate_password("YourPassword123!")
    print("✅ Password is valid")
except Exception as e:
    print(f"❌ Password validation failed: {e}")
```

#### **Issue: "User already exists" error**
**Solution**: Check existing users and use a different username:
```bash
python manage.py shell
```
```python
from accounts.models import User
existing_users = User.objects.values_list('username', flat=True)
print("Existing usernames:", list(existing_users))
```

#### **Issue: "Permission denied" in admin panel**
**Solution**: Verify user has admin role and staff status:
```python
user = User.objects.get(username='your_username')
user.role = 'admin'
user.is_staff = True
user.is_superuser = True
user.save()
```

#### **Issue: Can't access admin features in frontend**
**Solution**: Ensure user role is set correctly:
```python
# Check user permissions
user = User.objects.get(username='your_username')
print(f"Role: {user.role}")
print(f"Is Admin: {user.is_admin}")
print(f"Can Create Users: {user.can_create_users()}")
```

## 📝 **Quick Reference**

### **Default Admin Credentials (Development Only)**
```
Email: admin@facility.com
Password: SecureAdmin123!
Role: Administrator
```

### **Admin Capabilities**
- ✅ **User Management**: Create, edit, delete users
- ✅ **Permission Management**: Configure role permissions
- ✅ **Facility Management**: Full CRUD operations
- ✅ **System Settings**: Configure application settings
- ✅ **Audit Logs**: View security events and user actions
- ✅ **Account Management**: Unlock locked accounts

### **Important Commands**
```bash
# Create superuser
python manage.py createsuperuser

# Create sample users
python manage.py create_sample_users

# Reset sample users
python manage.py create_sample_users --reset

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

## 🔐 **Production Considerations**

### **For Production Deployment:**
1. **Change default passwords** immediately
2. **Enable 2FA** for all admin accounts
3. **Use environment variables** for sensitive data
4. **Restrict admin access** to specific IP addresses
5. **Monitor audit logs** regularly
6. **Implement backup procedures** for user data

### **Security Checklist:**
- [ ] Default passwords changed
- [ ] 2FA enabled for admin accounts
- [ ] Strong password policies enforced
- [ ] Account lockout configured
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] HTTPS enabled in production
- [ ] Regular security monitoring in place

This guide ensures you can create secure admin users for your facility management system with proper permissions and security measures in place!