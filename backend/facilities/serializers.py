"""
Serializers for facility management
"""
from rest_framework import serializers
from .models import Location, LocationDashboard, DashboardSection, DashboardSectionData, Tank, Permit, FacilityProfile


class FacilityProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for FacilityProfile model
    """
    # General Information from Location
    facilityName = serializers.CharField(source='location.name')
    address1 = serializers.CharField(source='location.street_address')
    city = serializers.CharField(source='location.city')
    state = serializers.CharField(source='location.state')
    zip = serializers.CharField(source='location.zip_code')
    country = serializers.CharField(source='location.country')
    phone = serializers.CharField(source='location.phone', allow_blank=True)
    email = serializers.CharField(source='location.email', allow_blank=True)
    
    # Profile-specific fields
    internalId = serializers.CharField(source='internal_id')
    stateIdNumber = serializers.CharField(source='state_id_number')
    address2 = serializers.CharField(source='location.address2', allow_blank=True)
    
    # Operational Information
    storeOpenDate = serializers.DateField(source='store_open_date', allow_null=True)
    operationalRegion = serializers.CharField(source='operational_region')
    tosPosDate = serializers.DateField(source='tos_pos_date', allow_null=True)
    gasBrand = serializers.CharField(source='gas_brand')
    storeOperatorType = serializers.CharField(source='store_operator_type')
    operationalDistrict = serializers.CharField(source='operational_district')
    facilityType = serializers.CharField(source='location.facility_type')
    leaseOwn = serializers.CharField(source='lease_own')
    ownerId = serializers.CharField(source='owner_id')
    tankOwner = serializers.CharField(source='tank_owner')
    tankOperator = serializers.CharField(source='tank_operator')
    numAST = serializers.IntegerField(source='num_ast')
    numUSTRegistered = serializers.IntegerField(source='num_ust_registered')
    numMPDs = serializers.IntegerField(source='num_mpds')
    remodelCloseDate = serializers.DateField(source='remodel_close_date', allow_null=True)
    remodelOpenDate = serializers.DateField(source='remodel_open_date', allow_null=True)
    reasonForRemodel = serializers.CharField(source='reason_for_remodel')
    channelOfTrade = serializers.CharField(source='channel_of_trade')
    carServiceCenter = serializers.CharField(source='car_service_center')
    truckServiceCenter = serializers.CharField(source='truck_service_center')
    busMaintenance = serializers.CharField(source='bus_maintenance')
    defuelingSite = serializers.CharField(source='defueling_site')
    defuelingMethod = serializers.CharField(source='defueling_method')
    
    # Facility Contacts
    complianceManagerName = serializers.CharField(source='compliance_manager_name')
    complianceManagerPhone = serializers.CharField(source='compliance_manager_phone')
    complianceManagerEmail = serializers.CharField(source='compliance_manager_email')
    storeManagerName = serializers.CharField(source='store_manager_name')
    storeManagerPhone = serializers.CharField(source='store_manager_phone')
    storeManagerEmail = serializers.CharField(source='store_manager_email')
    testingVendorName = serializers.CharField(source='testing_vendor_name')
    testingVendorPhone = serializers.CharField(source='testing_vendor_phone')
    testingVendorEmail = serializers.CharField(source='testing_vendor_email')
    
    # Operating Hours
    operatingHours = serializers.JSONField(source='operating_hours')
    
    class Meta:
        model = FacilityProfile
        fields = [
            # General Information
            'facilityName', 'internalId', 'stateIdNumber', 'address1', 'address2',
            'city', 'county', 'state', 'zip', 'country', 'phone', 'email',
            # Operational Information
            'storeOpenDate', 'operationalRegion', 'tosPosDate', 'gasBrand',
            'storeOperatorType', 'category', 'operationalDistrict', 'facilityType',
            'leaseOwn', 'ownerId', 'tankOwner', 'tankOperator', 'numAST',
            'numUSTRegistered', 'numMPDs', 'insured', 'remodelCloseDate',
            'remodelOpenDate', 'reasonForRemodel', 'channelOfTrade',
            'carServiceCenter', 'truckServiceCenter', 'busMaintenance',
            'defuelingSite', 'defuelingMethod',
            # Facility Contacts
            'complianceManagerName', 'complianceManagerPhone', 'complianceManagerEmail',
            'storeManagerName', 'storeManagerPhone', 'storeManagerEmail',
            'testingVendorName', 'testingVendorPhone', 'testingVendorEmail',
            # Operating Hours
            'operatingHours'
        ]
    
    def update(self, instance, validated_data):
        # Update Location fields
        location_data = {}
        if 'location' in validated_data:
            location_data = validated_data.pop('location')
            for field, value in location_data.items():
                setattr(instance.location, field, value)
            instance.location.save()
        
        # Update Profile fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance
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
    
    class Meta:
        model = Tank
        fields = ['id', 'location', 'location_name', 'label', 'product', 'status', 
                 'size', 'tank_lined', 'compartment', 'manifolded_with', 
                 'piping_manifolded_with', 'track_release_detection', 'tank_material',
                 'release_detection', 'stp_sumps', 'piping_detection', 'piping_material',
                 'atg_id', 'installed', 'piping_installed', 'created_at', 'updated_at']
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