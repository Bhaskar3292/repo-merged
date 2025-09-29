"""
User models with role-based access control
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import pyotp


class User(AbstractUser):
    """
    Custom User model with role-based access control
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('contributor', 'Contributor'),
        ('viewer', 'Viewer'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='viewer',
        help_text='User role determines access permissions'
    )
    
    # Two-Factor Authentication
    two_factor_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True)
    backup_codes = models.JSONField(default=list, blank=True)
    
    # Account Security
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)
    force_password_change = models.BooleanField(default=False)
    
    # Security tracking
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    login_attempts_today = models.PositiveIntegerField(default=0)
    last_attempt_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user'
        
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save(update_fields=['account_locked_until'])
    
    def unlock_account(self):
        """Unlock account and reset failed attempts"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['account_locked_until', 'failed_login_attempts'])
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock if threshold reached"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lock_account()
        self.save(update_fields=['failed_login_attempts'])
    
    def reset_failed_login(self):
        """Reset failed login attempts on successful login"""
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])
    
    def generate_totp_secret(self):
        """Generate TOTP secret for 2FA"""
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
            self.save(update_fields=['totp_secret'])
        return self.totp_secret
    
    def get_totp_uri(self):
        """Get TOTP URI for QR code generation"""
        if not self.totp_secret:
            self.generate_totp_secret()
        
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email or self.username,
            issuer_name="Facility Management System"
        )
    
    def verify_totp(self, token):
        """Verify TOTP token"""
        if not self.totp_secret:
            return False
        
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token, valid_window=1)
    
    def generate_backup_codes(self):
        """Generate backup codes for 2FA"""
        import secrets
        codes = [secrets.token_hex(4).upper() for _ in range(10)]
        self.backup_codes = codes
        self.save(update_fields=['backup_codes'])
        return codes
    
    def use_backup_code(self, code):
        """Use a backup code and remove it from available codes"""
        if code.upper() in self.backup_codes:
            self.backup_codes.remove(code.upper())
            self.save(update_fields=['backup_codes'])
            return True
        return False
    
    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_contributor(self):
        return self.role == 'contributor' or self.is_superuser
    
    @property
    def is_viewer(self):
        return self.role == 'viewer' and not self.is_superuser
    
    def can_create_users(self):
        return self.is_admin or self.is_superuser
    
    def can_edit_facility(self, facility=None):
        if self.is_admin or self.is_superuser:
            return True
        if self.is_contributor:
            return True
        return False
    
    def can_delete_facility(self, facility=None):
        return self.is_admin or self.is_superuser
    
    def can_view_facility(self, facility=None):
        return True  # All authenticated users can view


class AuditLog(models.Model):
    """
    Audit log for tracking security-related actions
    """
    ACTION_TYPES = [
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
        ('user_created', 'User Created'),
        ('user_updated', 'User Updated'),
        ('user_deleted', 'User Deleted'),
        ('role_changed', 'Role Changed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Additional context data
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        username = self.user.username if self.user else 'Anonymous'
        return f"{username} - {self.get_action_display()} at {self.timestamp}"


class LoginAttempt(models.Model):
    """
    Track login attempts for rate limiting and security monitoring
    """
    username = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField()
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['username', 'ip_address']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.username} - {status} from {self.ip_address}"