"""
Views for permit management with AI-powered data extraction
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
from .models import Permit, PermitHistory
from .serializers import (
    PermitSerializer,
    PermitUploadSerializer,
    PermitHistorySerializer
)
from .ai_extraction import PermitDataExtractor
import logging

logger = logging.getLogger(__name__)


class PermitUploadView(APIView):
    """
    API view for uploading permit documents with AI-powered data extraction

    Accepts file uploads (PDF, JPG, PNG) and uses OpenAI Vision API to extract:
    - License type
    - License number
    - Issue date
    - Expiry date
    - Issuing authority

    POST /api/permits/upload/
    Content-Type: multipart/form-data

    Request body:
        - file: The permit document (PDF, JPG, PNG)
        - facility: Facility ID (integer)

    Response:
        - 201 Created: Returns serialized permit data
        - 400 Bad Request: Missing or invalid data
        - 500 Internal Server Error: Processing or AI extraction failed
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Handle permit document upload and AI extraction

        Args:
            request: DRF Request object with file and facility data

        Returns:
            Response: Serialized permit data or error message
        """
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if 'facility' not in request.data:
                return Response(
                    {'error': 'Facility ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            uploaded_file = request.FILES['file']
            facility_id = request.data.get('facility')

            logger.info(f"Processing permit upload: {uploaded_file.name} for facility {facility_id}")

            extractor = PermitDataExtractor()

            logger.info("Starting AI data extraction...")
            extracted_data = extractor.extract_from_file(uploaded_file)
            logger.info(f"AI extraction complete: {extracted_data}")

            issue_date = None
            if extracted_data.get('issue_date'):
                try:
                    issue_date = datetime.strptime(extracted_data['issue_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid issue_date format: {extracted_data.get('issue_date')}")

            expiry_date = None
            if extracted_data.get('expiry_date'):
                try:
                    expiry_date = datetime.strptime(extracted_data['expiry_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    logger.error(f"Invalid expiry_date format: {extracted_data.get('expiry_date')}")
                    return Response(
                        {'error': 'AI could not extract a valid expiry date from the document'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if not expiry_date:
                return Response(
                    {'error': 'Expiry date is required but could not be extracted'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            uploaded_file.seek(0)

            permit = Permit.objects.create(
                name=extracted_data.get('license_type', 'Extracted Permit'),
                number=extracted_data.get('license_no', f'PERMIT-{Permit.objects.count() + 1}'),
                issue_date=issue_date,
                expiry_date=expiry_date,
                issued_by=extracted_data.get('issued_by', 'Unknown Authority'),
                facility_id=facility_id,
                uploaded_by=request.user,
                document=uploaded_file,
                is_active=True
            )

            PermitHistory.objects.create(
                permit=permit,
                action='Document uploaded and AI extracted',
                user=request.user,
                notes=f'AI extracted data from {uploaded_file.name}',
                document_url=permit.document_url
            )

            logger.info(f"Permit created successfully: ID={permit.id}, Number={permit.number}")

            serializer = PermitSerializer(permit)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        except ValueError as e:
            logger.error(f"Validation error during upload: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.error(f"Unexpected error during permit upload: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to process permit: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PermitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for standard CRUD operations on permits
    """
    queryset = Permit.objects.filter(is_active=True)
    serializer_class = PermitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter permits by facility if provided in query params
        """
        queryset = Permit.objects.filter(is_active=True)
        facility_id = self.request.query_params.get('facility', None)

        if facility_id:
            queryset = queryset.filter(facility_id=facility_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """
        Save user who created the permit and log history
        """
        serializer.save(uploaded_by=self.request.user)

        PermitHistory.objects.create(
            permit=serializer.instance,
            action='Permit created manually',
            user=self.request.user,
            notes='Manual permit creation via API'
        )

    @action(detail=True, methods=['post'], url_path='renew')
    def renew_permit(self, request, pk=None):
        """
        Upload renewal document for existing permit

        Creates new permit with parent relationship and deactivates original

        POST /api/permits/{id}/renew/
        """
        original_permit = self.get_object()

        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']

        try:
            logger.info(f"Processing renewal for permit {original_permit.id}")

            extractor = PermitDataExtractor()

            logger.info("Starting AI data extraction for renewal...")
            extracted_data = extractor.extract_from_file(uploaded_file)
            logger.info(f"Renewal AI extraction complete: {extracted_data}")

            issue_date = None
            if extracted_data.get('issue_date'):
                try:
                    issue_date = datetime.strptime(extracted_data['issue_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid issue_date format: {extracted_data.get('issue_date')}")

            expiry_date = None
            if extracted_data.get('expiry_date'):
                try:
                    expiry_date = datetime.strptime(extracted_data['expiry_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    expiry_date = original_permit.expiry_date

            if not expiry_date:
                expiry_date = original_permit.expiry_date

            original_permit.is_active = False
            original_permit.save()

            uploaded_file.seek(0)

            renewed_permit = Permit.objects.create(
                name=original_permit.name,
                number=extracted_data.get('license_no', original_permit.number),
                issue_date=issue_date,
                expiry_date=expiry_date,
                issued_by=extracted_data.get('issued_by', original_permit.issued_by),
                facility=original_permit.facility,
                uploaded_by=request.user,
                document=uploaded_file,
                parent_permit=original_permit,
                is_active=True
            )

            PermitHistory.objects.create(
                permit=renewed_permit,
                action='Permit renewed with AI extraction',
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

            logger.info(f"Permit renewed successfully: Original={original_permit.id}, New={renewed_permit.id}")

            serializer = PermitSerializer(renewed_permit)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error renewing permit: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to renew permit: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='history')
    def get_history(self, request, pk=None):
        """
        Get complete history for a permit

        GET /api/permits/{id}/history/
        """
        permit = self.get_object()
        history = PermitHistory.objects.filter(permit=permit)
        serializer = PermitHistorySerializer(history, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def permit_stats(request):
    """
    Get permit statistics

    GET /api/permits/stats/
    Query params:
        - facility: Filter by facility ID (optional)

    Returns statistics for active, expiring, and expired permits
    """
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
