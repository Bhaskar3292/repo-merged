from django.contrib import admin
from .models import Permit, PermitHistory


@admin.register(Permit)
class PermitAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'facility', 'expiry_date', 'is_active', 'status', 'created_at']
    list_filter = ['is_active', 'expiry_date', 'created_at']
    search_fields = ['name', 'number', 'issued_by', 'facility__name']
    readonly_fields = ['status', 'document_url', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'number', 'issued_by')
        }),
        ('Dates', {
            'fields': ('issue_date', 'expiry_date')
        }),
        ('Status & Versioning', {
            'fields': ('is_active', 'status', 'parent_permit')
        }),
        ('Documents & URLs', {
            'fields': ('document', 'document_url', 'renewal_url')
        }),
        ('Associations', {
            'fields': ('facility', 'uploaded_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PermitHistory)
class PermitHistoryAdmin(admin.ModelAdmin):
    list_display = ['permit', 'action', 'user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['permit__number', 'permit__name', 'action', 'notes']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
