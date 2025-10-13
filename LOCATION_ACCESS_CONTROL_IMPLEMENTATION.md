# Location-Based Access Control & Temporary User Implementation

## Overview
This document describes the comprehensive implementation of location-based access control and temporary user expiration for the Facility Management System.

## 🎯 Features Implemented

### 1. Database Schema Changes
- ✅ Added `user_type` field (permanent/temporary)
- ✅ Added `expires_at` datetime field for temporary users
- ✅ Added `is_expired` boolean flag for quick checks
- ✅ Created `UserLocation` junction table for many-to-many relationship
- ✅ Added proper indexes for performance optimization

### 2. User Model Enhancements
**New Fields:**
- `user_type`: Choice field ('permanent' or 'temporary')
- `expires_at`: DateTime field for expiration
- `is_expired`: Boolean flag for expired status

**New Methods:**
- `check_expiration()`: Check and update expiration status
- `is_valid_user()`: Validate user is active and not expired
- `get_assigned_locations()`: Get user's assigned locations
- `has_location_access(location_id)`: Check access to specific location
- `get_accessible_location_ids()`: Get list of accessible location IDs

### 3. Middleware Implementation

#### UserExpirationMiddleware
- Checks temporary user expiration on every request
- Returns 401 error if user has expired
- Adds warning flags for users expiring soon (< 1 hour)
- Automatically deactivates expired users

#### LocationAccessMiddleware
- Enforces location-based access control
- Extracts location_id from URL patterns
- Checks user permissions before accessing location data
- Returns 403 error for unauthorized location access
- Admins and superusers bypass location restrictions

### 4. Authentication Enhancements

#### Login Process
- Checks temporary user expiration during login
- Validates expiration status before issuing tokens
- Warns users expiring within 24 hours
- Rejects login for expired temporary users

#### Token Refresh
- Validates user status on token refresh
- Checks expiration for temporary users
- Returns clear error messages for expired accounts

### 5. User Creation with Location Assignment

#### Enhanced CreateUserSerializer
**New Fields:**
- `user_type`: permanent/temporary selection
- `expires_at`: expiration datetime (required for temporary)
- `location_ids`: list of location IDs to assign

**Validation:**
- Permanent users must have email
- Temporary users must have expiration date
- Expiration date must be in future
- Email is optional for temporary users
- Location IDs must exist and be active

#### CreateUserView Updates
- Validates location IDs before creating user
- Creates user and location assignments in atomic transaction
- Bulk creates UserLocation records
- Logs location assignment in security audit
- Returns assigned location count

### 6. Location Filtering

#### LocationListCreateView
- Filters locations by user's assigned locations
- Admins/superusers see all locations
- Other roles see only assigned locations
- Maintains tank_count and permit_count annotations

#### LocationDetailView
- Filters by accessible locations
- Enforces location access control
- Returns 404 for inaccessible locations

### 7. Temporary User Expiration System

#### Management Command: `expire_temporary_users`
**Features:**
- Finds and expires users past expiration date
- Deactivates expired users
- Logs expiration events to audit log
- Supports dry-run mode for testing
- Shows users expiring within 24 hours

**Usage:**
```bash
# Run expiration check
python manage.py expire_temporary_users

# Dry run to see what would be expired
python manage.py expire_temporary_users --dry-run
```

**Cron Setup (recommended):**
```bash
# Run every hour
0 * * * * cd /path/to/backend && python manage.py expire_temporary_users
```

### 8. API Endpoints Updated

#### POST /api/accounts/register/users/
**Request Body:**
```json
{
  "username": "john_temp",
  "email": "",
  "password": "SecurePass123!",
  "role": "viewer",
  "user_type": "temporary",
  "expires_at": "2025-10-14T15:30:00Z",
  "location_ids": [1, 3, 5, 8],
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 42,
    "username": "john_temp",
    "role": "viewer",
    "user_type": "temporary",
    "expires_at": "2025-10-14T15:30:00Z",
    "is_expired": false,
    "assigned_locations": [
      {"id": 1, "name": "Location A"},
      {"id": 3, "name": "Location C"}
    ],
    "location_count": 4
  },
  "assigned_locations": 4
}
```

#### GET /api/facilities/locations/
**Behavior:**
- Returns only locations user has access to
- Admins see all locations
- Contributors/Viewers see assigned locations only

#### GET /api/facilities/locations/:id
**Behavior:**
- Returns 403 if user doesn't have access
- Returns 404 if location doesn't exist or user can't access it

### 9. Error Handling

#### Expired User Errors
```json
{
  "error": "User account has expired",
  "code": "ACCOUNT_EXPIRED",
  "expired_at": "2025-10-13T12:00:00Z"
}
```

#### Location Access Denied
```json
{
  "error": "You do not have access to this location",
  "code": "LOCATION_ACCESS_DENIED",
  "location_id": 42
}
```

#### Invalid Location Assignment
```json
{
  "error": "Invalid location IDs provided",
  "invalid_ids": [99, 100]
}
```

## 📊 Database Schema

### User Model (Extended)
```sql
ALTER TABLE auth_user ADD COLUMN user_type VARCHAR(20) DEFAULT 'permanent';
ALTER TABLE auth_user ADD COLUMN expires_at TIMESTAMP NULL;
ALTER TABLE auth_user ADD COLUMN is_expired BOOLEAN DEFAULT FALSE;

CREATE INDEX user_type_idx ON auth_user(user_type);
CREATE INDEX user_expires_at_idx ON auth_user(expires_at);
CREATE INDEX user_exp_check_idx ON auth_user(user_type, is_expired, expires_at);
```

### UserLocation Table
```sql
CREATE TABLE user_locations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES facilities_location(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by_id BIGINT NULL REFERENCES auth_user(id) ON DELETE SET NULL,
    UNIQUE(user_id, location_id)
);

CREATE INDEX ul_user_idx ON user_locations(user_id);
CREATE INDEX ul_location_idx ON user_locations(location_id);
```

## 🔐 Security Features

### 1. Automatic Expiration
- Middleware checks expiration on every request
- Background job expires users hourly
- Expired users cannot login or access resources

### 2. Location Isolation
- Users can only access assigned locations
- API automatically filters by accessible locations
- Middleware blocks unauthorized access attempts

### 3. Audit Logging
- All user creations logged with location assignments
- Expiration events logged to audit trail
- Location access attempts logged

### 4. Permission Validation
- Role-based permissions still apply
- Location access is additional layer
- Admins have global access

## 🎨 Frontend Integration

### User Creation Form Updates Needed

```typescript
interface UserFormData {
  userType: 'permanent' | 'temporary';
  username: string;
  email: string; // Optional for temporary
  password: string;
  selectedLocationIds: number[];
  role: string;
  expirationDateTime?: string; // Required for temporary
}
```

### API Service Updates

```typescript
// In apiService.ts
async createUser(userData: UserFormData) {
  const payload = {
    username: userData.username,
    email: userData.email || '',
    password: userData.password,
    role: userData.role,
    user_type: userData.userType,
    expires_at: userData.expirationDateTime,
    location_ids: userData.selectedLocationIds,
    first_name: '',
    last_name: ''
  };

  return await api.post('/api/accounts/register/users/', payload);
}

// Location filtering is automatic - just fetch normally
async getLocations() {
  return await api.get('/api/facilities/locations/');
  // Backend automatically filters by user's assigned locations
}
```

### Error Handling

```typescript
// Check for expired user
if (error.response?.data?.code === 'ACCOUNT_EXPIRED') {
  // Log user out
  logout();
  showMessage('Your account has expired');
}

// Check for location access denied
if (error.response?.data?.code === 'LOCATION_ACCESS_DENIED') {
  showMessage('You do not have access to this location');
  navigate('/dashboard');
}
```

## 📝 Migration Steps

### 1. Run Database Migration
```bash
cd backend
python manage.py migrate accounts 0002_add_temporary_user_and_location_assignment
```

### 2. Update Settings
Middleware already added to `settings.py`:
- `accounts.middleware.UserExpirationMiddleware`
- `accounts.middleware.LocationAccessMiddleware`

### 3. Setup Cron Job
```bash
# Add to crontab
crontab -e

# Add line (runs every hour):
0 * * * * cd /path/to/backend && python manage.py expire_temporary_users
```

### 4. Test Implementation
```bash
# Test expiration command
python manage.py expire_temporary_users --dry-run

# Create test temporary user
curl -X POST http://localhost:8000/api/accounts/register/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "temp_user",
    "password": "TestPass123!@#",
    "role": "viewer",
    "user_type": "temporary",
    "expires_at": "2025-10-14T12:00:00Z",
    "location_ids": [1, 2, 3]
  }'
```

## 🔍 Testing Checklist

### User Creation
- [ ] Create permanent user with locations
- [ ] Create temporary user with expiration
- [ ] Verify email required for permanent users
- [ ] Verify email optional for temporary users
- [ ] Verify expiration required for temporary users
- [ ] Verify location assignment works
- [ ] Test invalid location IDs

### Expiration
- [ ] Login with expired temporary user (should fail)
- [ ] Access API with expired user (should return 401)
- [ ] Run expiration command
- [ ] Verify expired users are deactivated

### Location Access
- [ ] Viewer sees only assigned locations
- [ ] Contributor sees only assigned locations
- [ ] Admin sees all locations
- [ ] Access to unassigned location returns 403
- [ ] Location detail page blocks unauthorized access

### API Filtering
- [ ] GET /api/facilities/locations/ returns filtered list
- [ ] GET /api/facilities/locations/:id checks access
- [ ] Tanks and permits respect location filtering
- [ ] Dashboard data respects location filtering

## 🚀 Performance Considerations

### Indexes Added
- `user_type_idx`: Fast filtering of temporary users
- `user_expires_at_idx`: Quick expiration queries
- `user_exp_check_idx`: Composite index for expiration checks
- `ul_user_idx`: Fast user location lookups
- `ul_location_idx`: Fast location user lookups

### Query Optimization
- UserLocation uses `select_related('location')` to reduce queries
- `get_accessible_location_ids()` caches for request duration
- Bulk create for location assignments
- Atomic transactions for user creation

## 📊 Monitoring

### Metrics to Track
- Number of temporary users created
- Number of users expired per day
- Failed location access attempts
- Users expiring within 24 hours

### Audit Queries
```sql
-- Users expiring today
SELECT username, expires_at
FROM auth_user
WHERE user_type = 'temporary'
  AND DATE(expires_at) = CURRENT_DATE;

-- Location access distribution
SELECT u.username, COUNT(ul.id) as location_count
FROM auth_user u
LEFT JOIN user_locations ul ON u.id = ul.user_id
GROUP BY u.id, u.username;

-- Recent expiration events
SELECT * FROM security_securityevent
WHERE event_type = 'account_expired'
ORDER BY timestamp DESC
LIMIT 10;
```

## 🎯 Summary

This implementation provides:
1. ✅ Complete location-based access control
2. ✅ Temporary user support with automatic expiration
3. ✅ Flexible user-location assignment
4. ✅ Comprehensive security and audit logging
5. ✅ Performance-optimized with proper indexing
6. ✅ Admin tools for managing expired users
7. ✅ Clear error messages and user feedback
8. ✅ Frontend-ready API responses

All backend components are ready. Frontend just needs to pass `location_ids` during user creation and handle the automatic location filtering that's now built into the API.
