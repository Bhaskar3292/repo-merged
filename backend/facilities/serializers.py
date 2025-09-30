"""
Serializers for facility management
"""
from rest_framework import serializers
from .models import (
    Location, LocationDashboard, DashboardSection, DashboardSectionData, 
    Tank, Permit, FacilityContact, OperatingHours
)


class FacilityContactSerializer(serializers.ModelSerializer):
    """
    Serializer for FacilityContact model
    """
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)
    
    class Meta:
        model = FacilityContact
        fields = ['id', 'contact_type', 'contact_type_display', 'name', 'title', 
                 'phone', 'email', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class OperatingHoursSerializer(serializers.ModelSerializer):
    """
    Serializer for OperatingHours model
    """
    class Meta:
        model = OperatingHours
        fields = ['id', 'monday_open', 'monday_close', 'tuesday_open', 'tuesday_close',
                 'wednesday_open', 'wednesday_close', 'thursday_open', 'thursday_close',
                 'friday_open', 'friday_close', 'saturday_open', 'saturday_close',
                 'sunday_open', 'sunday_close', 'holiday_hours', 'notes',
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tank_count = serializers.SerializerMethodField()
    permit_count = serializers.SerializerMethodField()
    contacts = FacilityContactSerializer(many=True, read_only=True)
    operating_hours = OperatingHoursSerializer(read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'street_address', 'city', 'state', 'county',
                 'zip_code', 'country', 'facility_type', 'operational_status', 'capacity',
                 'description', 'created_by', 
                 'created_by_username', 'created_at', 'updated_at', 'is_active',
                 'tank_count', 'permit_count', 'contacts', 'operating_hours']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_tank_count(self, obj):
        return obj.tanks.count()
    
    def get_permit_count(self, obj):
        return obj.permits.count()


class DashboardSectionSerializer(serializers.ModelSerializer):
    """
    Serializer for DashboardSection model
    """
    class Meta:
        model = DashboardSection
        fields = ['id', 'name', 'section_type', 'order', 'is_active', 'field_schema']


class DashboardSectionDataSerializer(serializers.ModelSerializer):
    """
    Serializer for DashboardSectionData model
    """
    section_name = serializers.CharField(source='section.name', read_only=True)
    section_type = serializers.CharField(source='section.section_type', read_only=True)
    field_schema = serializers.JSONField(source='section.field_schema', read_only=True)
    last_updated_by_username = serializers.CharField(source='last_updated_by.username', read_only=True)
    
    class Meta:
        model = DashboardSectionData
        fields = ['id', 'section', 'section_name', 'section_type', 'field_schema', 
                 'data', 'last_updated_by', 'last_updated_by_username', 'updated_at']
        read_only_fields = ['last_updated_by', 'updated_at']


class LocationDashboardSerializer(serializers.ModelSerializer):
    """
    Serializer for LocationDashboard model
    """
    sections = DashboardSectionDataSerializer(many=True, read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = LocationDashboard
        fields = ['id', 'location', 'location_name', 'sections', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TankSerializer(serializers.ModelSerializer):
    """
    Serializer for Tank model
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    fill_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Tank
        fields = ['id', 'location', 'location_name', 'name', 'tank_type', 'capacity', 
                 'current_level', 'fill_percentage', 'status', 'material', 
                 'installation_date', 'last_inspection', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermitSerializer(serializers.ModelSerializer):
    """
    Serializer for Permit model
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    is_expiring_soon = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Permit
        fields = ['id', 'location', 'location_name', 'permit_type', 'permit_number', 
                 'issuing_authority', 'issue_date', 'expiry_date', 'status', 
                 'description', 'renewal_required', 'is_expiring_soon', 'is_expired',
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class LocationDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Location with related data
    """
    tanks = TankSerializer(many=True, read_only=True)
    permits = PermitSerializer(many=True, read_only=True)
    dashboard = LocationDashboardSerializer(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'description', 'created_by', 
                 'created_by_username', 'created_at', 'updated_at', 'is_active',
                 'tanks', 'permits', 'dashboard']
        read_only_fields = ['created_by', 'created_at', 'updated_at']