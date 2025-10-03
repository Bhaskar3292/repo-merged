# Generated migration to fix Location schema issues
# Removes address2 field if it exists
# Makes address fields nullable
# Adds phone and email fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0003_facilityprofile_alter_tank_options_and_more'),
    ]

    operations = [
        # Remove address2 field if it exists (from old schema)
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'facilities_location'
                    AND column_name = 'address2'
                ) THEN
                    ALTER TABLE facilities_location DROP COLUMN address2;
                END IF;
            END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Make address fields nullable
        migrations.AlterField(
            model_name='location',
            name='street_address',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='location',
            name='city',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='location',
            name='state',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='location',
            name='zip_code',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),

        # Add phone field
        migrations.AddField(
            model_name='location',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),

        # Add email field
        migrations.AddField(
            model_name='location',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
