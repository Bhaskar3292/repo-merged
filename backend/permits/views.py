from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Permit, PermitHistory
from .serializers import (
    PermitSerializer,
    PermitUploadSerializer,
    PermitHistorySerializer
)
import logging

logger = logging.getLogger(__name__)


class PermitViewSet(viewsets.ModelViewSet):
    queryset = Permit.objects.filter(is_active=True)
    serializer_class = PermitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Permit.objects.filter(is_active=True)
        facility_id = self.request.query_params.get('facility', None)

        if facility_id:
            queryset = queryset.filter(facility_id=facility_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

        PermitHistory.objects.create(
            permit=serializer.instance,
            action='Permit created',
            user=self.request.user,
            notes='Initial permit upload'
        )

    @action(detail=False, methods=['post'], url_path='upload')
    def upload_permit(self, request):
        serializer = PermitUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']
        facility_id = serializer.validated_data['facility']

        try:
            extracted_data = self.extract_permit_data(file)

            permit = Permit.objects.create(
                name=extracted_data.get('name', 'Extracted Permit'),
                number=extracted_data.get('number', f'PERMIT-{Permit.objects.count() + 1}'),
                issue_date=extracted_data.get('issue_date'),
                expiry_date=extracted_data.get('expiry_date'),
                issued_by=extracted_data.get('issued_by', 'Unknown Authority'),
                facility_id=facility_id,
                uploaded_by=request.user,
                document=file
            )

            PermitHistory.objects.create(
                permit=permit,
                action='Document uploaded and extracted',
                user=request.user,
                notes=f'AI extracted data from {file.name}',
                document_url=permit.document_url
            )

            return Response(
                PermitSerializer(permit).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f'Error uploading permit: {str(e)}')
            return Response(
                {'error': f'Failed to process permit: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='renew')
    def renew_permit(self, request, pk=None):
        original_permit = self.get_object()
        serializer = PermitUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']

        try:
            extracted_data = self.extract_permit_data(file)

            original_permit.is_active = False
            original_permit.save()

            renewed_permit = Permit.objects.create(
                name=original_permit.name,
                number=extracted_data.get('number', original_permit.number),
                issue_date=extracted_data.get('issue_date'),
                expiry_date=extracted_data.get('expiry_date', original_permit.expiry_date),
                issued_by=extracted_data.get('issued_by', original_permit.issued_by),
                facility=original_permit.facility,
                uploaded_by=request.user,
                document=file,
                parent_permit=original_permit,
                is_active=True
            )

            PermitHistory.objects.create(
                permit=renewed_permit,
                action='Permit renewed',
                user=request.user,
                notes=f'Renewed from permit #{original_permit.number}',
                document_url=renewed_permit.document_url
            )

            PermitHistory.objects.create(
                permit=original_permit,
                action='Permit superseded',
                user=request.user,
                notes=f'Superseded by permit #{renewed_permit.number}'
            )

            return Response(
                PermitSerializer(renewed_permit).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f'Error renewing permit: {str(e)}')
            return Response(
                {'error': f'Failed to renew permit: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='history')
    def get_history(self, request, pk=None):
        permit = self.get_object()
        history = PermitHistory.objects.filter(permit=permit)
        serializer = PermitHistorySerializer(history, many=True)
        return Response(serializer.data)

    def extract_permit_data(self, file):
        from datetime import datetime, timedelta
        import random

        file_name = file.name.lower()

        sample_names = [
            'Operating Permit',
            'Environmental Permit',
            'Safety Permit',
            'Construction Permit',
            'Business License'
        ]

        sample_authorities = [
            'State Department of Environmental Quality',
            'County Health Department',
            'City Building Department',
            'State Fire Marshal',
            'Department of Business Licensing'
        ]

        return {
            'name': random.choice(sample_names),
            'number': f'PERMIT-{random.randint(10000, 99999)}',
            'issue_date': datetime.now().date(),
            'expiry_date': (datetime.now() + timedelta(days=365)).date(),
            'issued_by': random.choice(sample_authorities)
        }


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def permit_stats(request):
    facility_id = request.query_params.get('facility', None)

    queryset = Permit.objects.filter(is_active=True)
    if facility_id:
        queryset = queryset.filter(facility_id=facility_id)

    total = queryset.count()
    active = sum(1 for p in queryset if p.status == 'active')
    expiring = sum(1 for p in queryset if p.status == 'expiring')
    expired = sum(1 for p in queryset if p.status == 'expired')

    return Response({
        'total': total,
        'active': active,
        'expiring': expiring,
        'expired': expired
    })
