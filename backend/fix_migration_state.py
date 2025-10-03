#!/usr/bin/env python3
"""
Migration State Fix Script
==========================

This script helps diagnose and fix Django migration state issues where:
- Database has columns that Django doesn't know about
- Migration history is out of sync with actual database schema
- Duplicate column errors when running migrations

Usage:
    python fix_migration_state.py --check      # Check current state
    python fix_migration_state.py --fix        # Mark migrations as applied
    python fix_migration_state.py --reset      # Reset to migration 0003 and re-apply
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import connection
from django.db.migrations.recorder import MigrationRecorder


def check_database_columns():
    """Check which columns exist in the database"""
    print("\n=== Database Schema Check ===")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'facilities_location'
            AND column_name IN ('phone', 'email', 'street_address', 'city', 'state', 'zip_code', 'address2')
            ORDER BY column_name;
        """)

        columns = cursor.fetchall()
        if columns:
            print("\nColumns in facilities_location table:")
            for col_name, data_type, is_nullable in columns:
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                print(f"  - {col_name}: {data_type} ({nullable})")
        else:
            print("\n  No relevant columns found!")

    # Check for orphaned columns
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'facilities_location'
            AND column_name = 'address2';
        """)
        if cursor.fetchone():
            print("\n  ⚠️  WARNING: 'address2' column exists (orphaned from old schema)")


def check_migration_history():
    """Check which migrations Django thinks are applied"""
    print("\n=== Migration History Check ===")

    recorder = MigrationRecorder(connection)
    applied = recorder.applied_migrations()

    facilities_migrations = [m for m in applied if m[0] == 'facilities']
    facilities_migrations.sort(key=lambda x: x[1])

    print("\nApplied migrations for 'facilities' app:")
    if facilities_migrations:
        for app, name in facilities_migrations:
            print(f"  [X] {name}")
    else:
        print("  No migrations recorded!")

    # Check if 0004 is applied
    if ('facilities', '0004_sync_location_schema') in applied:
        print("\n  ✅ Migration 0004_sync_location_schema is marked as applied")
    else:
        print("\n  ❌ Migration 0004_sync_location_schema is NOT marked as applied")

    return applied


def check_migration_files():
    """Check which migration files exist"""
    print("\n=== Migration Files Check ===")

    migrations_dir = os.path.join(os.path.dirname(__file__), 'facilities', 'migrations')
    if os.path.exists(migrations_dir):
        files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']
        files.sort()

        print("\nMigration files in facilities/migrations/:")
        for f in files:
            print(f"  - {f}")
    else:
        print("\n  ❌ Migrations directory not found!")


def mark_migration_as_applied(app_name, migration_name):
    """Mark a specific migration as applied"""
    recorder = MigrationRecorder(connection)

    # Check if already applied
    if (app_name, migration_name) in recorder.applied_migrations():
        print(f"\n  ℹ️  Migration {migration_name} is already marked as applied")
        return False

    # Mark as applied
    recorder.record_applied(app_name, migration_name)
    print(f"\n  ✅ Marked {migration_name} as applied")
    return True


def fix_migration_state():
    """
    Fix migration state by marking migrations as applied if:
    - Columns exist in database
    - Migration file exists
    - Migration not marked as applied
    """
    print("\n=== Fixing Migration State ===")

    # Check if phone and email columns exist
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = 'facilities_location'
            AND column_name IN ('phone', 'email');
        """)
        count = cursor.fetchone()[0]

        if count == 2:
            print("\n  ✅ Both 'phone' and 'email' columns exist in database")

            # Check if migration 0004 exists
            migration_file = os.path.join(
                os.path.dirname(__file__),
                'facilities/migrations/0004_sync_location_schema.py'
            )

            if os.path.exists(migration_file):
                print("  ✅ Migration file 0004_sync_location_schema.py exists")

                # Mark as applied
                result = mark_migration_as_applied('facilities', '0004_sync_location_schema')

                if result:
                    print("\n  🎉 Migration state fixed!")
                    print("  You can now run: python manage.py migrate")
                else:
                    print("\n  ℹ️  No changes needed - migration already applied")
            else:
                print("  ❌ Migration file 0004_sync_location_schema.py not found!")
        else:
            print(f"\n  ⚠️  Expected 2 columns (phone, email), found {count}")
            print("  Database schema doesn't match expected state")
            print("  Run: python manage.py migrate facilities")


def reset_and_reapply():
    """
    Reset to migration 0003 and re-apply 0004
    This is a more aggressive fix
    """
    print("\n=== Reset and Re-apply Migrations ===")
    print("This will:")
    print("  1. Mark 0004 as NOT applied")
    print("  2. Re-run migration 0004 (which will skip existing columns)")

    response = input("\nContinue? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted.")
        return

    recorder = MigrationRecorder(connection)

    # Remove 0004 from history
    if ('facilities', '0004_sync_location_schema') in recorder.applied_migrations():
        recorder.record_unapplied('facilities', '0004_sync_location_schema')
        print("\n  ✅ Removed 0004_sync_location_schema from migration history")

    print("\n  Now run: python manage.py migrate facilities")
    print("  The migration will check for existing columns and skip them")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Fix Django migration state issues')
    parser.add_argument('--check', action='store_true', help='Check current state')
    parser.add_argument('--fix', action='store_true', help='Fix migration state')
    parser.add_argument('--reset', action='store_true', help='Reset and re-apply migrations')

    args = parser.parse_args()

    if args.check:
        check_migration_files()
        check_database_columns()
        check_migration_history()
    elif args.fix:
        check_migration_files()
        check_database_columns()
        check_migration_history()
        fix_migration_state()
    elif args.reset:
        reset_and_reapply()
    else:
        # Default: show everything
        print("Django Migration State Diagnostic Tool")
        print("=" * 50)
        check_migration_files()
        check_database_columns()
        check_migration_history()

        print("\n" + "=" * 50)
        print("Available commands:")
        print("  --check  : Check current state (same as running with no args)")
        print("  --fix    : Automatically fix migration state")
        print("  --reset  : Reset to 0003 and re-apply 0004")


if __name__ == '__main__':
    main()
