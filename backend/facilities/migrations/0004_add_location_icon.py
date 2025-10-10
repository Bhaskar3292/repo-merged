# Generated migration for adding icon field to Location model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0003_commanderinfo'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='icon',
            field=models.CharField(blank=True, default='factory.svg', help_text='Filename of the location icon', max_length=100),
        ),
    ]
