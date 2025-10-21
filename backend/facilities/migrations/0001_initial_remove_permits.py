# Generated migration to remove Permit model

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        # Drop the permits table if it exists
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS facilities_permit CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
