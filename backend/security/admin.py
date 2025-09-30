"""
Admin configuration for security app
"""
from django.contrib import admin
from .models import SecurityEvent, IPWhitelist, SecuritySettings


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'severity', 'user', 'ip_address', 'timestamp', 'resolved']
    list_filter = ['event_type', 'severity', 'resolved', 'timestamp']
    search_fields = ['user__username', 'ip_address', 'description']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False  # Security events should only be created programmatically


@admin.register(IPWhitelist)
class IPWhitelistAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'description', 'created_by', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['ip_address', 'description']
    readonly_fields = ['created_at']


@admin.register(SecuritySettings)
class SecuritySettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Password Policy', {
            'fields': (
                'password_min_length',
                'password_require_uppercase',
                'password_require_lowercase', 
                'password_require_numbers',
                'password_require_symbols',
                'password_expiry_days'
            )
        }),
        ('Account Security', {
            'fields': (
                'max_login_attempts',
                'lockout_duration_minutes',
                'session_timeout_minutes',
                'force_https'
            )
        }),
        ('Two-Factor Authentication', {
            'fields': (
                'require_2fa_for_admin',
                'require_2fa_for_contributors'
            )
        }),
    )
    
    def has_add_permission(self, request):
        return not SecuritySettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False