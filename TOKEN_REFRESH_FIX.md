# JWT Token Refresh Error Fix - "User matching query does not exist"

## Problem Summary

**Error**:
```
User matching query does not exist
```

**Occurs At**: `/api/auth/token/refresh/` endpoint

**Root Cause**:
After database reset, all users were deleted but frontend still has valid JWT refresh tokens stored in `localStorage`. When the frontend attempts to refresh tokens, the backend tries to validate the token against a user ID that no longer exists in the database, causing the application to crash.

### The JWT Token Structure

JWT tokens contain a `user_id` claim:
```json
{
  "token_type": "refresh",
  "exp": 1728456789,
  "user_id": 5  ← User ID embedded in token
}
```

**The Problem**:
1. User ID 5 existed when token was created
2. Database was reset, User ID 5 deleted
3. Token is still valid (not expired)
4. Backend tries to lookup User ID 5 → `DoesNotExist` error
5. Application crashes without clearing invalid tokens

## The Solution

I've implemented a comprehensive fix on both backend and frontend to gracefully handle this scenario:

### ✅ Backend Fix: Custom Token Refresh View

**Created**: `CustomTokenRefreshView` in `backend/accounts/views.py`

**Key Features**:

#### 1. Explicit User Existence Check

Before generating new tokens, the view checks if the user exists:

```python
try:
    user = User.objects.get(id=user_id)
    # User exists - proceed with token refresh
except User.DoesNotExist:
    # User deleted - return clear error
    return Response(
        {
            'error': 'user_not_found',
            'detail': 'User account no longer exists. Please log in again.',
            'action': 'clear_tokens'  ← Frontend instruction
        },
        status=status.HTTP_401_UNAUTHORIZED
    )
```

#### 2. Handles Multiple Error Scenarios

**Scenario A: User Not Found (Database Reset)**
```json
{
  "error": "user_not_found",
  "detail": "User account no longer exists. Please log in again.",
  "action": "clear_tokens"
}
```

**Scenario B: User Inactive**
```json
{
  "error": "user_inactive",
  "detail": "User account is inactive",
  "action": "clear_tokens"
}
```

**Scenario C: Invalid Token**
```json
{
  "error": "invalid_token",
  "detail": "Token is expired or invalid",
  "action": "clear_tokens"
}
```

**Scenario D: Missing Refresh Token**
```json
{
  "error": "refresh_token_required",
  "detail": "Refresh token is required",
  "action": "clear_tokens"
}
```

#### 3. Security Event Logging

All token refresh failures are logged for security monitoring:

```python
log_security_event(
    user=None,
    action='token_refresh_user_not_found',
    description=f'Token refresh attempted for non-existent user ID: {user_id}',
    ip_address=get_client_ip(request),
    user_agent=request.META.get('HTTP_USER_AGENT', ''),
    metadata={'token_user_id': user_id}
)
```

**Logged Events**:
- `token_refresh_user_not_found` - User ID in token doesn't exist
- `token_refresh_inactive_user` - User account is inactive
- `token_refresh_invalid` - Token is malformed or expired

### ✅ Frontend Fix: Enhanced Token Management

**Updated**: `frontend/src/api/axios.ts`

**Key Features**:

#### 1. Smart Error Detection

The axios interceptor now checks for the `action: 'clear_tokens'` field:

```typescript
const shouldClearTokens =
  refreshError?.response?.data?.action === 'clear_tokens' ||
  refreshError?.response?.data?.error === 'user_not_found' ||
  refreshError?.response?.data?.error === 'invalid_token' ||
  refreshError?.response?.data?.error === 'user_inactive';

if (shouldClearTokens) {
  // Clear all auth data and redirect to login
}
```

#### 2. Comprehensive Token Clearing

New `clearAllAuthData()` function removes ALL authentication data:

```typescript
clearAllAuthData: (): void => {
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear any other auth-related items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('token') || key.includes('auth') || key.includes('user'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
```

**What Gets Cleared**:
- ✅ `access_token` from localStorage
- ✅ `refresh_token` from localStorage
- ✅ `user` object from localStorage
- ✅ Entire sessionStorage
- ✅ Any other keys containing 'token', 'auth', or 'user'

#### 3. User-Friendly Event Dispatching

When tokens are cleared, a detailed event is dispatched:

```typescript
window.dispatchEvent(new CustomEvent('auth:logout', {
  detail: {
    reason: 'user_not_found',
    message: 'User account no longer exists. Please log in again.'
  }
}));
```

**Benefits**:
- AuthContext receives the event
- User is automatically logged out
- Redirected to login page
- Can show user-friendly error message

#### 4. Applied to All Token Refresh Scenarios

The fix is applied in **3 different places**:

**A) Response Interceptor (401 errors)**
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try token refresh...
      // If fails, clear tokens and logout
    }
  }
);
```

**B) Token Expiry Monitoring (proactive refresh)**
```typescript
setInterval(() => {
  // Check if token expires soon
  if (expiresInNextFiveMinutes) {
    // Try to refresh
    // If fails, clear tokens and logout
  }
}, 60000);
```

**C) Expired Token Detection**
```typescript
if (tokenIsExpired) {
  tokenManager.clearAllAuthData();
  window.dispatchEvent(new CustomEvent('auth:logout'));
}
```

## How It Works End-to-End

### Before Fix (Broken Flow)

```
1. Frontend has token with user_id=5
2. User ID 5 was deleted from database
3. Frontend sends: POST /api/auth/token/refresh/
4. Backend tries: User.objects.get(id=5)
5. ❌ Exception: User matching query does not exist
6. ❌ App crashes, tokens still in localStorage
7. ❌ User stuck - can't login or use app
```

### After Fix (Working Flow)

```
1. Frontend has token with user_id=5
2. User ID 5 was deleted from database
3. Frontend sends: POST /api/auth/token/refresh/
4. Backend tries: User.objects.get(id=5)
5. ✅ Catches DoesNotExist exception
6. ✅ Returns: {"error": "user_not_found", "action": "clear_tokens"}
7. ✅ Frontend detects "clear_tokens" action
8. ✅ Clears all localStorage, sessionStorage
9. ✅ Dispatches 'auth:logout' event
10. ✅ AuthContext catches event
11. ✅ Redirects to login page
12. ✅ User can now login with new account
```

## Files Modified

### Backend

✅ **`backend/accounts/views.py`** (Lines 655-772)
- Added `CustomTokenRefreshView` class
- Handles user existence check
- Returns structured error responses with `action` field
- Logs security events

✅ **`backend/accounts/urls.py`** (Line 11)
- Changed from: `TokenRefreshView.as_view()`
- Changed to: `views.CustomTokenRefreshView.as_view()`

### Frontend

✅ **`frontend/src/api/axios.ts`**

**Added** (Lines 55-77):
```typescript
clearAllAuthData: (): void => {
  // Comprehensive token clearing logic
}
```

**Updated** (Lines 143-162):
```typescript
// Response interceptor - handle clear_tokens action
if (shouldClearTokens) {
  tokenManager.clearAllAuthData();
  window.dispatchEvent(new CustomEvent('auth:logout', { detail: {...} }));
}
```

**Updated** (Lines 212-227):
```typescript
// Token expiry monitoring - handle clear_tokens action
if (shouldClearTokens) {
  tokenManager.clearAllAuthData();
  window.dispatchEvent(new CustomEvent('auth:logout', { detail: {...} }));
}
```

**Updated** (Lines 233-240):
```typescript
// Expired token detection - clear all auth data
tokenManager.clearAllAuthData();
window.dispatchEvent(new CustomEvent('auth:logout', { detail: {...} }));
```

## Testing the Fix

### Test Scenario 1: Database Reset with Old Tokens

**Setup**:
```bash
# 1. Create user and login
# 2. Store tokens in browser
# 3. Reset database
cd backend
python manage.py flush --no-input
python manage.py migrate
```

**Test**:
```bash
# 1. Open browser with old tokens still in localStorage
# 2. Try to access protected page
# 3. App attempts token refresh
```

**Expected Result**:
```
✅ Backend returns: {"error": "user_not_found", "action": "clear_tokens"}
✅ Frontend clears all tokens
✅ User redirected to login
✅ Can login with new account
```

### Test Scenario 2: User Deleted While Session Active

**Setup**:
```bash
# 1. User logs in
# 2. Admin deletes user account
```

**Test**:
```bash
# 1. User's session token expires
# 2. App attempts to refresh token
```

**Expected Result**:
```
✅ Token refresh fails gracefully
✅ Tokens cleared
✅ User redirected to login
✅ Informative error message shown
```

### Test Scenario 3: Inactive User

**Setup**:
```bash
# 1. User logs in
# 2. Admin deactivates user account
```

**Test**:
```bash
# 1. User token expires
# 2. App attempts refresh
```

**Expected Result**:
```
✅ Backend returns: {"error": "user_inactive", "action": "clear_tokens"}
✅ Tokens cleared
✅ User logged out
```

### Test Scenario 4: Malformed Token

**Setup**:
```bash
# 1. Manually corrupt refresh token in localStorage
localStorage.setItem('refresh_token', 'invalid.token.here');
```

**Test**:
```bash
# 1. Try to access protected page
```

**Expected Result**:
```
✅ Backend returns: {"error": "invalid_token", "action": "clear_tokens"}
✅ Tokens cleared
✅ User redirected to login
```

## Manual Token Clearing

If you need to manually clear tokens, you can do so from browser console:

### Clear Tokens from Browser Console

```javascript
// Clear all localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload page
window.location.reload();
```

### Clear Specific Auth Items

```javascript
// Clear only auth-related items
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');

// Clear all token-related items
Object.keys(localStorage)
  .filter(key => key.includes('token') || key.includes('auth') || key.includes('user'))
  .forEach(key => localStorage.removeItem(key));

// Reload
window.location.href = '/login';
```

### Using DevTools Application Tab

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage** in sidebar
4. Select your domain
5. Find and delete:
   - `access_token`
   - `refresh_token`
   - `user`
6. Expand **Session Storage**
7. Select your domain
8. Click **Clear All**
9. Refresh page

## API Error Response Format

All token refresh errors now follow this consistent format:

```typescript
interface TokenRefreshError {
  error: string;           // Error code (user_not_found, invalid_token, etc.)
  detail: string;          // Human-readable error message
  action: 'clear_tokens';  // Instruction for frontend
}
```

**Examples**:

```json
{
  "error": "user_not_found",
  "detail": "User account no longer exists. Please log in again.",
  "action": "clear_tokens"
}
```

```json
{
  "error": "user_inactive",
  "detail": "User account is inactive",
  "action": "clear_tokens"
}
```

```json
{
  "error": "invalid_token",
  "detail": "Token is expired or invalid",
  "action": "clear_tokens"
}
```

## Security Improvements

### 1. Security Event Logging

All failed token refresh attempts are now logged:

```python
log_security_event(
    user=None,
    action='token_refresh_user_not_found',
    description=f'Token refresh attempted for non-existent user ID: {user_id}',
    ip_address=get_client_ip(request),
    user_agent=request.META.get('HTTP_USER_AGENT', ''),
    metadata={'token_user_id': user_id}
)
```

**View Logs**:
```bash
cd backend
python manage.py shell
```

```python
from security.models import SecurityEvent
events = SecurityEvent.objects.filter(action__icontains='token_refresh')
for event in events:
    print(f"{event.timestamp}: {event.action} - {event.description}")
```

### 2. Prevents Token Replay Attacks

If a user is deleted or deactivated, their tokens become immediately invalid, even if they haven't expired yet.

### 3. Graceful Degradation

The app never crashes due to invalid tokens - it always handles them gracefully and redirects to login.

## Debugging

### Check Token Contents

```javascript
// In browser console
const token = localStorage.getItem('refresh_token');
if (token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('User ID:', payload.user_id);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Check Backend Logs

```bash
cd backend
tail -f logs/security.log | grep token_refresh
```

### Test Token Refresh Endpoint Directly

```bash
# Get your refresh token
REFRESH_TOKEN="your_refresh_token_here"

# Try to refresh
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d "{\"refresh\": \"$REFRESH_TOKEN\"}"
```

**Expected Response (User Not Found)**:
```json
{
  "error": "user_not_found",
  "detail": "User account no longer exists. Please log in again.",
  "action": "clear_tokens"
}
```

## Best Practices

### 1. Always Clear Tokens on Logout

```typescript
const logout = async () => {
  // Call logout endpoint
  await api.post('/api/auth/logout/', { refresh_token: ... });

  // Clear all auth data
  tokenManager.clearAllAuthData();

  // Redirect to login
  navigate('/login');
};
```

### 2. Handle Auth Events in Components

```typescript
useEffect(() => {
  const handleLogout = (event: CustomEvent) => {
    const { reason, message } = event.detail;

    // Show user-friendly message
    toast.error(message || 'Session expired. Please log in again.');

    // Redirect to login
    navigate('/login');
  };

  window.addEventListener('auth:logout', handleLogout);

  return () => {
    window.removeEventListener('auth:logout', handleLogout);
  };
}, [navigate]);
```

### 3. Test After Database Changes

After any database reset or user deletion:

```bash
# 1. Clear your browser's localStorage
# 2. Clear sessionStorage
# 3. Hard refresh (Ctrl+Shift+R)
# 4. Try logging in again
```

## Summary

The JWT token refresh error has been permanently fixed by:

✅ **Backend**: Created `CustomTokenRefreshView` that explicitly checks for user existence and returns structured error responses with `action: 'clear_tokens'`

✅ **Frontend**: Enhanced axios interceptor to detect `clear_tokens` action and comprehensively clear all authentication data

✅ **Security**: All token refresh failures are logged for security monitoring

✅ **User Experience**: Users are gracefully redirected to login with clear error messages instead of seeing crashes

**The fix handles**:
- Database resets
- User deletions
- User deactivations
- Invalid/expired tokens
- Malformed tokens
- Missing tokens

**Result**: The application now gracefully handles all token-related errors and never gets stuck in an invalid authentication state.

---

**Last Updated**: October 3, 2025
**Status**: ✅ Complete and tested
**Impact**: Critical security and UX improvement
