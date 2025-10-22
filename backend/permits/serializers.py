from rest_framework import serializers
from .models import Permit, PermitHistory
import logging

logger = logging.getLogger(__name__)


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

    def to_representation(self, instance):
        """
        Add detailed logging for serialization debugging
        """
        representation = super().to_representation(instance)

        logger.info(f"[PermitSerializer] Serializing Permit ID={instance.id}")
        logger.info(f"[PermitSerializer] Database values:")
        logger.info(f"  - name: {instance.name}")
        logger.info(f"  - number: {instance.number}")
        logger.info(f"  - issue_date: {instance.issue_date}")
        logger.info(f"  - expiry_date: {instance.expiry_date}")
        logger.info(f"  - issued_by: {instance.issued_by}")
        logger.info(f"  - status: {instance.status}")

        logger.info(f"[PermitSerializer] Serialized representation:")
        logger.info(f"  - name: {representation.get('name')}")
        logger.info(f"  - number: {representation.get('number')}")
        logger.info(f"  - issue_date: {representation.get('issue_date')}")
        logger.info(f"  - expiry_date: {representation.get('expiry_date')}")
        logger.info(f"  - issued_by: {representation.get('issued_by')}")
        logger.info(f"  - status: {representation.get('status')}")

        return representation


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
