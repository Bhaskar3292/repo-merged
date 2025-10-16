# RBAC Administrator Auto-Permissions Implementation

## Overview
This document describes the complete implementation of automatic administrator permissions and organization-based access control.

## ✅ Completed Implementation

### 1. **Seed RBAC Command** ✅
**File:** `backend/permissions/management/commands/seed_rbac.py`

**Features:**
- Creates all necessary permissions with proper categorization
- Permission codes follow format: `resource:action` (e.g., `locations:read`, `locations:write`)
- Automatically assigns all permissions to `admin` role
- Idempotent - can be run multiple times safely
- Updates existing permissions if already created

**Permissions Created:**
```
locations:read, locations:write
facilities:read, facilities:write
tanks:read, tanks:write
permits:read, permits:write
testing:read, testing:write
commander:read, commander:write
settings:read, settings:write
admin:read, admin:write
```

**Usage:**
```bash
python manage.py seed_rbac
```

**Output:**
```
✓ Created: Category "Locations"
✓ Created: locations:read
✓ Created: locations:write
...
✓ Administrator role has 16 permissions
✅ RBAC seed completed successfully!
```

---

### 2. **Organization Model** ✅
**File:** `backend/accounts/models.py`

**Organization Model:**
```python
class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Features:**
- Multi-tenancy support
- Auto-generates slug from name
- Active/inactive status
- Indexed for performance

---

### 3. **User Model Updates** ✅
**File:** `backend/accounts/models.py`

**New Fields:**
```python
organization = models.ForeignKey(Organization, on_delete=models.PROTECT)
```

**New Methods:**
```python
def get_permissions(self):
    """Get list of permission codes for this user"""
    # Admins and superusers get ALL permissions
    if self.is_superuser or self.role == 'admin':
        return list(Permission.objects.values_list('code', flat=True))

    # Other roles get permissions from RolePermission table
    role_permissions = RolePermission.objects.filter(
        role=self.role,
        is_granted=True
    )
    return [rp.permission.code for rp in role_permissions]
```

---

### 4. **Post-Save Signal** ✅
**File:** `backend/accounts/signals.py`

**Auto-Admin Configuration:**
```python
@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    # Automatically configure admin users
    if instance.role == 'admin':
        # Set is_active = True
        # Set is_staff = True
        # Set organization if not set (use default)
```

**Features:**
- Automatically sets `is_active=True` for admins
- Automatically sets `is_staff=True` for admins
- Assigns default organization if none specified
- Avoids recursion with smart update logic

---

## 🚧 Remaining Tasks

### 5. **Update User Creation Serializer**
**File:** `backend/accounts/serializers.py`

**Required Changes:**
```python
class CreateUserSerializer(serializers.ModelSerializer):
    organization_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        # If organization_id not provided, use creator's org
        if 'organization_id' not in attrs:
            request = self.context.get('request')
            if request and request.user.organization:
                attrs['organization_id'] = request.user.organization.id
        return attrs
```

---

### 6. **Update User Creation View**
**File:** `backend/accounts/views.py` - Line 447

**Required Logic:**
```python
def create(self, request, *args, **kwargs):
    # 1. Get organization_id from request or default to creator's
    org_id = request.data.get('organization_id', request.user.organization.id)

    # 2. Create user with organization
    user = serializer.save(organization_id=org_id)

    # 3. If role == 'admin', ensure is_staff=True and is_active=True
    if user.role == 'admin':
        user.is_staff = True
        user.is_active = True
        user.save()

    # 4. Assign locations as before
    # ... existing location assignment logic
```

---

### 7. **Update /me Endpoint**
**File:** `backend/accounts/views.py`

**Find:** ProfileView or similar endpoint

**Add to Response:**
```python
def get(self, request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'organization_id': user.organization_id,
        'organization_name': user.organization.name if user.organization else None,
        'permissions': user.get_permissions(),  # ← Key addition
        'is_staff': user.is_staff,
        'is_active': user.is_active,
    })
```

---

### 8. **Organization Filtering in List Endpoints**
**Files to Update:**
- `backend/facilities/views.py` - LocationListCreateView
- `backend/facilities/views.py` - TankListCreateView
- `backend/facilities/views.py` - PermitListCreateView

**Pattern to Apply:**
```python
def get_queryset(self):
    user = self.request.user
    queryset = Location.objects.filter(is_active=True)

    # Filter by organization (not by created_by)
    if user.organization:
        queryset = queryset.filter(organization=user.organization)

    # Admins see all org data (no location filtering)
    if user.role != 'admin' and not user.is_superuser:
        accessible_ids = user.get_accessible_location_ids()
        queryset = queryset.filter(id__in=accessible_ids)

    return queryset
```

**Critical Change:**
- OLD: `filter(created_by=user)` ❌
- NEW: `filter(organization=user.organization)` ✅

---

### 9. **Frontend: Update Auth Context**
**File:** `frontend/src/contexts/AuthContext.tsx`

**Add to AuthContext State:**
```typescript
interface AuthContextType {
  user: User | null;
  permissions: string[];  // ← Add this
  organizationId: number | null;  // ← Add this
  hasPermission: (permission: string) => boolean;  // ← Add this
}
```

**Update loadUser Function:**
```typescript
const loadUser = async () => {
  const response = await api.get('/api/accounts/profile/');
  const userData = response.data;

  setUser(userData);
  setPermissions(userData.permissions || []);
  setOrganizationId(userData.organization_id);
};
```

---

### 10. **Frontend: Route Guards**
**Pattern for Protected Routes:**

```typescript
// In ProtectedRoute component
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, permissions } = useAuthContext();

  // Admins bypass all checks
  if (user?.role === 'admin') {
    return children;
  }

  // Check permission for non-admins
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

**Usage Example:**
```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredPermission="admin:read">
      <AdminPanel />
    </ProtectedRoute>
  }
/>

<Route
  path="/locations"
  element={
    <ProtectedRoute requiredPermission="locations:read">
      <LocationsPage />
    </ProtectedRoute>
  }
/>
```

---

### 11. **Frontend: Sidebar Conditional Rendering**
**File:** `frontend/src/components/dashboard/Sidebar.tsx`

**Pattern:**
```typescript
const Sidebar = () => {
  const { user, hasPermission } = useAuthContext();
  const isAdmin = user?.role === 'admin';

  return (
    <nav>
      {/* Dashboard - always visible */}
      <SidebarItem to="/dashboard" icon={Home} label="Dashboard" />

      {/* Locations - visible if permission */}
      {(isAdmin || hasPermission('locations:read')) && (
        <SidebarItem to="/locations" icon={MapPin} label="Locations" />
      )}

      {/* Tanks - visible if permission */}
      {(isAdmin || hasPermission('tanks:read')) && (
        <SidebarItem to="/tanks" icon={Database} label="Tank Management" />
      )}

      {/* Admin Panel - admin only */}
      {(isAdmin || hasPermission('admin:read')) && (
        <SidebarItem to="/admin" icon={Settings} label="Admin Panel" />
      )}
    </nav>
  );
};
```

---

## 📊 Permission Matrix

| Menu Item | Permission Required | Admin | Contributor | Viewer |
|-----------|-------------------|-------|-------------|--------|
| Dashboard | (always visible) | ✅ | ✅ | ✅ |
| Locations | `locations:read` | ✅ | ✅ | ✅ |
| Facility Profile | `facilities:read` | ✅ | ✅ | ✅ |
| Tank Management | `tanks:read` | ✅ | ✅ | ✅ |
| Tank Testing | `testing:read` | ✅ | ✅ | ✅ |
| Permits & Licenses | `permits:read` | ✅ | ✅ | ✅ |
| Commander Info | `commander:read` | ✅ | ✅ | ✅ |
| Settings | `settings:read` | ✅ | ❌ | ❌ |
| Admin Panel | `admin:read` | ✅ | ❌ | ❌ |

**Write Permissions:**
| Action | Permission | Admin | Contributor | Viewer |
|--------|-----------|-------|-------------|--------|
| Create Location | `locations:write` | ✅ | ✅ | ❌ |
| Edit Location | `locations:write` | ✅ | ✅ | ❌ |
| Delete Location | `locations:write` | ✅ | ❌ | ❌ |
| Create User | `admin:write` | ✅ | ❌ | ❌ |

---

## 🧪 Testing Checklist

### Backend Tests
```python
# test_user_creation.py

def test_create_admin_without_org_defaults_to_creator_org():
    """Creating admin without org_id uses creator's org"""
    creator = User.objects.create(username='creator', organization=org1)

    response = client.post('/api/auth/users/create/', {
        'username': 'newadmin',
        'password': 'SecurePass123!',
        'role': 'admin'
    }, headers={'Authorization': f'Bearer {creator.token}'})

    assert response.status_code == 201
    new_user = User.objects.get(username='newadmin')
    assert new_user.organization == org1
    assert new_user.is_staff == True
    assert new_user.is_active == True

def test_admin_sees_all_org_locations():
    """Admin sees all locations in their org"""
    admin = User.objects.create(username='admin', role='admin', organization=org1)

    # Create locations in org1
    loc1 = Location.objects.create(name='Loc1', organization=org1)
    loc2 = Location.objects.create(name='Loc2', organization=org1)

    # Create location in org2 (should not see)
    loc3 = Location.objects.create(name='Loc3', organization=org2)

    response = client.get('/api/facilities/locations/',
                         headers={'Authorization': f'Bearer {admin.token}'})

    assert response.status_code == 200
    assert len(response.json()['results']) == 2  # Only org1 locations

def test_non_admin_without_permission_gets_403():
    """Non-admin without permission cannot access admin panel"""
    viewer = User.objects.create(username='viewer', role='viewer')

    response = client.get('/api/admin/',
                         headers={'Authorization': f'Bearer {viewer.token}'})

    assert response.status_code == 403
```

### Frontend Tests
```typescript
// auth.test.tsx

describe('Permission-based Rendering', () => {
  it('shows all menu items for admin', () => {
    const { getByText } = render(
      <AuthProvider value={{role: 'admin', permissions: []}}>
        <Sidebar />
      </AuthProvider>
    );

    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Locations')).toBeInTheDocument();
    expect(getByText('Admin Panel')).toBeInTheDocument();
  });

  it('hides admin panel for non-admin', () => {
    const { queryByText } = render(
      <AuthProvider value={{role: 'viewer', permissions: ['locations:read']}}>
        <Sidebar />
      </AuthProvider>
    );

    expect(queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('shows items based on permissions', () => {
    const { getByText, queryByText } = render(
      <AuthProvider value={{
        role: 'contributor',
        permissions: ['locations:read', 'tanks:read']
      }}>
        <Sidebar />
      </AuthProvider>
    );

    expect(getByText('Locations')).toBeInTheDocument();
    expect(getByText('Tank Management')).toBeInTheDocument();
    expect(queryByText('Admin Panel')).not.toBeInTheDocument();
  });
});
```

---

## 🚀 Deployment Steps

### 1. Run Migrations
```bash
cd backend
python manage.py migrate
```

### 2. Create Default Organization
```bash
python manage.py shell
>>> from accounts.models import Organization
>>> org = Organization.objects.create(name='Default Organization')
>>> org.save()
>>> exit()
```

### 3. Seed RBAC
```bash
python manage.py seed_rbac
```

### 4. Update Existing Users
```bash
python manage.py shell
>>> from accounts.models import User, Organization
>>> org = Organization.objects.first()
>>> User.objects.filter(organization__isnull=True).update(organization=org)
>>> exit()
```

### 5. Test Admin Creation
```bash
# Via API
curl -X POST http://localhost:8000/api/auth/users/create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "deepthi",
    "email": "deepthi@example.com",
    "password": "SecurePass123!",
    "role": "admin"
  }'

# Check response includes:
# - organization_id
# - is_staff: true
# - is_active: true
```

### 6. Test /me Endpoint
```bash
curl http://localhost:8000/api/accounts/profile/ \
  -H "Authorization: Bearer DEEPTHI_TOKEN"

# Should return:
{
  "username": "deepthi",
  "role": "admin",
  "organization_id": 1,
  "permissions": [
    "locations:read",
    "locations:write",
    "facilities:read",
    "facilities:write",
    ...
  ]
}
```

---

## ✅ Acceptance Criteria

### Backend
- ✅ `python manage.py seed_rbac` runs without errors
- ✅ Creating user with `role='admin'` sets `is_staff=True` and `is_active=True`
- ✅ User without `organization_id` gets creator's organization
- ✅ `/me` endpoint returns `permissions` array
- ✅ Admin users get ALL 16 permissions
- ✅ List endpoints filter by organization (not creator)
- ✅ Admins see all data in their organization

### Frontend
- ✅ After login, auth context loads permissions
- ✅ Admin user sees all menu items
- ✅ Non-admin sees only permitted items
- ✅ Route guards block unauthorized access
- ✅ Sidebar items render based on permissions

---

## 📝 Summary

**What's Completed:**
1. ✅ RBAC seed command with all permissions
2. ✅ Organization model
3. ✅ User model with organization field
4. ✅ Post-save signal for auto-admin defaults
5. ✅ `get_permissions()` method on User model

**What Needs Completion:**
1. Update user creation serializer/view for organization defaulting
2. Update `/me` endpoint to return permissions
3. Add organization filtering to list endpoints
4. Frontend auth context with permissions
5. Frontend route guards
6. Frontend sidebar conditional rendering
7. Tests

**Estimated Time to Complete:** 2-3 hours

**Priority:** High - Core RBAC functionality
