# Permit Data Display and Status Calculation Fix

## Problem Summary

The Permits & Licenses component was not displaying actual permit data from the database. Newly created permits weren't visible, and there was no proper status calculation or tab filtering based on expiry dates.

## Root Causes

### 1. **No API Integration**
**File**: `frontend/src/components/facility/PermitsLicenses.tsx`

- Component used only local state
- No API calls to fetch permits from database
- `handleAddPermit()` only added to local state, never persisted
- No data loaded on component mount

### 2. **Missing Status Calculation**
**File**: `backend/facilities/models.py`

- Model had `is_expiring_soon` and `is_expired` properties
- No unified `calculated_status` field for frontend filtering
- Status calculation logic not exposed to frontend

### 3. **Incorrect Field Names**
**Frontend/Backend Mismatch**:
- Frontend: `facility`, `type`, `number`, `issueDate`, `expiryDate`, `authority`
- Backend: `permit_type`, `permit_number`, `issuing_authority`, `issue_date`, `expiry_date`

### 4. **No Tab Filtering Logic**
- Tabs (All/Active/Expiring/Expired) didn't filter properly
- Status comparison used wrong field names
- No connection to backend calculated status

## Fixes Applied

### ✅ 1. Backend - Add Calculated Status Property

**File**: `backend/facilities/models.py`

**Added** (Line 259-271):
```python
@property
def calculated_status(self):
    """
    Calculate permit status based on expiry date
    Returns: 'expired', 'expiring_soon', or 'active'
    """
    today = date.today()
    if self.expiry_date < today:
        return 'expired'
    elif self.expiry_date <= today + timedelta(days=30):
        return 'expiring_soon'
    else:
        return 'active'
```

**Status Logic**:
- **Expired**: `expiry_date < today`
- **Expiring Soon**: `expiry_date <= today + 30 days`
- **Active**: `expiry_date > today + 30 days`

### ✅ 2. Backend - Expose Calculated Status in Serializer

**File**: `backend/facilities/serializers.py`

**Added** (Line 197):
```python
class PermitSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    is_expiring_soon = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    calculated_status = serializers.ReadOnlyField()  # ✅ NEW

    class Meta:
        model = Permit
        fields = ['id', 'location', 'location_name', 'permit_type', 'permit_number',
                 'issuing_authority', 'issue_date', 'expiry_date', 'status',
                 'description', 'renewal_required', 'is_expiring_soon', 'is_expired',
                 'calculated_status', 'created_at', 'updated_at']  # ✅ Added calculated_status
```

### ✅ 3. Frontend - Add API Service Methods

**File**: `frontend/src/services/api.ts`

**Added Update and Delete Methods** (Lines 591-612):
```typescript
/**
 * Update permit
 */
async updatePermit(id: number, data: any): Promise<any> {
  try {
    const response = await api.patch(`/api/facilities/permits/${id}/`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to update permit');
  }
}

/**
 * Delete permit
 */
async deletePermit(id: number): Promise<void> {
  try {
    await api.delete(`/api/facilities/permits/${id}/`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete permit');
  }
}
```

**Existing Methods** (Already implemented):
- `getPermits(locationId)` - Fetch permits for location
- `createPermit(locationId, data)` - Create new permit

### ✅ 4. Frontend - Complete Component Rewrite

**File**: `frontend/src/components/facility/PermitsLicenses.tsx`

#### Import API Service (Line 3):
```typescript
import { apiService } from '../../services/api';
```

#### Load Permits on Mount (Lines 32-54):
```typescript
useEffect(() => {
  if (selectedFacility) {
    loadPermits();
  }
}, [selectedFacility]);

const loadPermits = async () => {
  if (!selectedFacility?.id) return;

  setLoading(true);
  setError(null);
  try {
    const response = await apiService.getPermits(selectedFacility.id);
    console.log('🔍 Loaded permits:', response);
    setPermits(response);
  } catch (error: any) {
    console.error('Failed to load permits:', error);
    setError(error.message || 'Failed to load permits');
    setPermits([]);
  } finally {
    setLoading(false);
  }
};
```

#### Create Permit with API (Lines 92-140):
```typescript
const handleAddPermit = async () => {
  if (!newPermit.permit_number.trim()) {
    setError('Permit number is required');
    return;
  }

  if (!selectedFacility?.id) {
    setError('No facility selected');
    return;
  }

  setLoading(true);
  setError(null);
  try {
    const permitData = {
      location: selectedFacility.id,
      permit_type: newPermit.permit_type,
      permit_number: newPermit.permit_number,
      issuing_authority: newPermit.issuing_authority,
      issue_date: newPermit.issue_date,
      expiry_date: newPermit.expiry_date,
      description: newPermit.description,
      renewal_required: newPermit.renewal_required
    };

    console.log('🔍 Creating permit:', permitData);
    await apiService.createPermit(selectedFacility.id, permitData);

    setShowAddModal(false);
    setNewPermit({
      permit_type: 'operating',
      permit_number: '',
      issuing_authority: '',
      issue_date: '',
      expiry_date: '',
      description: '',
      renewal_required: true
    });
    setSuccess(`Permit "${newPermit.permit_number}" created successfully`);
    setTimeout(() => setSuccess(null), 5000);

    await loadPermits();  // ✅ Refresh list
  } catch (error: any) {
    console.error('Failed to create permit:', error);
    setError(error.message || 'Failed to create permit');
  } finally {
    setLoading(false);
  }
};
```

**Key Features**:
- ✅ Validates required fields
- ✅ Shows success message
- ✅ Closes modal automatically
- ✅ Reloads permit list to show new permit
- ✅ Proper error handling

#### Update Permit with API (Lines 61-90):
```typescript
const handleSavePermit = async () => {
  if (!editingPermit || !editedPermit) return;

  setLoading(true);
  setError(null);
  try {
    await apiService.updatePermit(editingPermit, {
      location: selectedFacility.id,
      permit_type: editedPermit.permit_type,
      permit_number: editedPermit.permit_number,
      issuing_authority: editedPermit.issuing_authority,
      issue_date: editedPermit.issue_date,
      expiry_date: editedPermit.expiry_date,
      description: editedPermit.description || '',
      renewal_required: editedPermit.renewal_required !== false
    });

    setEditingPermit(null);
    setEditedPermit({});
    setSuccess('Permit updated successfully');
    setTimeout(() => setSuccess(null), 5000);

    await loadPermits();  // ✅ Refresh list
  } catch (error: any) {
    console.error('Failed to update permit:', error);
    setError(error.message || 'Failed to update permit');
  } finally {
    setLoading(false);
  }
};
```

#### Delete Permit with API (Lines 142-162):
```typescript
const handleDeletePermit = async (permitId: number, permitNumber: string) => {
  if (!window.confirm(`Are you sure you want to delete permit "${permitNumber}"?`)) {
    return;
  }

  setLoading(true);
  setError(null);
  try {
    await apiService.deletePermit(permitId);

    setSuccess(`Permit "${permitNumber}" deleted successfully`);
    setTimeout(() => setSuccess(null), 5000);

    await loadPermits();  // ✅ Refresh list
  } catch (error: any) {
    console.error('Failed to delete permit:', error);
    setError(error.message || 'Failed to delete permit');
  } finally {
    setLoading(false);
  }
};
```

#### Status-Based Filtering (Lines 294-300):
```typescript
// Filter by status using calculated_status from backend
const filteredFacilityPermits = facilityPermits.filter(permit => {
  if (filter === 'all') return true;
  if (filter === 'active') return permit.calculated_status === 'active';
  if (filter === 'expiring') return permit.calculated_status === 'expiring_soon';
  if (filter === 'expired') return permit.calculated_status === 'expired';
  return true;
});
```

#### Statistics Cards (Lines 302-327):
```typescript
const statsData = [
  {
    title: 'Total Permits',
    value: facilityPermits.length.toString(),
    icon: FileText,
    color: 'blue'
  },
  {
    title: 'Active Permits',
    value: facilityPermits.filter(p => p.calculated_status === 'active').length.toString(),
    icon: CheckCircle,
    color: 'green'
  },
  {
    title: 'Expiring Soon',
    value: facilityPermits.filter(p => p.calculated_status === 'expiring_soon').length.toString(),
    icon: Clock,
    color: 'yellow'
  },
  {
    title: 'Expired',
    value: facilityPermits.filter(p => p.calculated_status === 'expired').length.toString(),
    icon: AlertTriangle,
    color: 'red'
  }
];
```

#### Updated Form Fields (Lines 662-743):
```typescript
const [newPermit, setNewPermit] = useState({
  permit_type: 'operating',       // ✅ snake_case
  permit_number: '',              // ✅ snake_case
  issuing_authority: '',          // ✅ snake_case
  issue_date: '',                 // ✅ snake_case
  expiry_date: '',                // ✅ snake_case
  description: '',
  renewal_required: true
});
```

Form now includes:
- **Permit Type** - Dropdown with 4 options (operating, environmental, safety, construction)
- **Permit Number** - Required text field
- **Issuing Authority** - Text field
- **Issue Date** - Date picker
- **Expiry Date** - Date picker
- **Description** - Textarea for notes

#### Success/Error Messages (Lines 353-371):
```typescript
{/* Success Message */}
{success && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-center">
      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
      <span className="text-green-800">{success}</span>
    </div>
  </div>
)}

{/* Error Message */}
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center">
      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
      <span className="text-red-800">{error}</span>
    </div>
  </div>
)}
```

## Field Name Mapping

### Frontend → Backend

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `permit_type` | `permit_type` | ✅ Match |
| `permit_number` | `permit_number` | ✅ Match |
| `issuing_authority` | `issuing_authority` | ✅ Match |
| `issue_date` | `issue_date` | ✅ Match |
| `expiry_date` | `expiry_date` | ✅ Match |
| `description` | `description` | ✅ Match |
| `renewal_required` | `renewal_required` | ✅ Match |

### Backend → Frontend

| Backend Field | Frontend Display | Type |
|---------------|------------------|------|
| `permit_type` | Permit Type | Select (4 options) |
| `permit_number` | Permit Number | Text (required) |
| `issuing_authority` | Issuing Authority | Text |
| `issue_date` | Issue Date | Date |
| `expiry_date` | Expiry Date | Date |
| `calculated_status` | Status Badge | Computed (active/expiring_soon/expired) |
| `description` | Description | Textarea |

## Status Calculation Examples

### Example 1: Active Permit
```
Today: 2025-10-03
Expiry Date: 2025-12-15
Days Until Expiry: 73 days

calculated_status = 'active'
Display: Green badge "Active"
Tab: Shows in "Active" tab
```

### Example 2: Expiring Soon
```
Today: 2025-10-03
Expiry Date: 2025-10-25
Days Until Expiry: 22 days

calculated_status = 'expiring_soon'
Display: Yellow badge "Expiring Soon"
Tab: Shows in "Expiring Soon" tab
```

### Example 3: Expired
```
Today: 2025-10-03
Expiry Date: 2025-09-15
Days Until Expiry: -18 days

calculated_status = 'expired'
Display: Red badge "Expired"
Tab: Shows in "Expired" tab
```

## User Flow (After Fix)

### Creating a Permit

```
1. User navigates to Permits & Licenses tab
   ↓
2. User sees existing permits list (from database)
   ↓
3. User clicks "Add Permit" button
   ↓
4. Form modal appears
   ↓
5. User fills in:
   - Permit Type (dropdown)
   - Permit Number (required)
   - Issuing Authority
   - Issue Date
   - Expiry Date
   - Description (optional)
   ↓
6. User clicks "Add Permit"
   ↓
7. POST /api/facilities/locations/{id}/permits/
   ↓
8. Permit saved to database
   ↓
9. Success message appears
   ↓
10. Modal closes
    ↓
11. Permit list refreshes (GET request)
    ↓
12. New permit appears in list with status badge
    ↓
13. Statistics cards update with new counts
```

### Viewing Permits by Status

```
User on "All" tab (default)
   ↓
Sees all permits with color-coded badges:
   - Active (green)
   - Expiring Soon (yellow)
   - Expired (red)
   ↓
User clicks "Active" tab
   ↓
Filtered to show only permits where:
   calculated_status === 'active'
   ↓
User clicks "Expiring Soon" tab
   ↓
Filtered to show only permits where:
   calculated_status === 'expiring_soon'
   ↓
User clicks "Expired" tab
   ↓
Filtered to show only permits where:
   calculated_status === 'expired'
```

## Testing Checklist

### ✅ Backend Status Calculation
```sql
-- Create test permits with different expiry dates
INSERT INTO facilities_permit (location_id, permit_type, permit_number, issuing_authority, issue_date, expiry_date, status, description, renewal_required)
VALUES
  (1, 'operating', 'OP-2024-001', 'State EPA', '2024-01-01', '2025-12-31', 'active', 'Operating permit', true),  -- Active
  (1, 'environmental', 'ENV-2024-002', 'EPA', '2024-01-01', '2025-10-20', 'active', 'Environmental permit', true),  -- Expiring Soon
  (1, 'safety', 'SAF-2023-001', 'OSHA', '2023-01-01', '2025-09-01', 'active', 'Safety permit', true);  -- Expired

-- Check calculated_status via API
GET /api/facilities/locations/1/permits/

-- Expected Response:
{
  "results": [
    {
      "id": 1,
      "permit_number": "OP-2024-001",
      "calculated_status": "active",  // ✅
      ...
    },
    {
      "id": 2,
      "permit_number": "ENV-2024-002",
      "calculated_status": "expiring_soon",  // ✅
      ...
    },
    {
      "id": 3,
      "permit_number": "SAF-2023-001",
      "calculated_status": "expired",  // ✅
      ...
    }
  ]
}
```

### ✅ Frontend Display
- [ ] Navigate to Permits & Licenses tab
- [ ] Verify permits load from database
- [ ] Check status badges show correct colors
- [ ] Verify statistics cards show correct counts
- [ ] Test tab filtering (All/Active/Expiring/Expired)

### ✅ Creating Permits
- [ ] Click "Add Permit" button
- [ ] Fill in all fields
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Verify modal closes
- [ ] Verify new permit appears in list
- [ ] Check database for new record
- [ ] Verify status badge is correct based on expiry date

### ✅ Updating Permits
- [ ] Click edit button on a permit
- [ ] Modify permit details
- [ ] Save changes
- [ ] Verify success message
- [ ] Verify permit updates in list
- [ ] Check database for updated data

### ✅ Deleting Permits
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify success message
- [ ] Verify permit removed from list
- [ ] Check database confirms deletion

### ✅ Status Filtering
- [ ] Create permits with different expiry dates
- [ ] Click "Active" tab → Only active permits show
- [ ] Click "Expiring Soon" tab → Only expiring permits show
- [ ] Click "Expired" tab → Only expired permits show
- [ ] Click "All" tab → All permits show

## Files Modified

### Backend
✅ `backend/facilities/models.py`
- Added `calculated_status` property (18 lines)

✅ `backend/facilities/serializers.py`
- Added `calculated_status` to fields list

### Frontend
✅ `frontend/src/services/api.ts`
- Added `updatePermit()` method
- Added `deletePermit()` method

✅ `frontend/src/components/facility/PermitsLicenses.tsx`
- Added `useEffect` to load permits on mount
- Rewrote `loadPermits()` with API call
- Rewrote `handleAddPermit()` with database persistence
- Rewrote `handleSavePermit()` with API update
- Added `handleDeletePermit()` with API delete
- Updated filtering logic to use `calculated_status`
- Updated statistics cards to use `calculated_status`
- Fixed form field names to match backend
- Added success/error message display

## API Endpoints Used

```
GET    /api/facilities/locations/{id}/permits/      - List permits for location
POST   /api/facilities/locations/{id}/permits/      - Create permit
PATCH  /api/facilities/permits/{id}/                - Update permit
DELETE /api/facilities/permits/{id}/                - Delete permit
GET    /api/facilities/locations/{id}/permits/count/ - Get permit count
```

## Database Schema

```sql
CREATE TABLE facilities_permit (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES facilities_location(id),
    permit_type VARCHAR(20),  -- 'operating', 'environmental', 'safety', 'construction'
    permit_number VARCHAR(100),
    issuing_authority VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    renewal_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(location_id, permit_number)
);
```

## Summary

The permit management system now:

✅ **Fetches real data** from PostgreSQL/Supabase
✅ **Calculates status dynamically** based on expiry dates
✅ **Filters by status** using backend-calculated values
✅ **Persists all changes** to database
✅ **Shows success/error messages** for user feedback
✅ **Automatically refreshes** list after changes
✅ **Uses correct field names** matching backend
✅ **Displays statistics** with real-time counts
✅ **Handles errors gracefully** with user-friendly messages

**Status calculation is automatic** - no manual status updates needed. The backend calculates status in real-time based on the current date and expiry date.

---

**Last Updated**: October 2, 2025
**Status**: ✅ Complete - Ready for testing
