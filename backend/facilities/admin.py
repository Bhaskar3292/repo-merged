"""
Admin configuration for facilities app
"""
from django.contrib import admin
from .models import Location, LocationDashboard, DashboardSection, DashboardSectionData, Tank, Permit, FacilityProfile, CommanderInfo


@admin.register(FacilityProfile)
class FacilityProfileAdmin(admin.ModelAdmin):
    list_display = ['location', 'gas_brand', 'insured', 'created_at']
    list_filter = ['insured', 'gas_brand', 'created_at']
    search_fields = ['location__name', 'internal_id', 'state_id_number']
    readonly_fields = ['created_at', 'updated_at']
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


@admin.register(CommanderInfo)
class CommanderInfoAdmin(admin.ModelAdmin):
    list_display = ['location', 'commander_type', 'serial_number', 'asm_subscription', 'issue_date', 'expiry_date']
    list_filter = ['asm_subscription', 'issue_date', 'expiry_date']
    search_fields = ['location__name', 'commander_type', 'serial_number']
    readonly_fields = ['created_at', 'updated_at']