# Generated security app initial migration

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SecuritySettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password_min_length', models.PositiveIntegerField(default=12)),
                ('password_require_uppercase', models.BooleanField(default=True)),
                ('password_require_lowercase', models.BooleanField(default=True)),
                ('password_require_numbers', models.BooleanField(default=True)),
                ('password_require_symbols', models.BooleanField(default=True)),
                ('password_expiry_days', models.PositiveIntegerField(default=90)),
                ('max_login_attempts', models.PositiveIntegerField(default=5)),
                ('lockout_duration_minutes', models.PositiveIntegerField(default=30)),
                ('session_timeout_minutes', models.PositiveIntegerField(default=60)),
                ('force_https', models.BooleanField(default=True)),
                ('require_2fa_for_admin', models.BooleanField(default=True)),
                ('require_2fa_for_contributors', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Security Settings',
                'verbose_name_plural': 'Security Settings',
            },
        ),
        migrations.CreateModel(
            name='SecurityEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('login_success', 'Successful Login'), ('login_failure', 'Failed Login'), ('account_locked', 'Account Locked'), ('password_change', 'Password Changed'), ('permission_change', 'Permission Changed'), ('suspicious_activity', 'Suspicious Activity'), ('data_breach_attempt', 'Data Breach Attempt')], max_length=30)),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('description', models.TextField()),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('resolved', models.BooleanField(default=False)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='IPWhitelist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(unique=True)),
                ('description', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(
            model_name='securityevent',
            index=models.Index(fields=['event_type', 'severity'], name='security_se_event_t_b9e9c4_idx'),
        ),
        migrations.AddIndex(
            model_name='securityevent',
            index=models.Index(fields=['timestamp'], name='security_se_timesta_9c0f8e_idx'),
        ),
        migrations.AddIndex(
            model_name='securityevent',
            index=models.Index(fields=['ip_address'], name='security_se_ip_addr_7f8a9b_idx'),
        ),
    ]