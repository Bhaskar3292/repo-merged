# Generated migration for dynamic permit upload path

from django.db import migrations, models
import permits.models


class Migration(migrations.Migration):

    dependencies = [
        ('permits', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='permit',
            name='document',
            field=models.FileField(blank=True, null=True, upload_to=permits.models.permit_upload_path),
        ),
    ]
