# Quick Setup Guide - Permits & Licenses Feature

## 🚀 5-Minute Setup

### Step 1: Run Migrations

```bash
cd backend
python manage.py makemigrations permits
python manage.py migrate
```

### Step 2: Add Permission

```bash
python manage.py shell
```

```python
from permissions.models import Permission, RolePermission

# Create permission
perm = Permission.objects.create(
    name='view_permits',
    codename='view_permits',
    description='Can view and manage permits',
    category='Permits'
)

# Give to admin role
RolePermission.objects.create(role='admin', permission=perm, is_granted=True)

# Give to contributor role
RolePermission.objects.create(role='contributor', permission=perm, is_granted=True)

exit()
```

### Step 3: Test It Out

1. Start backend: `python manage.py runserver`
2. Start frontend: `cd ../frontend && npm run dev`
3. Login to your application
4. Look for "Permits & Licenses" in the sidebar
5. Click "Add New Permit" to test upload

---

## ✅ Verification Checklist

- [ ] Backend migrations completed successfully
- [ ] Permission added to database
- [ ] "Permits & Licenses" appears in sidebar
- [ ] Can click on menu item and see dashboard
- [ ] Can upload a test file
- [ ] Summary cards show statistics
- [ ] Filter tabs work correctly

---

## 🐛 Common Issues

### "Permits & Licenses" menu item not visible

**Fix:** Make sure you assigned the `view_permits` permission to your user's role.

```bash
python manage.py shell
```

```python
from permissions.models import RolePermission, Permission
from accounts.models import User

# Check if permission exists
perm = Permission.objects.get(codename='view_permits')
print(f"Permission found: {perm}")

# Check role permissions
admin_perms = RolePermission.objects.filter(role='admin', permission=perm)
print(f"Admin has permission: {admin_perms.exists()}")

# If not, add it
if not admin_perms.exists():
    RolePermission.objects.create(role='admin', permission=perm, is_granted=True)
    print("Permission added to admin role")
```

### Upload fails with "No facility selected"

**Fix:** You need to select a facility from the facility selector before uploading permits. Each permit must be associated with a specific facility/location.

### API returns 404

**Fix:** Make sure:
1. Backend server is running
2. URL `/api/permits/` is accessible
3. You're logged in (check for valid JWT token)

---

## 📖 Quick Usage Guide

### Upload a New Permit

1. Select a facility from the top dropdown
2. Click "Permits & Licenses" in sidebar
3. Click "Add New Permit"
4. Drag and drop a PDF file
5. Click "Upload"
6. Permit appears with AI-extracted data

### Renew a Permit

1. Find an expiring/expired permit
2. Click "Upload Renewal"
3. Upload renewal document
4. New permit is created, old one marked as superseded

### View History

1. Click "View History" on any permit
2. See all actions taken on that permit
3. View who made changes and when

---

## 🎯 What's Next?

Once setup is complete, you can:

1. **Upload Test Permits** - Try uploading different document types
2. **Test Renewals** - Upload a renewal for a permit
3. **Check History** - View the audit trail
4. **Customize AI** - Integrate real AI for document extraction
5. **Add Notifications** - Set up email alerts for expiring permits

See `PERMITS_FEATURE_COMPLETE.md` for full documentation.

---

## 💡 Quick Tips

- **Facility Required:** Always select a facility before accessing permits
- **File Limits:** Max 10MB, PDF/JPG/PNG only
- **Status Auto-Calculated:** Permit status updates automatically based on expiry date
- **Renewals Keep History:** Original permits remain in system for audit trail
- **Filter Client-Side:** Filtering doesn't require new API calls

---

## 🆘 Need Help?

Check the full documentation: `PERMITS_FEATURE_COMPLETE.md`

Or review:
- Backend: `backend/permits/`
- Frontend: `frontend/src/components/permits/`
- API: `http://localhost:8000/api/permits/`
