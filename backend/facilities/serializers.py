"""
Serializers for facility management
"""
from rest_framework import serializers
from .models import Location, LocationDashboard, DashboardSection, DashboardSectionData, Tank, Permit, FacilityProfile, CommanderInfo


class FacilityProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for FacilityProfile model
    """
    # General Information from Location
    facilityName = serializers.CharField(source='location.name')
    address = serializers.CharField(source='location.street_address')
    city = serializers.CharField(source='location.city')
    state = serializers.CharField(source='location.state')
    zip = serializers.CharField(source='location.zip_code')
    country = serializers.CharField(source='location.country')
    # phone = serializers.CharField(source='location.phone', allow_blank=True)
    # email = serializers.CharField(source='location.email', allow_blank=True)
    
    # Profile-specific fields
    internalId = serializers.CharField(source='internal_id')
    stateIdNumber = serializers.CharField(source='state_id_number')    
    
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
            'facilityName', 'internalId', 'stateIdNumber', 'address',
            'city', 'county', 'state', 'zip', 'country',
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
                 'country', 'facility_type', 'description',
                 'created_by', 'created_by_username', 'created_at', 'updated_at',
                 'is_active', 'tank_count', 'permit_count', 'full_address']
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
    calculated_status = serializers.ReadOnlyField()

    class Meta:
        model = Permit
        fields = ['id', 'location', 'location_name', 'permit_type', 'permit_number',
                 'issuing_authority', 'issue_date', 'expiry_date', 'status',
                 'description', 'renewal_required', 'is_expiring_soon', 'is_expired',
                 'calculated_status', 'created_at', 'updated_at']
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
                 'country', 'phone', 'email', 'facility_type', 'description',
                 'created_by', 'created_by_username', 'created_at', 'updated_at',
                 'is_active', 'tanks', 'permits', 'dashboard', 'full_address']
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

class ProfileGeneralInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for General Information section only
    """
    facilityName = serializers.CharField(source='location.name')
    address = serializers.CharField(source='location.street_address', allow_blank=True, required=False)
    city = serializers.CharField(source='location.city', allow_blank=True, required=False)
    state = serializers.CharField(source='location.state', allow_blank=True, required=False)
    zip = serializers.CharField(source='location.zip_code', allow_blank=True, required=False)
    country = serializers.CharField(source='location.country', required=False)
    internalId = serializers.CharField(source='internal_id', allow_blank=True, required=False)
    stateIdNumber = serializers.CharField(source='state_id_number', allow_blank=True, required=False)

    class Meta:
        model = FacilityProfile
        fields = ['facilityName', 'internalId', 'stateIdNumber', 'address',
                 'city', 'county', 'state', 'zip', 'country']

    def update(self, instance, validated_data):
        location_data = validated_data.pop('location', {})
        for field, value in location_data.items():
            setattr(instance.location, field, value)
        instance.location.save()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class ProfileOperationalInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for Operational Information section only
    """
    storeOpenDate = serializers.DateField(source='store_open_date', allow_null=True, required=False)
    operationalRegion = serializers.CharField(source='operational_region', allow_blank=True, required=False)
    tosPosDate = serializers.DateField(source='tos_pos_date', allow_null=True, required=False)
    gasBrand = serializers.CharField(source='gas_brand', allow_blank=True, required=False)
    storeOperatorType = serializers.CharField(source='store_operator_type', allow_blank=True, required=False)
    operationalDistrict = serializers.CharField(source='operational_district', allow_blank=True, required=False)
    facilityType = serializers.CharField(source='location.facility_type', required=False)
    leaseOwn = serializers.CharField(source='lease_own', allow_blank=True, required=False)
    ownerId = serializers.CharField(source='owner_id', allow_blank=True, required=False)
    tankOwner = serializers.CharField(source='tank_owner', allow_blank=True, required=False)
    tankOperator = serializers.CharField(source='tank_operator', allow_blank=True, required=False)
    numAST = serializers.IntegerField(source='num_ast', required=False)
    numUSTRegistered = serializers.IntegerField(source='num_ust_registered', required=False)
    numMPDs = serializers.IntegerField(source='num_mpds', required=False)
    remodelCloseDate = serializers.DateField(source='remodel_close_date', allow_null=True, required=False)
    remodelOpenDate = serializers.DateField(source='remodel_open_date', allow_null=True, required=False)
    reasonForRemodel = serializers.CharField(source='reason_for_remodel', allow_blank=True, required=False)
    channelOfTrade = serializers.CharField(source='channel_of_trade', allow_blank=True, required=False)
    carServiceCenter = serializers.CharField(source='car_service_center', allow_blank=True, required=False)
    truckServiceCenter = serializers.CharField(source='truck_service_center', allow_blank=True, required=False)
    busMaintenance = serializers.CharField(source='bus_maintenance', allow_blank=True, required=False)
    defuelingSite = serializers.CharField(source='defueling_site', allow_blank=True, required=False)
    defuelingMethod = serializers.CharField(source='defueling_method', allow_blank=True, required=False)

    class Meta:
        model = FacilityProfile
        fields = ['storeOpenDate', 'operationalRegion', 'tosPosDate', 'gasBrand',
                 'storeOperatorType', 'category', 'operationalDistrict', 'facilityType',
                 'leaseOwn', 'ownerId', 'tankOwner', 'tankOperator', 'numAST',
                 'numUSTRegistered', 'numMPDs', 'insured', 'remodelCloseDate',
                 'remodelOpenDate', 'reasonForRemodel', 'channelOfTrade',
                 'carServiceCenter', 'truckServiceCenter', 'busMaintenance',
                 'defuelingSite', 'defuelingMethod']

    def update(self, instance, validated_data):
        location_data = validated_data.pop('location', {})
        if location_data:
            for field, value in location_data.items():
                setattr(instance.location, field, value)
            instance.location.save()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class ProfileContactsSerializer(serializers.ModelSerializer):
    """
    Serializer for Facility Contacts section only
    """
    complianceManagerName = serializers.CharField(source='compliance_manager_name', allow_blank=True, required=False)
    complianceManagerPhone = serializers.CharField(source='compliance_manager_phone', allow_blank=True, required=False)
    complianceManagerEmail = serializers.EmailField(source='compliance_manager_email', allow_blank=True, required=False)
    storeManagerName = serializers.CharField(source='store_manager_name', allow_blank=True, required=False)
    storeManagerPhone = serializers.CharField(source='store_manager_phone', allow_blank=True, required=False)
    storeManagerEmail = serializers.EmailField(source='store_manager_email', allow_blank=True, required=False)
    testingVendorName = serializers.CharField(source='testing_vendor_name', allow_blank=True, required=False)
    testingVendorPhone = serializers.CharField(source='testing_vendor_phone', allow_blank=True, required=False)
    testingVendorEmail = serializers.EmailField(source='testing_vendor_email', allow_blank=True, required=False)

    class Meta:
        model = FacilityProfile
        fields = ['complianceManagerName', 'complianceManagerPhone', 'complianceManagerEmail',
                 'storeManagerName', 'storeManagerPhone', 'storeManagerEmail',
                 'testingVendorName', 'testingVendorPhone', 'testingVendorEmail']


class ProfileOperationHoursSerializer(serializers.ModelSerializer):
    """
    Serializer for Operation Hours section only
    """
    operatingHours = serializers.JSONField(source='operating_hours', required=False)

    class Meta:
        model = FacilityProfile
        fields = ['operatingHours']


class CommanderInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for Commander Info
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = CommanderInfo
        fields = [
            'id', 'location', 'location_name', 'commander_type', 'serial_number',
            'asm_subscription', 'base_software_version', 'tunnel_ip',
            'user_id', 'password', 'issue_date', 'expiry_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }
