"""
Admin configuration for accounts app
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, AuditLog, LoginAttempt


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin with role-based fields
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'two_factor_status', 'account_status', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'two_factor_enabled', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'last_password_change']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Permissions', {
            'fields': ('role',)
        }),
        ('Security Information', {
            'fields': ('two_factor_enabled', 'failed_login_attempts', 'account_locked_until', 'last_login_ip')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_password_change')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Information', {
            'fields': ('email', 'first_name', 'last_name', 'role')
        }),
    )
    
    def two_factor_status(self, obj):
        if obj.two_factor_enabled:
            return format_html('<span style="color: green;">✓ Enabled</span>')
        return format_html('<span style="color: red;">✗ Disabled</span>')
    two_factor_status.short_description = '2FA Status'
    
    def account_status(self, obj):
        if obj.is_account_locked():
            return format_html('<span style="color: red;">🔒 Locked</span>')
        elif obj.failed_login_attempts > 0:
            return format_html('<span style="color: orange;">⚠️ {} failed attempts</span>', obj.failed_login_attempts)
        return format_html('<span style="color: green;">✓ Normal</span>')
    account_status.short_description = 'Account Status'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for audit logs
    """
    list_display = ['user', 'action', 'description', 'ip_address', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'description', 'ip_address']
    readonly_fields = ['user', 'action', 'description', 'ip_address', 'user_agent', 'timestamp', 'metadata']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False  # Audit logs should only be created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Audit logs should be immutable
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # Only superusers can delete audit logs


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    """
    Admin interface for login attempts
    """
    list_display = ['username', 'ip_address', 'success', 'timestamp']
    list_filter = ['success', 'timestamp']
    search_fields = ['username', 'ip_address']
    readonly_fields = ['username', 'ip_address', 'success', 'timestamp', 'user_agent']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False  # Login attempts should only be created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Login attempts should be immutable