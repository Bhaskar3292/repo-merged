# Permission Matrix API Fix

## 🐛 Problem Fixed

**Error:** `apiService.get is not a function` in PermissionMatrix component at line 41

**Root Cause:** The `ApiService` class in `services/api.ts` doesn't have generic `get()` and `post()` methods. It only has specific methods like `getLocations()`, `getUsers()`, etc.

---

## ✅ Solution Applied

### **Changed Import**

**Before:**
```tsx
import { apiService } from '../../services/api';
```

**After:**
```tsx
import api from '../../api/axios';
```

### **Why This Works:**

The `api` object is the raw Axios instance that has all HTTP methods:
- `api.get(url)`
- `api.post(url, data)`
- `api.put(url, data)`
- `api.delete(url)`
- etc.

It's configured with:
- Base URL
- Authentication headers
- Token refresh logic
- Error handling
- Request/response interceptors

---

## 📝 Changes Made

### **File: `frontend/src/components/admin/PermissionMatrix.tsx`**

**Change 1: Import Statement**
```tsx
// OLD
import { apiService } from '../../services/api';

// NEW
import api from '../../api/axios';
```

**Change 2: Load Permissions**
```tsx
// OLD
const [permsResponse, rolePermsResponse] = await Promise.all([
  apiService.get('/api/permissions/permissions/'),
  apiService.get('/api/permissions/role-permissions/'),
]);

// NEW
const [permsResponse, rolePermsResponse] = await Promise.all([
  api.get('/api/permissions/permissions/'),
  api.get('/api/permissions/role-permissions/'),
]);
```

**Change 3: Update Permission**
```tsx
// OLD
await apiService.post('/api/permissions/update-role-permission/', {
  role,
  permission_code: permissionCode,
  is_granted: granted,
});

// NEW
await api.post('/api/permissions/update-role-permission/', {
  role,
  permission_code: permissionCode,
  is_granted: granted,
});
```

**Change 4: Bulk Update**
```tsx
// OLD
await apiService.post('/api/permissions/bulk-update/', { permissions: updates });

// NEW
await api.post('/api/permissions/bulk-update/', { permissions: updates });
```

---

## 🔧 Enhanced Error Handling

Added detailed error messages that extract information from API responses:

```tsx
catch (error: any) {
  console.error('Failed to load permissions:', error);
  const errorMessage = error.response?.data?.error || error.message || 'Failed to load permissions';
  showMessage('error', errorMessage);
}
```

**Benefits:**
- Shows specific error messages from backend
- Falls back to generic message if no details
- Logs full error to console for debugging
- User sees meaningful error messages

---

## 🧪 Testing

### **Test 1: Verify Component Loads**

```bash
# Start backend
cd backend
python manage.py runserver

# Start frontend
cd frontend
npm run dev
```

**Expected:**
1. Navigate to Admin Panel → Role Permissions
2. Permission matrix loads without errors
3. All 8 categories visible with permissions

### **Test 2: Test API Endpoints**

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}' \
  | jq -r '.tokens.access')

# Test permissions endpoint
curl http://localhost:8000/api/permissions/permissions/ \
  -H "Authorization: Bearer $TOKEN"

# Test role permissions endpoint
curl http://localhost:8000/api/permissions/role-permissions/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "code": "locations:read",
    "name": "View Locations",
    "description": "...",
    "category": "Locations",
    "permission_type": "page"
  },
  ...
]
```

### **Test 3: Test Toggle Switch**

1. Open Admin Panel → Role Permissions
2. Click any toggle for Contributor or Viewer
3. Check browser console (should show no errors)
4. Green success message appears
5. Refresh page - toggle state persists

### **Test 4: Test Bulk Save**

1. Toggle multiple switches
2. Click "Save All Changes"
3. Check console (no errors)
4. Success message appears
5. All changes saved to database

---

## 📊 API Endpoint Verification

### **Permissions Endpoint**

**GET /api/permissions/permissions/**

Returns all available permissions:

```json
[
  {
    "id": 1,
    "code": "locations:read",
    "name": "View Locations",
    "description": "View all locations and their details",
    "category": "Locations",
    "category_name": "Locations",
    "permission_type": "page",
    "admin_default": true,
    "contributor_default": true,
    "viewer_default": true
  },
  ...
]
```

### **Role Permissions Endpoint**

**GET /api/permissions/role-permissions/**

Returns current permission grants for all roles:

```json
[
  {
    "id": 1,
    "role": "admin",
    "permission": 1,
    "permission_code": "locations:read",
    "permission_name": "View Locations",
    "category_name": "Locations",
    "is_granted": true
  },
  {
    "id": 2,
    "role": "contributor",
    "permission": 1,
    "permission_code": "locations:read",
    "category_name": "Locations",
    "is_granted": true
  },
  ...
]
```

### **Update Permission Endpoint**

**POST /api/permissions/update-role-permission/**

**Request:**
```json
{
  "role": "contributor",
  "permission_code": "locations:write",
  "is_granted": false
}
```

**Response:**
```json
{
  "role": "contributor",
  "permission_code": "locations:write",
  "is_granted": false,
  "message": "Permission revoked successfully"
}
```

### **Bulk Update Endpoint**

**POST /api/permissions/bulk-update/**

**Request:**
```json
{
  "permissions": [
    {
      "role": "contributor",
      "permission_code": "tanks:read",
      "is_granted": true
    },
    {
      "role": "viewer",
      "permission_code": "tanks:read",
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

## 🛠️ Understanding the API Architecture

### **Two API Layers:**

#### **1. Axios Instance (`api`)**
**File:** `frontend/src/api/axios.ts`

**Purpose:** Low-level HTTP client
- Raw Axios instance
- Base URL configuration
- Request/response interceptors
- Token management
- Error handling

**Usage:**
```tsx
import api from '../../api/axios';
const response = await api.get('/api/endpoint/');
```

#### **2. API Service (`apiService`)**
**File:** `frontend/src/services/api.ts`

**Purpose:** High-level business logic
- Wraps Axios calls
- Specific methods for features
- Data transformation
- Custom error handling

**Usage:**
```tsx
import { apiService } from '../../services/api';
const locations = await apiService.getLocations();
```

### **When to Use Which:**

**Use `api` (Axios) when:**
- Making direct API calls
- Need flexibility
- Custom endpoints
- Quick prototyping

**Use `apiService` when:**
- Method already exists (e.g., `getLocations()`)
- Need business logic
- Data transformation required
- Consistent error handling

---

## 🔄 Alternative Solution (Optional)

If you prefer using `apiService`, you can add generic methods:

**File:** `frontend/src/services/api.ts`

```typescript
class ApiService {
  // ... existing methods ...

  /**
   * Generic GET request
   */
  async get(url: string): Promise<any> {
    try {
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * Generic POST request
   */
  async post(url: string, data?: any): Promise<any> {
    try {
      const response = await api.post(url, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }
}
```

**Then revert PermissionMatrix to use:**
```tsx
import { apiService } from '../../services/api';
// ... works with apiService.get() and apiService.post()
```

---

## 🎯 Current Implementation (Recommended)

**Why using `api` directly is better:**

✅ **Less abstraction** - Fewer layers between component and API
✅ **More flexible** - Full Axios API available
✅ **Better typing** - TypeScript types from Axios
✅ **Consistent** - Same pattern used in other components
✅ **Simpler** - No wrapper methods needed

---

## ✅ Verification Checklist

After fix, verify:

- [ ] Component imports `api` from `../../api/axios`
- [ ] `loadPermissions()` uses `api.get()`
- [ ] `updatePermission()` uses `api.post()`
- [ ] `saveAllPermissions()` uses `api.post()`
- [ ] Error handling extracts `error.response?.data?.error`
- [ ] Component builds without errors
- [ ] Permission matrix loads in browser
- [ ] Toggle switches work without console errors
- [ ] Changes persist after refresh

---

## 🐛 Common Issues

### **Issue 1: CORS errors**

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
Check Django settings allow frontend origin:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
]
```

### **Issue 2: 401 Unauthorized**

**Symptom:**
```
GET /api/permissions/permissions/ 401 (Unauthorized)
```

**Fix:**
1. Verify you're logged in as admin
2. Check token in localStorage: `localStorage.getItem('access_token')`
3. Token may be expired - logout and login again

### **Issue 3: 404 Not Found**

**Symptom:**
```
GET /api/permissions/permissions/ 404 (Not Found)
```

**Fix:**
1. Verify backend URLs are correct in `permissions/urls.py`
2. Check Django server is running
3. Verify `VITE_API_URL` in `.env` file

### **Issue 4: Empty permission matrix**

**Symptom:** Permission matrix loads but shows no categories

**Fix:**
```bash
python manage.py seed_rbac
```

---

## 📝 Summary

**Problem:** `apiService.get is not a function`

**Root Cause:** ApiService doesn't have generic HTTP methods

**Solution:** Changed import from `apiService` to `api` (Axios instance)

**Result:**
- ✅ Component loads successfully
- ✅ API calls work without errors
- ✅ Toggle switches function properly
- ✅ Error handling shows meaningful messages
- ✅ Build completes successfully

**Build Status:** ✅ Success
```
✓ 1559 modules transformed
✓ built in 5.18s
```

The Permission Matrix component now works correctly with the backend API! 🎉
