# Sample Login Credentials

## 🔐 Test User Accounts

Use these credentials to test different permission levels in the facility management system:

### 👑 **Administrator Account**
```
Email: admin@facility.com
Password: SecureAdmin123!
Role: Administrator
```
**Permissions:**
- Full system access
- Create, edit, delete users
- Manage all facilities and dashboards
- Configure system permissions
- Access admin panel

### 🔧 **Contributor Account**
```
Email: operator@facility.com
Password: SecureOp123!
Role: Contributor
```
**Permissions:**
- Create and edit facilities
- Manage tanks and permits
- Edit dashboard sections
- Generate reports
- No user management access

### 👁️ **Viewer Account**
```
Email: viewer@facility.com
Password: SecureView123!
Role: Viewer
```
**Permissions:**
- Read-only access to facilities
- View dashboards and reports
- No editing capabilities
- No administrative functions

## 🚀 **Quick Start**

1. **Run the sample user creation command:**
   ```bash
   cd backend
   python manage.py create_sample_users
   ```

2. **Login with any of the above credentials**

3. **Test different permission levels:**
   - Login as admin to see full functionality
   - Login as contributor to see editing capabilities
   - Login as viewer to see read-only interface

## 🔒 **Security Features to Test**

### **Password Security**
- Try weak passwords (system will reject them)
- Test account lockout after 5 failed attempts
- Verify password strength indicators

### **Two-Factor Authentication**
- Enable 2FA in Settings → Security
- Test login with authenticator app
- Try backup codes for recovery

### **Permission Controls**
- Notice different UI elements based on role
- Test that restricted actions are blocked
- Verify audit logs capture all activities

## ⚠️ **Important Notes**

- **Change passwords in production** - these are for testing only
- **Enable 2FA for admin accounts** in production
- **Monitor audit logs** for security events
- **Use strong, unique passwords** for real deployments

## 🧪 **Testing Scenarios**

1. **Login Flow:**
   - Test successful login with each account
   - Test failed login attempts and lockout
   - Test 2FA setup and verification

2. **Permission Testing:**
   - Try accessing admin features as viewer
   - Test editing capabilities as contributor
   - Verify UI elements show/hide correctly

3. **Security Testing:**
   - Test rate limiting on login endpoint
   - Verify audit logs are created
   - Test account unlock functionality

These sample accounts provide comprehensive testing coverage for all security features and permission levels in your facility management system.