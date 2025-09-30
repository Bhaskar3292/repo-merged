"""
Serializers for facility management
"""
from rest_framework import serializers
from .models import Location, LocationDashboard, DashboardSection, DashboardSectionData, Tank, Permit


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tank_count = serializers.SerializerMethodField()
    permit_count = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'street_address', 'city', 'state', 'zip_code', 
                 'country', 'facility_type', 'description', 'created_by', 
                 'created_by_username', 'created_at', 'updated_at', 'is_active',
                 'tank_count', 'permit_count', 'full_address']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_tank_count(self, obj):
        return obj.tanks.count()
    
    def get_permit_count(self, obj):
        return obj.permits.count()
    
    def get_full_address(self, obj):
        """Return formatted full address"""
        address_parts = [
            obj.street_address,
            obj.city,
            f"{obj.state} {obj.zip_code}".strip(),
            obj.country
        ]
        return ', '.join(part for part in address_parts if part)


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
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'street_address', 'city', 'state', 'zip_code',
                 'country', 'facility_type', 'description', 'created_by', 
                 'created_by_username', 'created_at', 'updated_at', 'is_active',
                 'tanks', 'permits', 'dashboard', 'full_address']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_full_address(self, obj):
        """Return formatted full address"""
        address_parts = [
            obj.street_address,
            obj.city,
            f"{obj.state} {obj.zip_code}".strip(),
            obj.country
        ]
        return ', '.join(part for part in address_parts if part)