# Permanent Fix for DuplicateColumn Migration Errors

## Problem Summary

**Error**:
```
psycopg2.errors.DuplicateColumn: column "email" of relation "facilities_location" already exists
```

**Root Cause**:
This error occurs when there's a mismatch between:
1. **Database Reality**: Columns (`phone`, `email`) already exist in the database
2. **Django's Knowledge**: Migration history table doesn't reflect that these columns were added
3. **Migration Code**: Django tries to add columns that already exist

This creates a **migration deadlock** where:
- You can't run migrations (they fail with DuplicateColumn error)
- You can't rollback (columns are already there)
- Django thinks the schema is out of sync

## Understanding the Problem

### Three Sources of Truth

| Source | What It Tracks | Current State |
|--------|---------------|---------------|
| **Database Schema** | Actual columns in PostgreSQL | `phone`, `email` exist |
| **Django Models** | Python model definitions | `phone`, `email` defined |
| **Migration History** | What Django thinks is applied | May or may not show 0004 applied |

**The Problem**: These three are out of sync!

### How This Happens

**Scenario 1: Manual Database Changes**
```sql
-- Someone manually added columns
ALTER TABLE facilities_location ADD COLUMN phone VARCHAR(20);
ALTER TABLE facilities_location ADD COLUMN email VARCHAR(254);
-- But no migration was created or recorded
```

**Scenario 2: Partial Migration Failure**
```python
# Migration started...
migrations.AddField('location', 'phone', ...)  # ✅ Succeeded
migrations.AddField('location', 'email', ...)  # ❌ Failed (other error)
# Django marked migration as failed, but phone column was added
```

**Scenario 3: Multiple Migrations Trying Same Thing**
```python
# Migration 0004: tries to add phone, email
# Migration 0005: also tries to add phone, email (auto-generated)
# One succeeds, the other fails
```

**Scenario 4: Database Restored from Backup**
```bash
# Database restored with phone/email columns
# But migration history table shows older state
```

## The Permanent Solution

### ✅ Current State Analysis

**Migration Files Present**:
```
facilities/migrations/
├── 0001_initial.py
├── 0002_remove_location_address_location_city_and_more.py
├── 0003_facilityprofile_alter_tank_options_and_more.py
└── 0004_sync_location_schema.py  ← This is GOOD (idempotent)
```

**0004_sync_location_schema.py** is already correctly written with idempotent checks:
```python
# Operation 3: Add phone field only if it doesn't exist
migrations.RunSQL(
    sql="""
    IF NOT EXISTS (column 'phone') THEN
        ALTER TABLE facilities_location ADD COLUMN phone VARCHAR(20) NULL;
    END IF;
    """
)

# Operation 4: Add email field only if it doesn't exist
migrations.RunSQL(
    sql="""
    IF NOT EXISTS (column 'email') THEN
        ALTER TABLE facilities_location ADD COLUMN email VARCHAR(254) NULL;
    END IF;
    """
)
```

**This means**:
- ✅ The migration file is correct
- ✅ It has proper existence checks
- ✅ It's safe to run multiple times
- ❌ But Django might not know it's been applied

### Solution Options

## Option 1: Auto-Fix with Diagnostic Script (RECOMMENDED)

### Step 1: Run Diagnostic

```bash
cd backend
python fix_migration_state.py --check
```

**Expected Output**:
```
=== Migration Files Check ===
Migration files in facilities/migrations/:
  - 0001_initial.py
  - 0002_remove_location_address_location_city_and_more.py
  - 0003_facilityprofile_alter_tank_options_and_more.py
  - 0004_sync_location_schema.py

=== Database Schema Check ===
Columns in facilities_location table:
  - city: character varying (NULL)
  - email: character varying (NULL)
  - phone: character varying (NULL)
  - state: character varying (NULL)
  - street_address: character varying (NULL)
  - zip_code: character varying (NULL)

=== Migration History Check ===
Applied migrations for 'facilities' app:
  [X] 0001_initial
  [X] 0002_remove_location_address_location_city_and_more
  [X] 0003_facilityprofile_alter_tank_options_and_more
  ❌ Migration 0004_sync_location_schema is NOT marked as applied
```

### Step 2: Fix Migration State

If columns exist but migration not marked as applied:

```bash
python fix_migration_state.py --fix
```

**What This Does**:
1. Checks if `phone` and `email` columns exist in database
2. Checks if migration file `0004_sync_location_schema.py` exists
3. If both true, marks migration as applied in Django's history
4. Syncs Django's knowledge with database reality

**Expected Output**:
```
=== Fixing Migration State ===
  ✅ Both 'phone' and 'email' columns exist in database
  ✅ Migration file 0004_sync_location_schema.py exists
  ✅ Marked 0004_sync_location_schema as applied
  🎉 Migration state fixed!
  You can now run: python manage.py migrate
```

### Step 3: Verify Fix

```bash
python manage.py showmigrations facilities
```

**Expected Output**:
```
facilities
 [X] 0001_initial
 [X] 0002_remove_location_address_location_city_and_more
 [X] 0003_facilityprofile_alter_tank_options_and_more
 [X] 0004_sync_location_schema  ← Now marked as applied
```

### Step 4: Test Migration System

```bash
python manage.py migrate facilities
```

**Expected Output**:
```
Operations to perform:
  Apply all migrations: facilities
Running migrations:
  No migrations to apply.  ← Perfect!
```

## Option 2: Reset and Re-apply (If Option 1 Doesn't Work)

If the auto-fix doesn't work or you want a clean slate:

### Step 1: Reset Migration History

```bash
python fix_migration_state.py --reset
```

**What This Does**:
1. Removes migration 0004 from Django's history
2. But keeps database columns intact
3. Allows you to re-run migration 0004

**Expected Output**:
```
=== Reset and Re-apply Migrations ===
This will:
  1. Mark 0004 as NOT applied
  2. Re-run migration 0004 (which will skip existing columns)

Continue? (yes/no): yes

  ✅ Removed 0004_sync_location_schema from migration history
  Now run: python manage.py migrate facilities
```

### Step 2: Re-apply Migration

```bash
python manage.py migrate facilities
```

**What Happens**:
```
Running migrations:
  Applying facilities.0004_sync_location_schema... OK
```

**Behind the Scenes**:
```sql
-- Migration checks: "Does phone column exist?"
-- Answer: YES
-- Action: Skip adding phone

-- Migration checks: "Does email column exist?"
-- Answer: YES
-- Action: Skip adding email

-- Result: Migration succeeds without errors!
```

## Option 3: Manual Database Fix (Last Resort)

Only use this if Options 1 and 2 don't work.

### Step 1: Check Current State

```bash
python manage.py dbshell
```

```sql
-- Check which columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'facilities_location'
AND column_name IN ('phone', 'email');
```

### Step 2: Verify Migration History

```sql
-- Check what Django thinks is applied
SELECT app, name
FROM django_migrations
WHERE app = 'facilities'
ORDER BY id;
```

### Step 3: Manually Mark Migration as Applied

```sql
-- Only do this if columns exist AND migration file exists
INSERT INTO django_migrations (app, name, applied)
VALUES ('facilities', '0004_sync_location_schema', NOW());
```

### Step 4: Verify

```bash
python manage.py showmigrations facilities
```

## Preventing Future Issues

### Best Practices

#### 1. Always Use Idempotent Migrations

**❌ Bad (Not Idempotent)**:
```python
migrations.AddField('location', 'phone', ...)
# Fails if column already exists
```

**✅ Good (Idempotent)**:
```python
migrations.RunSQL("""
    IF NOT EXISTS (column check) THEN
        ADD COLUMN phone
    END IF;
""")
# Safe to run multiple times
```

#### 2. Never Manually Modify Database

**❌ Don't Do This**:
```sql
-- Direct SQL without migration
ALTER TABLE facilities_location ADD COLUMN new_field VARCHAR(100);
```

**✅ Do This Instead**:
```bash
# 1. Add field to model
# 2. Create migration
python manage.py makemigrations
# 3. Apply migration
python manage.py migrate
```

#### 3. Always Check Migration State Before Changes

```bash
# Before making any changes
python fix_migration_state.py --check
```

#### 4. Test Migrations Multiple Times

```bash
# Test idempotency
python manage.py migrate facilities 0003  # Rollback
python manage.py migrate facilities 0004  # Re-apply
python manage.py migrate facilities 0004  # Run again (should be no-op)
```

#### 5. Keep Migration Files in Version Control

```bash
git add facilities/migrations/0004_sync_location_schema.py
git commit -m "Add idempotent location schema sync migration"
```

#### 6. Document Migration Dependencies

In migration file:
```python
"""
This migration:
- Removes orphaned 'address2' column if exists
- Makes address fields nullable
- Adds phone and email fields if they don't exist

Idempotent: YES - Safe to run multiple times
Dependencies: 0003_facilityprofile_alter_tank_options_and_more
"""
```

## Diagnostic Commands

### Check Database Schema

```bash
python manage.py dbshell
```

```sql
-- List all columns in facilities_location
\d facilities_location

-- Check specific columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'facilities_location';

-- Check for orphaned columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'facilities_location'
AND column_name IN ('address2', 'phone', 'email');
```

### Check Migration History

```bash
# Show all migrations and their status
python manage.py showmigrations

# Show only facilities migrations
python manage.py showmigrations facilities

# Show with more detail
python manage.py showmigrations --plan facilities
```

### Check Migration Files

```bash
# List migration files
ls -la facilities/migrations/

# Search for specific migrations
find facilities/migrations/ -name "*phone*" -o -name "*email*"

# Check migration content
cat facilities/migrations/0004_sync_location_schema.py
```

## Understanding Django Migration History

### The django_migrations Table

Django tracks applied migrations in a database table:

```sql
-- View migration history
SELECT * FROM django_migrations WHERE app = 'facilities';
```

**Schema**:
```
id | app        | name                                    | applied
---+------------+-----------------------------------------+-------------------------
1  | facilities | 0001_initial                            | 2025-09-30 12:00:00
2  | facilities | 0002_remove_location_address_...        | 2025-09-30 12:01:00
3  | facilities | 0003_facilityprofile_alter_tank_...    | 2025-09-30 12:02:00
4  | facilities | 0004_sync_location_schema               | 2025-10-03 16:30:00
```

**Key Points**:
- ✅ Each row = one applied migration
- ✅ `applied` timestamp = when Django ran it
- ✅ Order matters (id column)
- ⚠️ This table can get out of sync with actual database schema

### Why Migrations Fail

**Scenario: Table Says Not Applied, But Columns Exist**

```
django_migrations table:
  - 0001_initial ✓
  - 0002_... ✓
  - 0003_... ✓
  - 0004_sync_location_schema ✗  ← Not recorded

Database reality:
  - phone column EXISTS
  - email column EXISTS

Result when running migrate:
  Django: "I should apply 0004"
  0004: "Let me add phone column"
  PostgreSQL: "❌ Column already exists!"
```

## Troubleshooting

### Issue 1: Migration Shows as Applied But Columns Missing

**Symptoms**:
```bash
python manage.py showmigrations facilities
# Shows [X] 0004_sync_location_schema

# But in database:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'facilities_location' AND column_name = 'phone';
# Returns 0 rows
```

**Cause**: Migration marked as applied but never actually ran successfully.

**Solution**:
```bash
# Remove from migration history and re-apply
python fix_migration_state.py --reset
python manage.py migrate facilities
```

### Issue 2: Can't Rollback Migration

**Error**:
```
Cannot reverse this migration
```

**Cause**: Migration uses `RunSQL` with `reverse_sql=noop` or `reverse_sql` that doesn't work.

**Solution**:
```bash
# Manually rollback in database
python manage.py dbshell
```

```sql
-- Drop columns manually
ALTER TABLE facilities_location DROP COLUMN IF EXISTS phone;
ALTER TABLE facilities_location DROP COLUMN IF EXISTS email;
```

```bash
# Remove from migration history
python manage.py migrate facilities 0003
```

### Issue 3: Multiple Migrations Trying to Add Same Column

**Symptoms**:
- Multiple migration files (0004, 0005, 0006) all trying to add phone/email
- Each one fails with DuplicateColumn

**Solution**:
```bash
# 1. Keep only the first idempotent one (0004)
rm facilities/migrations/0005_*.py
rm facilities/migrations/0006_*.py

# 2. Clear cache
rm -rf facilities/migrations/__pycache__/

# 3. Fix migration state
python fix_migration_state.py --fix
```

### Issue 4: Auto-generated Migrations Keep Appearing

**Symptoms**:
```bash
python manage.py makemigrations
# Creates new migration trying to add phone/email again
```

**Cause**: Django's migration detector doesn't see the fields in the migration history properly.

**Solution**:
```bash
# 1. Ensure migration 0004 is marked as applied
python fix_migration_state.py --fix

# 2. Try makemigrations again
python manage.py makemigrations
# Should say: No changes detected
```

### Issue 5: Different Behavior in Different Environments

**Symptoms**:
- Works fine in development
- Fails in production with DuplicateColumn error

**Cause**: Migration history differs between environments.

**Solution**:
```bash
# In production environment

# 1. Check state
python fix_migration_state.py --check

# 2. Compare with development
# Database columns should match
# Migration history should match

# 3. Sync production state
python fix_migration_state.py --fix
```

## Files Reference

### Created Files

✅ **`backend/fix_migration_state.py`** (NEW)
- Diagnostic script to check migration state
- Auto-fix migration history
- Reset and re-apply options
- Usage:
  ```bash
  python fix_migration_state.py --check   # Diagnose
  python fix_migration_state.py --fix     # Auto-fix
  python fix_migration_state.py --reset   # Reset
  ```

### Existing Files

✅ **`backend/facilities/migrations/0004_sync_location_schema.py`** (EXISTS)
- Already properly idempotent
- Has existence checks for all operations
- Safe to run multiple times
- No changes needed

✅ **`backend/facilities/models.py`** (UPDATED PREVIOUSLY)
- Already has `phone` and `email` fields
- Fields are `null=True, blank=True`
- No changes needed

✅ **`backend/facilities/serializers.py`** (UPDATED PREVIOUSLY)
- Already includes `phone` and `email` in fields list
- No changes needed

### Files to Check/Remove

❌ **Any `0005_*.py` migrations** (REMOVE IF EXISTS)
```bash
# Check for them
ls facilities/migrations/0005_*.py

# Remove if found
rm facilities/migrations/0005_*.py
rm facilities/migrations/__pycache__/0005_*.pyc
```

❌ **Any `0006_*.py` migrations** (REMOVE IF EXISTS)
```bash
rm facilities/migrations/0006_*.py
rm facilities/migrations/__pycache__/0006_*.pyc
```

## Quick Reference

### Problem → Solution Matrix

| Problem | Solution |
|---------|----------|
| Columns exist, migration not applied | `python fix_migration_state.py --fix` |
| DuplicateColumn error | `python fix_migration_state.py --reset` + migrate |
| Multiple migrations for same column | Delete extras, keep 0004 only |
| Auto-generated migrations | Mark existing migration as applied |
| Can't rollback | Manually drop columns in database |
| Different env behavior | Check and sync migration history |

### Command Cheat Sheet

```bash
# Diagnostics
python fix_migration_state.py --check
python manage.py showmigrations facilities
python manage.py dbshell  # then \d facilities_location

# Fixes
python fix_migration_state.py --fix        # Auto-fix
python fix_migration_state.py --reset      # Reset and re-apply
python manage.py migrate facilities        # Apply migrations

# Cleanup
rm facilities/migrations/0005_*.py         # Remove duplicate migrations
rm -rf facilities/migrations/__pycache__/  # Clear cache

# Verification
python manage.py makemigrations            # Should say "No changes"
python manage.py migrate                   # Should say "No migrations to apply"
```

## Summary

The DuplicateColumn error occurs when Django's migration history is out of sync with the actual database schema. The permanent fix involves:

✅ **Keeping the Idempotent Migration (0004)** - Already correctly written with existence checks
✅ **Using the Diagnostic Script** - Auto-detect and fix migration state mismatches
✅ **Removing Duplicate Migrations** - Delete any 0005, 0006, etc. trying to add same columns
✅ **Syncing Migration History** - Ensure Django knows what's actually in the database
✅ **Following Best Practices** - Always use idempotent migrations, never manual database changes

**The fix is already in place** - `0004_sync_location_schema.py` is properly idempotent. The issue is just syncing Django's knowledge with database reality, which the diagnostic script handles automatically.

---

**Last Updated**: October 3, 2025
**Status**: ✅ Complete solution provided
**Key File**: `backend/fix_migration_state.py` (diagnostic and fix script)
**Key Migration**: `0004_sync_location_schema.py` (idempotent, no changes needed)
