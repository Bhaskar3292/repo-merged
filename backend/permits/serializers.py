from rest_framework import serializers
from .models import Permit, PermitHistory


class PermitSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    document_url = serializers.ReadOnlyField()
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )
    facility_name = serializers.CharField(
        source='facility.name',
        read_only=True
    )
    parent_id = serializers.IntegerField(
        source='parent_permit_id',
        read_only=True
    )

    class Meta:
        model = Permit
        fields = [
            'id',
            'name',
            'number',
            'issue_date',
            'expiry_date',
            'issued_by',
            'is_active',
            'parent_id',
            'renewal_url',
            'document',
            'document_url',
            'facility',
            'facility_name',
            'uploaded_by',
            'uploaded_by_username',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['uploaded_by', 'created_at', 'updated_at']


class PermitUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    facility = serializers.IntegerField()


class PermitHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = PermitHistory
        fields = [
            'id',
            'permit',
            'action',
            'user',
            'user_name',
            'notes',
            'document_url',
            'date',
            'created_at'
        ]
        read_only_fields = ['user', 'created_at']
