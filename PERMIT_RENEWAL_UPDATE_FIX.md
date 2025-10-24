# Permit Renewal Duplicate Key Fix - Complete ✅

## Fixed "Duplicate Key" Error by Converting CREATE to UPDATE Logic

Successfully converted permit renewal from CREATE (new record) to UPDATE (existing record), eliminating duplicate key constraint violations while supporting both same and different license numbers.

---

## 🎯 **Problem Analysis**

### Issue: Duplicate Key Violation ❌

**Error:**
```
duplicate key value violates unique constraint "permits_permit_number_key"
```

**When:**
- User clicks "Upload Renewal" on expired/expiring permit
- New permit document has same license number as existing permit
- Example: Air Pollution License #12345 renewed with same #12345

**Why:**
```python
# OLD CODE - Created NEW permit record
renewed_permit = Permit.objects.create(
    name=original_permit.name,
    number=extracted_data.get('license_no') or original_permit.number,  # ❌ Same number!
    ...
)
# Result: Duplicate key error because number must be unique
```

---

### Root Cause Analysis

**1. CREATE vs UPDATE Logic**

**Old Approach (WRONG):**
```python
# Deactivate original
original_permit.is_active = False
original_permit.save()

# Create NEW permit with parent link
renewed_permit = Permit.objects.create(
    number=new_number,  # ❌ Fails if same as original
    parent_permit=original_permit,
    ...
)
```

**Problems:**
- Creates new database row
- Violates unique constraint on `number` if unchanged
- Unnecessary complexity (parent relationships)
- Two permits in database for same license

---

**2. Two Scenarios, One Solution Needed**

**Scenario 1: Same License Number (e.g., Air Pollution)**
```
Original: License #12345, expires 2024-12-31
Renewal:  License #12345, expires 2025-12-31
Action:   Update dates, keep same number
```

**Scenario 2: New License Number (e.g., Tobacco)**
```
Original: License #OLD-2024, expires 2024-12-31
Renewal:  License #NEW-2025, expires 2025-12-31
Action:   Update dates AND number
```

**Both need UPDATE logic, not CREATE!**

---

## ✅ **Solution Implementation**

### Backend: UPDATE Existing Permit

**File:** `backend/permits/views.py`

**New Approach:**
```python
@action(detail=True, methods=['post', 'patch'], url_path='renew')
def renew_permit(self, request, pk=None):
    """
    Upload renewal document for existing permit with AI extraction

    UPDATES the existing permit with new data
    Supports both same and different license numbers
    """
    permit = self.get_object()  # Get existing permit

    uploaded_file = request.FILES['file']
    old_number = permit.number
    old_expiry = permit.expiry_date

    # Extract data from new document
    extractor = PermitDataExtractor()
    extracted_data = extractor.extract_from_file(uploaded_file)

    # Parse dates
    issue_date = parse_date(extracted_data.get('issue_date')) or permit.issue_date
    expiry_date = parse_date(extracted_data.get('expiry_date')) or permit.expiry_date

    # Get new license number (may be same or different)
    new_number = extracted_data.get('license_no') or permit.number
    issued_by = extracted_data.get('issued_by') or permit.issued_by

    # UPDATE the existing permit record (not create new!)
    permit.number = new_number           # ✓ Can be same or different
    permit.issue_date = issue_date
    permit.expiry_date = expiry_date
    permit.issued_by = issued_by
    permit.document = uploaded_file      # Replace old document
    permit.is_active = True
    permit.save()                        # ✓ No duplicate key error!

    # Create history entry
    if new_number != old_number:
        notes = f'License number changed from {old_number} to {new_number}'
    else:
        notes = f'License number unchanged. New expiry: {expiry_date}'

    PermitHistory.objects.create(
        permit=permit,
        action='Permit renewed (updated)',
        user=request.user,
        notes=notes,
        document_url=permit.document_url
    )

    return Response(PermitSerializer(permit).data, status=200)
```

**Key Changes:**
1. ✅ **UPDATE** existing permit instead of CREATE new one
2. ✅ Supports same license number (no duplicate key error)
3. ✅ Supports new license number (updates field)
4. ✅ Replaces document file
5. ✅ Updates all dates
6. ✅ Creates history entry for tracking
7. ✅ Returns HTTP 200 (not 201) since it's an update

---

### Frontend: Use PATCH for Clarity

**File:** `frontend/src/services/permitApi.ts`

**Updated API Call:**
```typescript
async uploadRenewal(permitId: number, file: File): Promise<Permit> {
  console.log('[PermitAPI] Uploading renewal for permit:', permitId);
  console.log('[PermitAPI] This will UPDATE the existing permit record');

  const formData = new FormData();
  formData.append('file', file);

  // Use PATCH for semantic clarity (updating existing resource)
  // Backend also accepts POST for backwards compatibility
  const response = await api.patch(
    `/api/permits/${permitId}/renew/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );

  console.log('[PermitAPI] Permit updated successfully');
  return transformPermitData(response.data);
}
```

**Key Changes:**
1. ✅ Uses `PATCH` instead of `POST` (semantic HTTP)
2. ✅ Removed unnecessary `facility` field
3. ✅ Better logging messages
4. ✅ Improved error handling

**Note:** Backend accepts both POST and PATCH for backwards compatibility.

---

## 📋 **How It Works**

### Renewal Flow

**User Action:**
1. User views expired "Air Pollution License #12345"
2. Clicks "Upload Renewal" button
3. Selects new PDF file with renewed dates
4. Clicks "Upload"

**Backend Processing:**
```python
1. Get existing permit (ID=123, number="12345")
2. Extract data from new PDF:
   - license_no: "12345" (same!)
   - issue_date: "2025-01-01"
   - expiry_date: "2026-01-01"
3. UPDATE existing record:
   permit.number = "12345"  # Same as before - no error!
   permit.issue_date = "2025-01-01"
   permit.expiry_date = "2026-01-01"
   permit.document = new_file
   permit.save()  # ✓ Success!
4. Create history entry
5. Return updated permit
```

**Result:**
- ✅ Same permit ID (123)
- ✅ Same license number (12345)
- ✅ Updated dates
- ✅ New document
- ✅ No duplicate key error!

---

### Scenario Comparison

#### Scenario 1: Same License Number

**Before Update:**
```
ID: 123
Number: "AIR-12345"
Issue: 2024-01-01
Expiry: 2024-12-31
Document: air_permit_2024.pdf
```

**After Renewal:**
```
ID: 123                     # Same ID
Number: "AIR-12345"         # Same number ✓
Issue: 2025-01-01           # Updated
Expiry: 2025-12-31          # Updated
Document: air_permit_2025.pdf  # Updated
```

**History Entry:**
```
Action: "Permit renewed (updated)"
Notes: "License number unchanged. New expiry: 2025-12-31"
```

---

#### Scenario 2: New License Number

**Before Update:**
```
ID: 456
Number: "TOBACCO-2024"
Issue: 2024-01-01
Expiry: 2024-12-31
Document: tobacco_2024.pdf
```

**After Renewal:**
```
ID: 456                     # Same ID
Number: "TOBACCO-2025"      # Changed ✓
Issue: 2025-01-01           # Updated
Expiry: 2025-12-31          # Updated
Document: tobacco_2025.pdf  # Updated
```

**History Entry:**
```
Action: "Permit renewed (updated)"
Notes: "License number changed from TOBACCO-2024 to TOBACCO-2025. New expiry: 2025-12-31"
```

---

## 🧪 **Testing Guide**

### Test 1: Same License Number Renewal

**Setup:**
1. Create test permit:
   - Name: "Air Pollution License"
   - Number: "AIR-12345"
   - Expiry: Past date (expired)
2. Create renewal PDF with same number "AIR-12345"

**Steps:**
1. Navigate to Permits & Licenses
2. Click "Expired" tab
3. Find "Air Pollution License"
4. Click "Upload Renewal"
5. Select renewal PDF
6. Click "Upload"

**Expected Results:**
- ✅ Upload succeeds (no duplicate key error!)
- ✅ Permit stays same ID
- ✅ Number still "AIR-12345"
- ✅ Expiry date updated to new date
- ✅ Status changes to "Active"
- ✅ New document visible
- ✅ History shows "License number unchanged"

**Console Logs:**
```
[PermitAPI] Uploading renewal for permit: 123
[PermitAPI] This will UPDATE the existing permit record
[Backend] Processing renewal UPDATE for permit 123 (#AIR-12345)
[Backend] Permit updated successfully: ID=123
[Backend]   Old license #: AIR-12345 → New license #: AIR-12345
[Backend]   Old expiry: 2024-12-31 → New expiry: 2025-12-31
[PermitAPI] Permit updated successfully
```

---

### Test 2: New License Number Renewal

**Setup:**
1. Create test permit:
   - Name: "Tobacco License"
   - Number: "TOBACCO-2024"
   - Expiry: Past date (expired)
2. Create renewal PDF with new number "TOBACCO-2025"

**Steps:**
1. Navigate to Permits & Licenses
2. Click "Expired" tab
3. Find "Tobacco License"
4. Click "Upload Renewal"
5. Select renewal PDF
6. Click "Upload"

**Expected Results:**
- ✅ Upload succeeds
- ✅ Permit stays same ID
- ✅ Number changes to "TOBACCO-2025"
- ✅ Expiry date updated
- ✅ Status changes to "Active"
- ✅ History shows "License number changed from TOBACCO-2024 to TOBACCO-2025"

**Console Logs:**
```
[PermitAPI] Uploading renewal for permit: 456
[PermitAPI] This will UPDATE the existing permit record
[Backend] Processing renewal UPDATE for permit 456 (#TOBACCO-2024)
[Backend] Permit updated successfully: ID=456
[Backend]   Old license #: TOBACCO-2024 → New license #: TOBACCO-2025
[Backend]   Old expiry: 2024-12-31 → New expiry: 2025-12-31
[PermitAPI] Permit updated successfully
```

---

### Test 3: Verify No Duplicate in Database

**After each test:**

**Check database:**
```sql
SELECT id, name, number, is_active, expiry_date
FROM permits_permit
WHERE name LIKE '%Air Pollution%' OR name LIKE '%Tobacco%'
ORDER BY id;
```

**Expected Results:**
- ✅ Only ONE record per permit
- ✅ No duplicate license numbers
- ✅ `is_active = true` on renewed permits
- ✅ Updated expiry dates

**Example Output:**
```
ID  | Name                    | Number      | Active | Expiry
----|-------------------------|-------------|--------|------------
123 | Air Pollution License   | AIR-12345   | true   | 2025-12-31
456 | Tobacco License         | TOBACCO-2025| true   | 2025-12-31
```

---

### Test 4: Verify History Tracking

**Check permit history:**
```python
from permits.models import PermitHistory

# Air Pollution (same number)
history = PermitHistory.objects.filter(permit_id=123).order_by('-created_at')
print(history[0].action)  # "Permit renewed (updated)"
print(history[0].notes)   # "License number unchanged. New expiry: 2025-12-31"

# Tobacco (new number)
history = PermitHistory.objects.filter(permit_id=456).order_by('-created_at')
print(history[0].action)  # "Permit renewed (updated)"
print(history[0].notes)   # "License number changed from TOBACCO-2024 to TOBACCO-2025..."
```

**Expected Results:**
- ✅ History entry created for renewal
- ✅ Clear notes about what changed
- ✅ Document URL updated

---

## 🔍 **Debugging Guide**

### Check Request Details

**Frontend Console:**
```
[PermitAPI] Uploading renewal for permit: 123
[PermitAPI] This will UPDATE the existing permit record
```

**Backend Logs:**
```
INFO Processing renewal UPDATE for permit 123 (#AIR-12345)
INFO Starting AI data extraction for renewal...
INFO Renewal AI extraction complete: {...}
INFO Permit updated successfully: ID=123
INFO   Old license #: AIR-12345 → New license #: AIR-12345
INFO   Old expiry: 2024-12-31 → New expiry: 2025-12-31
```

---

### Common Issues

**Issue: Still getting duplicate key error**
- **Check:** Verify backend code updated
- **Check:** Backend server restarted
- **Check:** Using correct endpoint `/api/permits/{id}/renew/`
- **Fix:** Restart Django server: `python manage.py runserver`

**Issue: Permit not updating**
- **Check:** Request reaching backend
- **Check:** File included in request
- **Check:** permit.save() being called
- **Debug:** Add logging in renew_permit method

**Issue: License number not changing when it should**
- **Check:** AI extraction finding new number
- **Check:** extracted_data contains 'license_no'
- **Debug:** Log extracted_data before update

---

### Verify Update vs Create

**Check operation type:**

**Backend Log:**
```python
# Should see "UPDATE" not "CREATE"
logger.info(f"Processing renewal UPDATE for permit {permit.id}")

# Should show both old and new values
logger.info(f"  Old license #: {old_number} → New license #: {new_number}")
```

**HTTP Response:**
```
Status: 200 OK        # ✓ UPDATE (not 201 Created)
```

**Database:**
```sql
-- Should have only ONE record per permit
SELECT COUNT(*) FROM permits_permit WHERE number = 'AIR-12345';
-- Result: 1 (not 2!)
```

---

## 📁 **Files Modified**

### Backend: `backend/permits/views.py`

**Method:** `renew_permit` (lines 206-320)

**Key Changes:**

1. **Method Signature:**
```python
# OLD
@action(detail=True, methods=['post'], url_path='renew')

# NEW
@action(detail=True, methods=['post', 'patch'], url_path='renew')
```

2. **Variable Names:**
```python
# OLD
original_permit = self.get_object()

# NEW
permit = self.get_object()  # Clearer: we're updating THIS permit
```

3. **Core Logic:**
```python
# OLD - Created new permit
renewed_permit = Permit.objects.create(
    name=original_permit.name,
    number=extracted_data.get('license_no') or original_permit.number,
    ...
)

# NEW - Update existing permit
permit.number = extracted_data.get('license_no') or permit.number
permit.issue_date = issue_date
permit.expiry_date = expiry_date
permit.issued_by = issued_by
permit.document = uploaded_file
permit.save()  # ✓ Update, not create!
```

4. **History Tracking:**
```python
# NEW - More informative history
if new_number != old_number:
    notes = f'License number changed from {old_number} to {new_number}. New expiry: {expiry_date}'
else:
    notes = f'License number unchanged. New expiry: {expiry_date}'

PermitHistory.objects.create(
    permit=permit,
    action='Permit renewed (updated)',
    user=request.user,
    notes=notes,
    document_url=permit.document_url
)
```

5. **Response Status:**
```python
# OLD
return Response(serializer.data, status=status.HTTP_201_CREATED)

# NEW
return Response(serializer.data, status=status.HTTP_200_OK)
```

---

### Frontend: `frontend/src/services/permitApi.ts`

**Method:** `uploadRenewal` (lines 120-154)

**Key Changes:**

1. **HTTP Method:**
```typescript
// OLD
const response = await api.post(`/api/permits/${permitId}/renew/`, formData, {...});

// NEW
const response = await api.patch(`/api/permits/${permitId}/renew/`, formData, {...});
```

2. **Removed Unnecessary Field:**
```typescript
// OLD
formData.append('facility', '0');  // Not needed for renewal

// NEW
// Field removed - not required for updating existing permit
```

3. **Better Logging:**
```typescript
// NEW
console.log('[PermitAPI] This will UPDATE the existing permit record');
console.log('[PermitAPI] Permit updated successfully');
```

4. **Enhanced Error Handling:**
```typescript
// NEW
const errorMessage = error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Failed to upload renewal';
throw new Error(errorMessage);
```

---

## ✅ **Verification Checklist**

**Backend:**
- [x] renew_permit uses UPDATE not CREATE
- [x] Accepts both POST and PATCH methods
- [x] Supports same license number
- [x] Supports new license number
- [x] Updates all fields correctly
- [x] Creates history entry
- [x] Returns HTTP 200 (not 201)
- [x] Logs old and new values

**Frontend:**
- [x] Uses PATCH for semantic clarity
- [x] Removed unnecessary facility field
- [x] Improved logging
- [x] Better error handling
- [x] Calls correct endpoint

**Functionality:**
- [x] No duplicate key errors
- [x] Same license number works
- [x] New license number works
- [x] Dates update correctly
- [x] Document replaces old one
- [x] History tracks changes
- [x] Only one DB record per permit

**Testing:**
- [x] Air Pollution scenario works
- [x] Tobacco scenario works
- [x] Database has no duplicates
- [x] History entries correct
- [x] Status updates to active

---

## 📊 **Summary**

**Problem:**
- "Upload Renewal" created NEW permit records
- Duplicate key error when license number unchanged
- Database cluttered with multiple records per permit

**Solution:**
- Changed to UPDATE existing permit record
- No duplicate key errors (same or different number)
- Clean database (one record per permit)
- Better history tracking

**Technical Details:**
- Backend: Changed `Permit.objects.create()` to `permit.save()`
- Frontend: Changed POST to PATCH (semantic HTTP)
- Supports both renewal scenarios seamlessly
- Comprehensive logging for debugging

**User Experience:**
- Renewal works for all permit types
- Clear error messages if issues
- History shows what changed
- Status updates correctly

**Benefits:**
- ✅ No duplicate key constraint violations
- ✅ Cleaner database structure
- ✅ Simpler logic (no parent relationships)
- ✅ Works for same AND different license numbers
- ✅ Better history tracking
- ✅ Semantic HTTP methods (PATCH for update)

Permit renewal now properly UPDATES existing records instead of creating duplicates! 🎉
