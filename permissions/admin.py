"""
Admin configuration for permissions app
"""
from django.contrib import admin
from .models import PermissionCategory, Permission, RolePermission, UserPermission


@admin.register(PermissionCategory)
class PermissionCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    ordering = ['order', 'name']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'permission_type', 'admin_default', 'contributor_default', 'viewer_default']
    list_filter = ['category', 'permission_type']
    search_fields = ['name', 'code', 'description']
    ordering = ['category__order', 'name']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'is_granted']
    list_filter = ['role', 'is_granted', 'permission__category']
    search_fields = ['permission__name', 'permission__code']


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'permission', 'is_granted']
    list_filter = ['is_granted', 'permission__category']
    search_fields = ['user__username', 'permission__name', 'permission__code']