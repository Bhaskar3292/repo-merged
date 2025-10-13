"""
Migration to add temporary user support and location-based access control
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('facilities', '0004_add_location_icon'),
    ]

    operations = [
        # Add user_type field
        migrations.AddField(
            model_name='user',
            name='user_type',
            field=models.CharField(
                choices=[('permanent', 'Permanent'), ('temporary', 'Temporary')],
                default='permanent',
                max_length=20,
                help_text='User account type'
            ),
        ),

        # Add expires_at field for temporary users
        migrations.AddField(
            model_name='user',
            name='expires_at',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='Expiration datetime for temporary users',
                db_index=True
            ),
        ),

        # Add is_expired flag for quick checks
        migrations.AddField(
            model_name='user',
            name='is_expired',
            field=models.BooleanField(
                default=False,
                help_text='Whether the temporary user has expired',
                db_index=True
            ),
        ),

        # Create UserLocation junction table for many-to-many relationship
        migrations.CreateModel(
            name='UserLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(
                    null=True,
                    blank=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='location_assignments_created',
                    to='accounts.user'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='user_locations',
                    to='accounts.user'
                )),
                ('location', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='location_users',
                    to='facilities.location'
                )),
            ],
            options={
                'db_table': 'user_locations',
                'unique_together': {('user', 'location')},
                'indexes': [
                    models.Index(fields=['user'], name='ul_user_idx'),
                    models.Index(fields=['location'], name='ul_location_idx'),
                ],
            },
        ),

        # Add index on user_type for efficient filtering
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['user_type'], name='user_type_idx'),
        ),

        # Add composite index for expired temporary users
        migrations.AddIndex(
            model_name='user',
            index=models.Index(
                fields=['user_type', 'is_expired', 'expires_at'],
                name='user_exp_check_idx'
            ),
        ),
    ]
