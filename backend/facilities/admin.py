"""
Admin configuration for facilities app
"""
from django.contrib import admin
from .models import Location, LocationDashboard, DashboardSection, DashboardSectionData, Tank, Permit


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'address']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DashboardSection)
class DashboardSectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'section_type', 'order', 'is_active']
    list_filter = ['section_type', 'is_active']
    ordering = ['order', 'name']


@admin.register(LocationDashboard)
class LocationDashboardAdmin(admin.ModelAdmin):
    list_display = ['location', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DashboardSectionData)
class DashboardSectionDataAdmin(admin.ModelAdmin):
    list_display = ['dashboard', 'section', 'last_updated_by', 'updated_at']
    list_filter = ['section', 'updated_at']
    readonly_fields = ['updated_at']


@admin.register(Tank)
class TankAdmin(admin.ModelAdmin):
    list_display = ['label', 'location', 'product', 'status', 'size', 'tank_material']
    list_filter = ['status', 'location', 'tank_lined']
    search_fields = ['label', 'product', 'location__name', 'tank_material']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Permit)
class PermitAdmin(admin.ModelAdmin):
    list_display = ['permit_number', 'location', 'permit_type', 'status', 'expiry_date']
    list_filter = ['permit_type', 'status', 'expiry_date']
    search_fields = ['permit_number', 'location__name', 'issuing_authority']
    readonly_fields = ['created_at', 'updated_at']