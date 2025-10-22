# Permits Status-Based Button Logic - Complete ✅

## Dynamic Button System Implemented

The Permits & Licenses dashboard now displays different action buttons based on each permit's status (Active, Expiring Soon, Expired).

---

## 🎯 **Button Display Logic**

### **Active Permits** (Green Status)
```
┌────────────────────────────────────────────────┐
│ AIR QUALITY PERMIT            [Active ✓]       │
│                                                │
│ License: 12-345    Expiry: Nov 30, 2025       │
│                                                │
│ [📄 Documents] [🕐 View History]              │
│     Gray          Purple                       │
└────────────────────────────────────────────────┘
```

**Buttons Shown:**
- ✅ **Documents** (Gray) - View and download all documents
- ✅ **View History** (Purple) - View permit renewal history timeline

**Rationale:** Active permits don't need renewal actions, so we show history for reference.

---

### **Expiring Soon Permits** (Yellow Status)
```
┌────────────────────────────────────────────────┐
│ FOOD HANDLING PERMIT       [Expiring Soon ⚠]  │
│                                                │
│ License: 78-901    Expiry: Dec 15, 2024       │
│                                                │
│ [📄 Documents] [🔗 Renew Online] [📤 Upload Renewal] │
│     Gray           Blue            Green       │
└────────────────────────────────────────────────┘
```

**Buttons Shown:**
- ✅ **Documents** (Gray) - View and download all documents
- ✅ **Renew Online** (Blue) - Apply for renewal on external website
- ✅ **Upload Renewal** (Green) - Upload renewal documents after application

**Rationale:** Expiring permits need immediate renewal action, so we provide both online renewal and document upload.

---

### **Expired Permits** (Red Status)
```
┌────────────────────────────────────────────────┐
│ TOBACCO LICENSE                [Expired ✗]     │
│                                                │
│ License: 45-678    Expiry: Jan 5, 2024        │
│                                                │
│ [📄 Documents] [🔗 Renew Online] [📤 Upload Renewal] │
│     Gray           Blue            Green       │
└────────────────────────────────────────────────┘
```

**Buttons Shown:**
- ✅ **Documents** (Gray) - View and download all documents
- ✅ **Renew Online** (Blue) - Apply for renewal on external website
- ✅ **Upload Renewal** (Green) - Upload renewal documents after application

**Rationale:** Expired permits require urgent renewal, same actions as expiring permits.

---

## 📊 **Complete Button Matrix**

| Status | Documents | View History | Renew Online | Upload Renewal |
|--------|-----------|--------------|--------------|----------------|
| **Active** | ✅ Gray | ✅ Purple | ❌ | ❌ |
| **Expiring** | ✅ Gray | ❌ | ✅ Blue | ✅ Green |
| **Expired** | ✅ Gray | ❌ | ✅ Blue | ✅ Green |

---

## 🎨 **Button Styling Guide**

### Documents Button (Always Visible)
```tsx
<button className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
  <i className="fas fa-file-alt"></i>
  <span>Documents</span>
</button>
```

**Style:**
- Color: Gray text
- Hover: Blue text + blue background (50 opacity)
- Icon: fa-file-alt
- Position: Always first (leftmost)

---

### View History Button (Active Only)
```tsx
{status === 'active' && (
  <button className="text-gray-700 hover:text-purple-600 hover:bg-purple-50">
    <i className="fas fa-history"></i>
    <span>View History</span>
  </button>
)}
```

**Style:**
- Color: Gray text
- Hover: Purple text + purple background
- Icon: fa-history
- Position: Second (after Documents)
- Visibility: **Only for active permits**

---

### Renew Online Button (Expiring/Expired)
```tsx
{(status === 'expiring' || status === 'expired') && permit.renewalUrl && (
  <a
    href={permit.renewalUrl}
    target="_blank"
    className="bg-blue-600 text-white hover:bg-blue-700"
  >
    <i className="fas fa-external-link-alt"></i>
    <span>Renew Online</span>
  </a>
)}
```

**Style:**
- Color: Blue background, white text
- Hover: Darker blue
- Icon: fa-external-link-alt
- Position: Second or third (after Documents)
- Visibility: **Only for expiring/expired permits with renewal_url**
- Action: Opens external renewal website in new tab

---

### Upload Renewal Button (Expiring/Expired)
```tsx
{(status === 'expiring' || status === 'expired') && (
  <button
    onClick={() => onRenew(permitId, permitName)}
    className="bg-green-600 text-white hover:bg-green-700"
  >
    <i className="fas fa-upload"></i>
    <span>Upload Renewal</span>
  </button>
)}
```

**Style:**
- Color: Green background, white text
- Hover: Darker green
- Icon: fa-upload
- Position: Last (rightmost)
- Visibility: **Only for expiring/expired permits**
- Action: Opens upload modal for renewal documents

---

## 🔄 **User Workflows**

### Workflow 1: Active Permit (No Action Needed)
```
User viewing Active Permit
    ↓
Sees: [Documents] [View History]
    ↓
Clicks "View History"
    ↓
Modal opens with timeline:
  - Initial issuance
  - Past renewals
  - Document uploads
    ↓
User reviews history
    ↓
Closes modal
```

---

### Workflow 2: Expiring Permit (Renewal Needed)
```
User viewing Expiring Soon Permit
    ↓
Sees: [Documents] [Renew Online] [Upload Renewal]
    ↓
Clicks "Renew Online"
    ↓
External renewal website opens in new tab
(e.g., Pennsylvania DEP portal)
    ↓
User completes renewal application
    ↓
User returns to app
    ↓
Clicks "Upload Renewal"
    ↓
Upload modal opens
    ↓
User uploads renewal confirmation/receipt
    ↓
AI extracts data
    ↓
New permit created
Old permit marked as superseded
    ↓
Status updates to Active
```

---

### Workflow 3: Expired Permit (Urgent Renewal)
```
User viewing Expired Permit
    ↓
Sees: [Documents] [Renew Online] [Upload Renewal]
    ↓
Clicks "Documents"
    ↓
File viewer modal opens
Shows all documents including history
    ↓
User reviews old permit documents
    ↓
Clicks "Renew Online"
    ↓
Applies for renewal on external website
    ↓
Returns and clicks "Upload Renewal"
    ↓
Uploads new permit documents
    ↓
System updates permit status
```

---

## 🧪 **Testing Guide**

### Test 1: Active Permit Buttons

1. **Create/find an active permit** (expiry date > 30 days away)
2. **Navigate to Permits & Licenses**
3. **Click "Active" filter tab**
4. **Find the active permit card**
5. **Verify buttons shown:**
   - ✅ Documents (gray, left)
   - ✅ View History (purple, right)
   - ❌ NO "Renew Online"
   - ❌ NO "Upload Renewal"
6. **Click "View History"**
7. **Verify:** History modal opens with timeline
8. **Close modal**

### Test 2: Expiring Soon Permit Buttons

1. **Create/find an expiring permit** (expiry date 1-30 days away)
2. **Navigate to Permits & Licenses**
3. **Click "Expiring Soon" filter tab**
4. **Find the expiring permit card**
5. **Verify buttons shown:**
   - ✅ Documents (gray, left)
   - ✅ Renew Online (blue, middle) - if renewal_url exists
   - ✅ Upload Renewal (green, right)
   - ❌ NO "View History"
6. **Click "Renew Online"**
7. **Verify:** External website opens in new tab
8. **Return to app**
9. **Click "Upload Renewal"**
10. **Verify:** Upload modal opens

### Test 3: Expired Permit Buttons

1. **Create/find an expired permit** (expiry date in past)
2. **Navigate to Permits & Licenses**
3. **Click "Expired" filter tab**
4. **Find the expired permit card**
5. **Verify buttons shown:**
   - ✅ Documents (gray, left)
   - ✅ Renew Online (blue, middle) - if renewal_url exists
   - ✅ Upload Renewal (green, right)
   - ❌ NO "View History"
6. **Verify button colors:**
   - Blue for Renew Online
   - Green for Upload Renewal
7. **Test all button actions**

### Test 4: Button Hover States

**Documents:**
- Hover → Blue text + blue background (50%)

**View History (Active only):**
- Hover → Purple text + purple background (50%)

**Renew Online:**
- Hover → Darker blue background

**Upload Renewal:**
- Hover → Darker green background

### Test 5: Status Transitions

1. **Start with active permit**
2. **Verify:** Shows Documents + View History
3. **Manually change expiry date** to 10 days from now
4. **Refresh page**
5. **Verify:** Now shows Documents + Renew Online + Upload Renewal
6. **Change expiry date** to past date
7. **Refresh page**
8. **Verify:** Still shows Documents + Renew Online + Upload Renewal

---

## 📁 **Files Modified**

### 1. **PermitCard.tsx**
**Changes:**
- Added `onViewHistory` prop back
- Implemented conditional button rendering based on status
- View History button for `status === 'active'`
- Renew Online + Upload Renewal for `status === 'expiring' || status === 'expired'`
- Added comments explaining button logic
- Enhanced tooltips

**Lines:** 5-109

### 2. **PermitList.tsx**
**Changes:**
- Added `onViewHistory` prop to interface
- Passed `onViewHistory` to PermitCard

**Lines:** 6-61

### 3. **PermitsDashboard.tsx**
**Changes:**
- Re-added `onViewHistory` handler to PermitList
- History modal functionality restored
- `handleViewHistory` function active

**Lines:** 195-201

### 4. **Documentation**
**New Files:**
- ✅ `PERMITS_STATUS_BASED_BUTTONS.md` - This file

---

## 💡 **Business Logic**

### Why Different Buttons for Different Statuses?

**Active Permits:**
- No renewal needed yet
- Users want to view history for reference
- No action required, just informational access

**Expiring/Expired Permits:**
- Renewal action is urgent
- Users need clear path to renew
- Two-step process:
  1. Apply online (Renew Online button)
  2. Upload proof (Upload Renewal button)
- History is less important than immediate action

---

## 🎯 **Key Features**

### 1. Status-Aware Display
- Buttons automatically adjust based on permit status
- No manual configuration needed
- Status calculated from expiry date

### 2. Clear Visual Hierarchy
- Color coding indicates action priority
- Gray = informational
- Purple = historical reference
- Blue = external action
- Green = document submission

### 3. User-Friendly Workflow
- Active: Easy access to history
- Expiring/Expired: Clear renewal path
- Documents always accessible

### 4. Responsive Layout
- Desktop: Vertical button column
- Mobile: Horizontal button row
- All buttons remain accessible

---

## 🔧 **Technical Implementation**

### Status Calculation
```typescript
const status = calculateStatus(permit);
// Returns: 'active' | 'expiring' | 'expired' | 'superseded'

// Based on days until expiry:
// expired: < 0 days
// expiring: 1-30 days
// active: > 30 days
```

### Conditional Rendering
```tsx
{/* Active Permits */}
{status === 'active' && (
  <ViewHistoryButton />
)}

{/* Expiring/Expired Permits */}
{(status === 'expiring' || status === 'expired') && (
  <>
    <RenewOnlineButton />
    <UploadRenewalButton />
  </>
)}
```

---

## ✅ **Verification Checklist**

**Active Permits:**
- [x] Shows Documents button
- [x] Shows View History button
- [x] NO Renew Online button
- [x] NO Upload Renewal button
- [x] View History opens modal
- [x] Modal shows timeline

**Expiring Permits:**
- [x] Shows Documents button
- [x] Shows Renew Online button (if renewal_url)
- [x] Shows Upload Renewal button
- [x] NO View History button
- [x] Renew Online opens external site
- [x] Upload Renewal opens modal

**Expired Permits:**
- [x] Shows Documents button
- [x] Shows Renew Online button (if renewal_url)
- [x] Shows Upload Renewal button
- [x] NO View History button
- [x] Same functionality as expiring

**Visual Design:**
- [x] Documents: Gray with blue hover
- [x] View History: Gray with purple hover
- [x] Renew Online: Blue with darker hover
- [x] Upload Renewal: Green with darker hover
- [x] Proper spacing between buttons
- [x] Icons + text labels
- [x] Responsive on mobile

**Functionality:**
- [x] Status calculated correctly
- [x] Buttons show/hide based on status
- [x] All click handlers work
- [x] Modals open correctly
- [x] External links open in new tab

---

## 📊 **Summary**

**Problem:** All permits showed the same buttons regardless of status

**Solution:** Dynamic button display based on permit status

**Implementation:**
- ✅ Active permits: Documents + View History
- ✅ Expiring permits: Documents + Renew Online + Upload Renewal
- ✅ Expired permits: Documents + Renew Online + Upload Renewal

**Benefits:**
- Users see only relevant actions
- Clear workflow for renewals
- Less confusion
- Faster task completion
- Better user experience

**Technical:**
- Status-based conditional rendering
- Color-coded button system
- Proper prop passing through component tree
- History modal functionality restored
- All handlers working correctly

Status-based button logic is now fully implemented and tested! 🎉
