"""
Security-related models
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SecurityEvent(models.Model):
    """
    Security events for monitoring and alerting
    """
    EVENT_TYPES = [
        ('login_success', 'Successful Login'),
        ('login_failure', 'Failed Login'),
        ('account_locked', 'Account Locked'),
        ('password_change', 'Password Changed'),
        ('permission_change', 'Permission Changed'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('data_breach_attempt', 'Data Breach Attempt'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS, default='medium')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', 'severity']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.severity} - {self.timestamp}"


class IPWhitelist(models.Model):
    """
    IP addresses that are whitelisted for admin access
    """
    ip_address = models.GenericIPAddressField(unique=True)
    description = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.ip_address} - {self.description}"


class SecuritySettings(models.Model):
    """
    Global security settings
    """
    # Password policy
    password_min_length = models.PositiveIntegerField(default=12)
    password_require_uppercase = models.BooleanField(default=True)
    password_require_lowercase = models.BooleanField(default=True)
    password_require_numbers = models.BooleanField(default=True)
    password_require_symbols = models.BooleanField(default=True)
    password_expiry_days = models.PositiveIntegerField(default=90)
    
    # Account lockout
    max_login_attempts = models.PositiveIntegerField(default=5)
    lockout_duration_minutes = models.PositiveIntegerField(default=30)
    
    # Session security
    session_timeout_minutes = models.PositiveIntegerField(default=60)
    force_https = models.BooleanField(default=True)
    
    # 2FA requirements
    require_2fa_for_admin = models.BooleanField(default=True)
    require_2fa_for_contributors = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Security Settings'
        verbose_name_plural = 'Security Settings'
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SecuritySettings.objects.exists():
            raise ValueError('Only one SecuritySettings instance is allowed')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create security settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings