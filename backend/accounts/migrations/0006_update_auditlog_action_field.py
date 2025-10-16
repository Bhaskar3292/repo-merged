"""
Migration to update AuditLog action field
- Increase max_length from 20 to 50 characters
- Add new action types: permission_updated, bulk_permission_update
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_remove_organization_org_slug_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                choices=[
                    ('login', 'Login'),
                    ('logout', 'Logout'),
                    ('login_failed', 'Login Failed'),
                    ('password_change', 'Password Change'),
                    ('password_reset', 'Password Reset'),
                    ('account_locked', 'Account Locked'),
                    ('account_unlocked', 'Account Unlocked'),
                    ('2fa_enabled', '2FA Enabled'),
                    ('2fa_disabled', '2FA Disabled'),
                    ('2fa_failed', '2FA Failed'),
                    ('permission_granted', 'Permission Granted'),
                    ('permission_revoked', 'Permission Revoked'),
                    ('permission_updated', 'Permission Updated'),
                    ('bulk_permission_update', 'Bulk Permission Update'),
                    ('user_created', 'User Created'),
                    ('user_updated', 'User Updated'),
                    ('user_deleted', 'User Deleted'),
                    ('role_changed', 'Role Changed'),
                ],
                max_length=50
            ),
        ),
    ]
