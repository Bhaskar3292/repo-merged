# Admin User Setup Guide

## 🎯 Problem: Admin Can't See Dashboard Data

### Common Issues:
1. ❌ Admin user not assigned to an organization
2. ❌ Permissions not seeded in database
3. ❌ No sample data exists (empty database)
4. ❌ User marked as `is_staff=False` or `is_active=False`

---

## ✅ One-Command Fix (Recommended)

This command will:
- ✅ Create/update admin user with full permissions
- ✅ Assign to default organization
- ✅ Seed all RBAC permissions
- ✅ Create sample locations, tanks, and permits
- ✅ Verify everything is working

```bash
cd backend
python manage.py setup_admin --create-sample-data
```

**Expected Output:**
```
🔧 Setting up admin user...

  ✓ Using existing organization: Default Organization
  ✓ Permissions already exist (16 permissions)
  ✓ Updated user to admin with full permissions

  ⏳ Creating sample data...
    ✓ Created location: Main Facility - PA
      ✓ Created tank: Tank 1
      ✓ Created tank: Tank 2
      ✓ Created tank: Tank 3
      ✓ Created permit: PERMIT-1-1
      ✓ Created permit: PERMIT-1-2
    ✓ Created location: North Station - PA
    ✓ Created location: Delaware Depot - DE

✅ Admin setup complete!

📝 Login Credentials:
   Username: admin
   Email: admin@example.com
   Password: Admin@123456
   Organization: Default Organization

🔑 Permissions: 16 granted
📊 Organization: Default Organization
📍 Locations: 3
🛢️  Tanks: 9
📄 Permits: 6
```

---

## 🔍 Diagnostic Command

Check what's wrong with your admin user:

```bash
python manage.py check_admin_access
```

**This will show:**
- User status (active, staff, superuser)
- Organization assignment
- All permissions
- Accessible locations and data
- Dashboard stats
- Issues found and how to fix them

---

## 🛠️ Manual Setup (Step by Step)

### Step 1: Create Organization
```bash
python manage.py shell
```

```python
from accounts.models import Organization

# Create default organization
org = Organization.objects.create(name='Default Organization')
print(f"Created organization: {org.name}")
exit()
```

### Step 2: Seed RBAC Permissions
```bash
python manage.py seed_rbac
```

This creates 16 permissions:
- `locations:read`, `locations:write`
- `facilities:read`, `facilities:write`
- `tanks:read`, `tanks:write`
- `permits:read`, `permits:write`
- `testing:read`, `testing:write`
- `commander:read`, `commander:write`
- `settings:read`, `settings:write`
- `admin:read`, `admin:write`

### Step 3: Update Admin User
```bash
python manage.py shell
```

```python
from accounts.models import User, Organization

# Get organization
org = Organization.objects.first()

# Update admin user
admin = User.objects.get(username='admin')  # Change username if different
admin.role = 'admin'
admin.is_active = True
admin.is_staff = True
admin.is_superuser = True
admin.organization = org
admin.save()

print(f"✅ Admin user updated")
print(f"   Role: {admin.role}")
print(f"   Organization: {admin.organization.name}")
print(f"   Permissions: {len(admin.get_permissions())}")
exit()
```

### Step 4: Create Sample Data (Optional)
```bash
python manage.py shell
```

```python
from accounts.models import User, Organization
from facilities.models import Location, Tank, Permit
from django.utils import timezone

admin = User.objects.get(username='admin')
org = Organization.objects.first()

# Create location
location = Location.objects.create(
    name='Main Facility',
    address='123 Main St, Philadelphia, PA 19019',
    state='PA',
    organization=org,
    created_by=admin,
    is_active=True
)

# Create tanks
for i in range(1, 4):
    Tank.objects.create(
        location=location,
        tank_number=str(i),
        name=f'Tank {i}',
        capacity=10000,
        product_type='Gasoline',
        status='active',
        installation_date=timezone.now().date()
    )

# Create permits
for i in range(1, 3):
    Permit.objects.create(
        location=location,
        permit_number=f'PERMIT-{i}',
        permit_type='Operating',
        issue_date=timezone.now().date(),
        expiry_date=(timezone.now() + timezone.timedelta(days=365)).date(),
        status='active'
    )

print(f"✅ Created sample data")
print(f"   Location: {location.name}")
print(f"   Tanks: {Tank.objects.filter(location=location).count()}")
print(f"   Permits: {Permit.objects.filter(location=location).count()}")
exit()
```

---

## 📊 What Admin Should See After Setup

### Dashboard Stats:
```
Total Locations: 3
Total Tanks: 9
Active Tanks: 9
Total Permits: 6
Expiring Permits: 0
```

### Locations List:
```
Main Facility - PA (3 tanks, 2 permits)
North Station - PA (3 tanks, 2 permits)
Delaware Depot - DE (3 tanks, 2 permits)
```

### Permissions (all 16):
```
✓ locations:read
✓ locations:write
✓ facilities:read
✓ facilities:write
✓ tanks:read
✓ tanks:write
✓ permits:read
✓ permits:write
✓ testing:read
✓ testing:write
✓ commander:read
✓ commander:write
✓ settings:read
✓ settings:write
✓ admin:read
✓ admin:write
```

---

## 🧪 Testing Admin Access

### 1. Login and Get Token
```bash
curl -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123456"
  }'
```

**Response should include:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "organization_id": 1
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}
```

### 2. Check Profile/Permissions
```bash
curl http://localhost:8000/api/accounts/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Should return:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "organization_id": 1,
  "permissions": [
    "locations:read",
    "locations:write",
    "facilities:read",
    ...
  ]
}
```

### 3. Get Locations
```bash
curl http://localhost:8000/api/facilities/locations/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Should return locations array:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Main Facility - PA",
      "tank_count": 3,
      "permit_count": 2
    },
    ...
  ]
}
```

### 4. Get Dashboard Stats
```bash
curl http://localhost:8000/api/facilities/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Should return:**
```json
{
  "total_locations": 3,
  "total_tanks": 9,
  "active_tanks": 9,
  "total_permits": 6,
  "expiring_permits": 0
}
```

---

## 🔒 Security Notes

### Default Admin Password
The default password `Admin@123456` should be changed immediately after first login.

### Change Password via API:
```bash
curl -X POST http://localhost:8000/api/accounts/change-password/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Admin@123456",
    "new_password": "YourNewSecurePassword123!",
    "confirm_password": "YourNewSecurePassword123!"
  }'
```

### Custom Admin Credentials
Create admin with custom credentials:

```bash
python manage.py setup_admin \
  --username=myusername \
  --email=my@email.com \
  --password='MySecurePass123!' \
  --create-sample-data
```

---

## 🐛 Troubleshooting

### Issue: Still No Data in Dashboard

**Possible Causes:**
1. Organization filter blocking data
2. Locations not assigned to admin's organization
3. Frontend not sending auth token correctly

**Fix:**
```bash
# Check data exists
python manage.py check_admin_access

# Reassign all locations to admin's org
python manage.py shell
```

```python
from accounts.models import User, Organization
from facilities.models import Location

admin = User.objects.get(username='admin')
org = admin.organization

# Update all locations to admin's org
Location.objects.all().update(organization=org)

print(f"✅ Updated {Location.objects.filter(organization=org).count()} locations")
exit()
```

### Issue: 403 Forbidden Errors

**Cause:** Permissions not properly configured

**Fix:**
```bash
# Reseed permissions
python manage.py seed_rbac

# Make user superuser
python manage.py shell
```

```python
from accounts.models import User

admin = User.objects.get(username='admin')
admin.is_superuser = True
admin.is_staff = True
admin.is_active = True
admin.save()

print("✅ Admin is now superuser")
exit()
```

### Issue: Empty Locations List

**Cause:** No locations created OR locations not in admin's org

**Fix:**
```bash
# Create sample data
python manage.py setup_admin --create-sample-data
```

---

## 📝 Summary

### Quick Fix (Most Common Issues):
```bash
python manage.py setup_admin --create-sample-data
```

### Check Current State:
```bash
python manage.py check_admin_access
```

### What Admin User Should Have:
- ✅ `role = 'admin'`
- ✅ `is_active = True`
- ✅ `is_staff = True`
- ✅ `is_superuser = True`
- ✅ `organization` assigned
- ✅ 16 permissions via role
- ✅ Access to organization's locations, tanks, permits

### Default Credentials:
- **Username:** admin
- **Email:** admin@example.com
- **Password:** Admin@123456 (change immediately!)

---

## 🎉 Success Criteria

After setup, admin user should be able to:
- ✅ Login successfully
- ✅ See dashboard with stats (locations, tanks, permits)
- ✅ View all locations in their organization
- ✅ View tank details for each location
- ✅ View permit details for each location
- ✅ Create/edit/delete locations, tanks, and permits
- ✅ Access admin panel
- ✅ Create new users
- ✅ Access all features without 403 errors

If any of these don't work, run:
```bash
python manage.py check_admin_access
```

This will show you exactly what's wrong and how to fix it!
