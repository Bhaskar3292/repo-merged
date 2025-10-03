# Generated migration to synchronize Location schema with database
# This migration is idempotent and safe to run multiple times
# It checks for column existence before adding/modifying

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0003_facilityprofile_alter_tank_options_and_more'),
    ]

    operations = [
        # Operation 1: Remove address2 column if it exists (orphaned from old schema)
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'address2'
                ) THEN
                    ALTER TABLE facilities_location DROP COLUMN address2;
                END IF;
            END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Operation 2: Make address fields nullable (if they aren't already)
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                -- Make street_address nullable
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'street_address'
                    AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE facilities_location ALTER COLUMN street_address DROP NOT NULL;
                END IF;

                -- Make city nullable
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'city'
                    AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE facilities_location ALTER COLUMN city DROP NOT NULL;
                END IF;

                -- Make state nullable
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'state'
                    AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE facilities_location ALTER COLUMN state DROP NOT NULL;
                END IF;

                -- Make zip_code nullable
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'zip_code'
                    AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE facilities_location ALTER COLUMN zip_code DROP NOT NULL;
                END IF;
            END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Operation 3: Add phone field only if it doesn't exist
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'phone'
                ) THEN
                    ALTER TABLE facilities_location ADD COLUMN phone VARCHAR(20) NULL;
                END IF;
            END $$;
            """,
            reverse_sql="""
            ALTER TABLE facilities_location DROP COLUMN IF EXISTS phone;
            """,
        ),

        # Operation 4: Add email field only if it doesn't exist
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'facilities_location'
                    AND column_name = 'email'
                ) THEN
                    ALTER TABLE facilities_location ADD COLUMN email VARCHAR(254) NULL;
                END IF;
            END $$;
            """,
            reverse_sql="""
            ALTER TABLE facilities_location DROP COLUMN IF EXISTS email;
            """,
        ),
    ]
