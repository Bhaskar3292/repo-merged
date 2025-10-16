"""
Migration to add Organization model and organization scoping to User
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_temporary_user_and_location_assignment'),
    ]

    operations = [
        # Create Organization model
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True, help_text='Organization name')),
                ('slug', models.SlugField(max_length=255, unique=True, help_text='URL-friendly identifier')),
                ('is_active', models.BooleanField(default=True, help_text='Whether organization is active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'organizations',
                'ordering': ['name'],
            },
        ),

        # Add organization field to User
        migrations.AddField(
            model_name='user',
            name='organization',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='users',
                to='accounts.organization',
                help_text='Organization this user belongs to'
            ),
        ),

        # Add indexes
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['slug'], name='org_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['is_active'], name='org_active_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['organization'], name='user_org_idx'),
        ),
    ]
