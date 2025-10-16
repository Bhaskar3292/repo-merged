# RBAC Toggle System - Comprehensive Guide

## 🎯 Overview

This system provides granular role-based access control with toggle switches for each application tab, allowing administrators to customize permissions for Contributor and Viewer roles in real-time.

---

## ✅ Features Implemented

### **1. Permission Toggle UI Component** ✅
**File:** `frontend/src/components/admin/PermissionToggle.tsx`

**Features:**
- Visual toggle switches for each permission
- Color-coded by role (purple=admin, blue=contributor, gray=viewer)
- Locked state for admin permissions (cannot be changed)
- Smooth transitions and visual feedback
- Accessible design with keyboard support

**Usage:**
```tsx
<PermissionToggle
  role="contributor"
  permission="locations:read"
  enabled={true}
  locked={false}
  onChange={(enabled) => updatePermission(enabled)}
/>
```

---

### **2. Permission Matrix Component** ✅
**File:** `frontend/src/components/admin/PermissionMatrix.tsx`

**Features:**
- Displays all permissions grouped by category
- Expandable/collapsible categories
- Three-column layout (Admin, Contributor, Viewer)
- Real-time permission updates
- Bulk save functionality
- Success/error notifications
- Loading states

**Permission Categories:**
- 📍 Locations
- 🏢 Facilities
- 🛢️ Tanks
- 📄 Permits
- 🧪 Testing
- 👤 Commander
- ⚙️ Settings
- 🔐 Admin

**Each category shows:**
- **Read Permission:** View access (eye icon)
- **Write Permission:** Create/edit access (pencil icon)

---

### **3. Backend API Endpoints** ✅

**File:** `backend/permissions/views.py`

#### **GET /api/permissions/role-permissions/**
Returns all role permissions for the permission matrix.

**Response:**
```json
[
  {
    "id": 1,
    "role": "contributor",
    "permission_code": "locations:read",
    "permission_name": "View Locations",
    "category_name": "Locations",
    "is_granted": true
  },
  ...
]
```

#### **POST /api/permissions/update-role-permission/**
Updates a single role permission.

**Request:**
```json
{
  "role": "contributor",
  "permission_code": "locations:read",
  "is_granted": true
}
```

**Response:**
```json
{
  "role": "contributor",
  "permission_code": "locations:read",
  "is_granted": true,
  "message": "Permission granted successfully"
}
```

**Notes:**
- Admin permissions cannot be modified (returns 403)
- All changes are logged in security audit log
- Real-time updates without page reload

#### **POST /api/permissions/bulk-update/**
Bulk updates multiple permissions at once.

**Request:**
```json
{
  "permissions": [
    {
      "role": "contributor",
      "permission_code": "locations:read",
      "is_granted": true
    },
    {
      "role": "viewer",
      "permission_code": "locations:read",
      "is_granted": true
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully updated 2 permissions",
  "updated_count": 2,
  "errors": null
}
```

---

## 📊 Permission Matrix Structure

### **Three Role Types:**

#### **1. Administrator (Locked)**
- **Color:** Purple (🟣)
- **Status:** All permissions **enabled** and **locked**
- **Cannot be changed:** Admin always has full access
- **Display:** Lock icon on toggle switches

#### **2. Contributor (Customizable)**
- **Color:** Blue (🔵)
- **Default:** Create/edit permissions enabled, no delete/admin access
- **Can customize:**
  - Read permissions (view data)
  - Write permissions (create/edit data)
  - Testing permissions
  - Commander info access

#### **3. Viewer (Customizable)**
- **Color:** Gray (⚫)
- **Default:** Read-only access
- **Can customize:**
  - Which sections they can view
  - Dashboard visibility
  - Report access

---

## 🎨 UI/UX Design

### **Permission Matrix Layout:**

```
┌─────────────────────────────────────────────────────┐
│  🔧 Role Permissions                    [Save All]  │
├─────────────────────────────────────────────────────┤
│  📍 Locations ▼                                     │
│  ├─ 👁️  View Locations                              │
│  │   [Admin ✓🔒] [Contributor ✓] [Viewer ✓]       │
│  └─ ✏️  Manage Locations                            │
│      [Admin ✓🔒] [Contributor ✓] [Viewer ✗]       │
├─────────────────────────────────────────────────────┤
│  🛢️ Tanks ▼                                         │
│  ├─ 👁️  View Tanks                                  │
│  │   [Admin ✓🔒] [Contributor ✓] [Viewer ✓]       │
│  └─ ✏️  Manage Tanks                                │
│      [Admin ✓🔒] [Contributor ✓] [Viewer ✗]       │
└─────────────────────────────────────────────────────┘
```

### **Toggle Switch States:**

**Enabled:**
```
[●─────]  (blue for contributor, gray for viewer)
```

**Disabled:**
```
[─────○]  (gray background)
```

**Locked (Admin):**
```
[●─────🔒]  (purple background, lock icon)
```

---

## 🚀 Setup & Usage

### **Step 1: Seed Permissions**

```bash
cd backend
python manage.py seed_rbac
```

This creates all 16 permissions with default settings.

### **Step 2: Access Permission Matrix**

1. Login as admin user
2. Navigate to **Admin Panel**
3. Click **Role Permissions** tab
4. View the permission matrix

### **Step 3: Customize Permissions**

**Option A: Individual Toggle**
1. Click any toggle switch for Contributor or Viewer
2. Permission updates immediately
3. Green success message appears

**Option B: Bulk Changes**
1. Toggle multiple switches
2. Click "Save All Changes" button
3. All changes saved in single transaction

### **Step 4: Verify Changes**

**Backend Verification:**
```bash
python manage.py shell
```

```python
from permissions.models import RolePermission

# Check contributor permissions
contrib_perms = RolePermission.objects.filter(role='contributor', is_granted=True)
for rp in contrib_perms:
    print(f"{rp.permission.code}: {rp.is_granted}")
```

**API Verification:**
```bash
curl http://localhost:8000/api/permissions/role-permissions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Default Permission Matrix

### **Administrator (All Enabled & Locked):**
```
✓ locations:read      ✓ locations:write
✓ facilities:read     ✓ facilities:write
✓ tanks:read          ✓ tanks:write
✓ permits:read        ✓ permits:write
✓ testing:read        ✓ testing:write
✓ commander:read      ✓ commander:write
✓ settings:read       ✓ settings:write
✓ admin:read          ✓ admin:write
```

### **Contributor (Customizable):**

**Default Configuration:**
```
✓ locations:read      ✓ locations:write
✓ facilities:read     ✓ facilities:write
✓ tanks:read          ✓ tanks:write
✓ permits:read        ✓ permits:write
✓ testing:read        ✓ testing:write
✓ commander:read      ✓ commander:write
✗ settings:read       ✗ settings:write
✗ admin:read          ✗ admin:write
```

**Recommended Configuration:**
- ✅ Enable: locations, facilities, tanks, permits, testing, commander (read & write)
- ❌ Disable: settings, admin

### **Viewer (Customizable):**

**Default Configuration:**
```
✓ locations:read      ✗ locations:write
✓ facilities:read     ✗ facilities:write
✓ tanks:read          ✗ tanks:write
✓ permits:read        ✗ permits:write
✓ testing:read        ✗ testing:write
✓ commander:read      ✗ commander:write
✗ settings:read       ✗ settings:write
✗ admin:read          ✗ admin:write
```

**Recommended Configuration:**
- ✅ Enable: All "read" permissions except settings and admin
- ❌ Disable: All "write" permissions

---

## 🔐 Security Features

### **1. Admin Protection**
- Admin permissions are **always granted**
- Cannot be toggled off
- Lock icon displayed
- API returns 403 if attempting to modify

### **2. Audit Logging**
All permission changes are logged:
```python
{
  'action': 'permission_updated',
  'user': 'admin_username',
  'role': 'contributor',
  'permission_code': 'locations:write',
  'is_granted': True,
  'timestamp': '2025-10-16T12:00:00Z'
}
```

### **3. Real-time Validation**
- Permission codes validated against database
- Role names validated
- Invalid requests return appropriate error codes

### **4. Transaction Safety**
- Bulk updates use database transactions
- All-or-nothing updates (rollback on error)
- Optimistic UI updates with error recovery

---

## 🧪 Testing

### **Test Permission Toggle:**

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}' \
  | jq -r '.tokens.access')

# Update contributor permission
curl -X POST http://localhost:8000/api/permissions/update-role-permission/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "contributor",
    "permission_code": "tanks:write",
    "is_granted": false
  }'

# Verify change
curl http://localhost:8000/api/permissions/role-permissions/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | select(.role=="contributor" and .permission_code=="tanks:write")'
```

**Expected Response:**
```json
{
  "role": "contributor",
  "permission_code": "tanks:write",
  "is_granted": false,
  "message": "Permission revoked successfully"
}
```

### **Test Role Access:**

**As Contributor (with tanks:write disabled):**
```bash
# Login as contributor
TOKEN=$(curl -s -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"contributor@example.com","password":"password"}' \
  | jq -r '.tokens.access')

# Try to create tank (should fail)
curl -X POST http://localhost:8000/api/facilities/tanks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": 1,
    "tank_number": "5",
    "capacity": 10000
  }'
```

**Expected:** 403 Forbidden (if tanks:write is disabled for contributor)

---

## 📱 Responsive Design

### **Desktop (≥1024px):**
- Three-column grid layout
- All toggles visible side-by-side
- Expanded categories by default

### **Tablet (768px - 1023px):**
- Two-column grid
- Stacked role toggles
- Collapsible categories

### **Mobile (<768px):**
- Single column layout
- Stacked vertically
- Touch-optimized toggle switches
- Collapsible categories

---

## 🎯 Use Cases

### **Use Case 1: Restrict Contributor Delete Access**

**Scenario:** Contributors should be able to create and edit, but not delete locations.

**Solution:**
1. Navigate to Admin Panel → Role Permissions
2. Expand "Locations" category
3. Keep "locations:write" **enabled** for Contributor
4. Backend permission checks handle delete separately (admin only)

### **Use Case 2: Give Viewer Access to Dashboard Only**

**Scenario:** Viewer should only see dashboard stats, no detailed data.

**Solution:**
1. Navigate to Admin Panel → Role Permissions
2. **Disable** all read permissions except:
   - `locations:read` (for dashboard counts)
3. Frontend will hide detailed views automatically

### **Use Case 3: Temporary Read-Only Mode**

**Scenario:** System maintenance - make all contributors read-only temporarily.

**Solution:**
1. Navigate to Admin Panel → Role Permissions
2. Expand all categories
3. Toggle OFF all "write" permissions for Contributor
4. Click "Save All Changes"
5. Re-enable after maintenance

---

## 🔄 Real-time Updates

### **How It Works:**

1. **User clicks toggle:**
   ```tsx
   onChange={(granted) => updatePermission(code, role, granted)}
   ```

2. **Optimistic UI update:**
   ```tsx
   // Update local state immediately
   setRolePermissions(newMap);
   ```

3. **API call:**
   ```tsx
   await api.post('/api/permissions/update-role-permission/', {
     role, permission_code, is_granted
   });
   ```

4. **On success:**
   - Green success message
   - Permission takes effect immediately
   - Other users see change on next page load

5. **On error:**
   - Red error message
   - Revert to previous state
   - Reload from server

---

## 📊 Permission Hierarchy

```
Superuser
  ↓ (bypasses all checks)
Administrator
  ↓ (all permissions locked)
Contributor
  ↓ (customizable permissions)
Viewer
  ↓ (customizable permissions)
Unauthenticated
```

**Permission Check Flow:**
```python
if user.is_superuser:
    return True  # Always allowed

if user.role == 'admin':
    return True  # Always allowed

# Check role permissions
role_perms = RolePermission.objects.filter(
    role=user.role,
    permission__code=permission_code,
    is_granted=True
)

return role_perms.exists()
```

---

## 🐛 Troubleshooting

### **Issue: Toggles not appearing**

**Cause:** Permissions not seeded

**Fix:**
```bash
python manage.py seed_rbac
```

### **Issue: Changes not saving**

**Cause:** User not admin/superuser

**Fix:**
```bash
python manage.py sync_admin_permissions --username=youradmin
```

### **Issue: Admin toggles are editable**

**Cause:** Frontend not detecting admin role

**Fix:** Check `locked={role === 'admin'}` prop

### **Issue: 403 errors on API calls**

**Cause:** User lacks admin permissions

**Fix:**
```bash
python manage.py setup_admin --username=user
```

---

## ✅ Summary

**Features Delivered:**
- ✅ Toggle switches for each application tab
- ✅ Three role types (Admin, Contributor, Viewer)
- ✅ Admin permissions locked by default
- ✅ Customizable permissions for Contributor and Viewer
- ✅ Real-time updates without page reload
- ✅ Bulk save functionality
- ✅ Visual feedback (success/error messages)
- ✅ Permission checks on routes and components
- ✅ Audit logging of all changes
- ✅ Responsive design for all devices

**Permission Categories:**
- 📍 Locations (read, write)
- 🏢 Facilities (read, write)
- 🛢️ Tanks (read, write)
- 📄 Permits (read, write)
- 🧪 Testing (read, write)
- 👤 Commander (read, write)
- ⚙️ Settings (read, write)
- 🔐 Admin (read, write)

**Total:** 16 permissions across 8 categories

**Access:**
- Admin Panel → Role Permissions tab
- Real-time toggle switches
- Immediate effect on user access

The RBAC toggle system provides complete control over user permissions with an intuitive, visual interface! 🚀
