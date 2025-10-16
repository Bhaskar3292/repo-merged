# RBAC Toggle System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### **Step 1: Seed Permissions** (One-time setup)

```bash
cd backend
python manage.py seed_rbac
```

**Output:**
```
✅ RBAC seed completed successfully!
   - Permissions created/verified: 16
   - Admin role permissions: 16
```

---

### **Step 2: Access Permission Matrix**

1. **Login as admin user**
2. **Navigate:** Admin Panel → **Role Permissions** tab
3. **See the permission matrix with toggle switches**

---

### **Step 3: Customize Permissions**

**Toggle individual permissions:**
- Click any toggle switch for **Contributor** or **Viewer**
- Permission updates **immediately**
- See green success message

**Or save multiple changes:**
- Toggle multiple switches
- Click **"Save All Changes"** button
- All changes saved in one transaction

---

## 📊 Permission Matrix Overview

### **Layout:**
```
📍 Locations ▼
  👁️  View Locations
    [Admin ✓🔒] [Contributor ✓] [Viewer ✓]
  ✏️  Manage Locations
    [Admin ✓🔒] [Contributor ✓] [Viewer ✗]

🛢️ Tanks ▼
  👁️  View Tanks
    [Admin ✓🔒] [Contributor ✓] [Viewer ✓]
  ✏️  Manage Tanks
    [Admin ✓🔒] [Contributor ✓] [Viewer ✗]
```

---

## 🎯 Three Role Types

### **1. Administrator (Purple 🟣)**
- **Status:** All permissions **locked** at enabled
- **Cannot change:** Admin always has full access
- **Lock icon** shows on all toggles

### **2. Contributor (Blue 🔵)**
- **Default:** Create/edit access (no delete/admin)
- **Customizable:** Toggle any permission on/off
- **Use case:** Regular staff members

### **3. Viewer (Gray ⚫)**
- **Default:** Read-only access
- **Customizable:** Control which sections they can view
- **Use case:** External auditors, clients

---

## 📋 Common Use Cases

### **Use Case 1: Make Contributor Read-Only Temporarily**

**Scenario:** System maintenance

**Steps:**
1. Open Admin Panel → Role Permissions
2. Find Contributor column
3. Toggle OFF all "write" permissions
4. Click "Save All Changes"
5. Re-enable after maintenance

**Result:** Contributors can view but not edit anything

---

### **Use Case 2: Give Viewer Access to Specific Tabs**

**Scenario:** Client should only see tank data

**Steps:**
1. Open Admin Panel → Role Permissions
2. Find Viewer column
3. **Enable:** `tanks:read`
4. **Disable:** All other read permissions
5. Changes apply immediately

**Result:** Viewer only sees Tank Management tab

---

### **Use Case 3: Remove Admin Panel Access**

**Scenario:** Contributors shouldn't manage users

**Steps:**
1. Open Admin Panel → Role Permissions
2. Scroll to "Admin" category
3. Verify `admin:read` and `admin:write` are **disabled** for Contributor
4. (Default state - no action needed)

**Result:** Contributors don't see Admin Panel tab

---

## 🎨 Visual Guide

### **Toggle Switch States**

**Enabled:**
```
●─────  (blue/gray background)
```

**Disabled:**
```
─────○  (gray background)
```

**Locked (Admin only):**
```
●─────🔒  (purple background with lock)
```

---

## ✅ Verify It Works

### **Test 1: Check Permission in Database**

```bash
python manage.py shell
```

```python
from permissions.models import RolePermission

# Check specific permission
rp = RolePermission.objects.get(
    role='contributor',
    permission__code='tanks:write'
)
print(f"tanks:write for contributor: {rp.is_granted}")
```

### **Test 2: Test API Endpoint**

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}' \
  | jq -r '.tokens.access')

# Get all permissions
curl http://localhost:8000/api/permissions/role-permissions/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | select(.role=="contributor")'
```

### **Test 3: Login as Contributor**

1. **Create test contributor:**
   ```bash
   python manage.py setup_admin \
     --username=testcontrib \
     --email=contrib@example.com \
     --password=Test123! \
     --role=contributor
   ```

2. **Login:** Use frontend or API
3. **Verify:** Only tabs with enabled permissions show up
4. **Test write:** Try creating/editing (should work if write permission enabled)

---

## 🔧 Common Commands

### **Seed Permissions:**
```bash
python manage.py seed_rbac
```

### **Check Admin Setup:**
```bash
python manage.py check_admin_access --username=admin
```

### **Sync Admin Permissions:**
```bash
python manage.py sync_admin_permissions
```

### **Update Single Permission (API):**
```bash
curl -X POST http://localhost:8000/api/permissions/update-role-permission/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "contributor",
    "permission_code": "locations:write",
    "is_granted": false
  }'
```

---

## 📊 Default Permissions Summary

| Permission | Admin | Contributor | Viewer |
|-----------|-------|-------------|---------|
| **Locations** |
| locations:read | ✓ 🔒 | ✓ | ✓ |
| locations:write | ✓ 🔒 | ✓ | ✗ |
| **Facilities** |
| facilities:read | ✓ 🔒 | ✓ | ✓ |
| facilities:write | ✓ 🔒 | ✓ | ✗ |
| **Tanks** |
| tanks:read | ✓ 🔒 | ✓ | ✓ |
| tanks:write | ✓ 🔒 | ✓ | ✗ |
| **Permits** |
| permits:read | ✓ 🔒 | ✓ | ✓ |
| permits:write | ✓ 🔒 | ✓ | ✗ |
| **Testing** |
| testing:read | ✓ 🔒 | ✓ | ✓ |
| testing:write | ✓ 🔒 | ✓ | ✗ |
| **Commander** |
| commander:read | ✓ 🔒 | ✓ | ✓ |
| commander:write | ✓ 🔒 | ✓ | ✗ |
| **Settings** |
| settings:read | ✓ 🔒 | ✗ | ✗ |
| settings:write | ✓ 🔒 | ✗ | ✗ |
| **Admin** |
| admin:read | ✓ 🔒 | ✗ | ✗ |
| admin:write | ✓ 🔒 | ✗ | ✗ |

**Legend:**
- ✓ = Enabled
- ✗ = Disabled
- 🔒 = Locked (cannot change)

---

## 🐛 Quick Troubleshooting

### **Problem: Permission matrix is empty**

**Solution:**
```bash
python manage.py seed_rbac
```

### **Problem: Can't access Role Permissions tab**

**Solution:**
```bash
python manage.py sync_admin_permissions --username=youradmin
```

### **Problem: Changes not saving**

**Check:**
1. Are you logged in as admin?
2. Is backend running?
3. Check browser console for errors

**Fix:**
```bash
# Verify admin permissions
python manage.py debug_permissions --username=admin
```

### **Problem: Contributor still has access after disabling permission**

**Solution:** User needs to logout and login again, or reload page

---

## 🎉 That's It!

You now have a fully functional RBAC toggle system with:

✅ **Visual toggle switches** for each permission
✅ **Three customizable roles** (Admin locked, Contributor & Viewer customizable)
✅ **8 permission categories** covering all app features
✅ **16 total permissions** (read + write for each category)
✅ **Real-time updates** (changes apply immediately)
✅ **Audit logging** (all changes tracked)
✅ **Responsive design** (works on all devices)

**Access:** Admin Panel → Role Permissions tab

**Customize:** Click any toggle for Contributor or Viewer

**Save:** Changes apply immediately or use "Save All Changes" for bulk updates

🚀 **Start managing permissions now!**
