"""
Views for permit management with AI-powered data extraction
Enhanced with needs_review handling and HTTP 422 responses
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

    Returns HTTP 422 if extraction needs manual review (e.g., missing expiry date)

    POST /api/permits/upload/
    Content-Type: multipart/form-data

    Request body:
        - file: The permit document (PDF, JPG, PNG)
        - facility: Facility ID (integer)

    Response:
        - 201 Created: Permit created successfully
        - 422 Unprocessable Entity: Needs manual review (provides suggested fields)
        - 400 Bad Request: Missing or invalid request data
        - 500 Internal Server Error: Unexpected extraction error
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Handle permit document upload and AI extraction with graceful degradation

        Args:
            request: DRF Request object with file and facility data

        Returns:
            Response: Serialized permit data, needs_review payload, or error
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

            # DEBUG: Log the renewal_url from extraction
            logger.info(f"🔍 EXTRACTED renewal_url: {extracted_data.get('renewal_url')}")

            if extracted_data.get('needs_review'):
                logger.warning(f"Extraction needs review: {extracted_data.get('inference_notes')}")

                return Response(
                    {
                        'needs_review': True,
                        'message': extracted_data.get('inference_notes', 'Some fields could not be extracted'),
                        'suggested': {
                            'license_type': extracted_data.get('license_type'),
                            'license_no': extracted_data.get('license_no'),
                            'issue_date': extracted_data.get('issue_date'),
                            'expiry_date': extracted_data.get('expiry_date'),
                            'issued_by': extracted_data.get('issued_by'),
                            'renewal_url': extracted_data.get('renewal_url'),  # ADD THIS
                        }
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

            # Parse dates
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
                        {
                            'needs_review': True,
                            'message': 'Expiry date format is invalid',
                            'suggested': {
                                'license_type': extracted_data.get('license_type'),
                                'license_no': extracted_data.get('license_no'),
                                'issue_date': extracted_data.get('issue_date'),
                                'expiry_date': None,
                                'issued_by': extracted_data.get('issued_by'),
                                'renewal_url': extracted_data.get('renewal_url'),  # ADD THIS
                            }
                        },
                        status=status.HTTP_422_UNPROCESSABLE_ENTITY
                    )

            # Validate that we have an expiry_date since it's required in your model
            if not expiry_date:
                return Response(
                    {
                        'needs_review': True,
                        'message': 'Expiry date is required but could not be extracted',
                        'suggested': {
                            'license_type': extracted_data.get('license_type'),
                            'license_no': extracted_data.get('license_no'),
                            'issue_date': extracted_data.get('issue_date'),
                            'expiry_date': None,
                            'issued_by': extracted_data.get('issued_by'),
                            'renewal_url': extracted_data.get('renewal_url'),
                        }
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

            uploaded_file.seek(0)

            # CREATE PERMIT WITH renewal_url - THIS IS THE CRITICAL FIX
            permit = Permit.objects.create(
                name=extracted_data.get('license_type') or 'Extracted Permit',
                number=extracted_data.get('license_no') or f'PERMIT-{Permit.objects.count() + 1}',
                issue_date=issue_date,
                expiry_date=expiry_date,  # This field is required in your model
                issued_by=extracted_data.get('issued_by') or 'Unknown Authority',
                renewal_url=extracted_data.get('renewal_url'),  # CRITICAL: SAVE THE RENEWAL URL
                facility_id=facility_id,
                uploaded_by=request.user,
                document=uploaded_file,
                is_active=True
            )

            # Log the renewal_url in history for debugging
            renewal_info = f"Renewal URL: {extracted_data.get('renewal_url')}" if extracted_data.get('renewal_url') else "No renewal URL extracted"

            PermitHistory.objects.create(
                permit=permit,
                action='Document uploaded and AI extracted',
                user=request.user,
                notes=f"{extracted_data.get('inference_notes', f'AI extracted data from {uploaded_file.name}')} | {renewal_info}",
                document_url=permit.document_url
            )

            logger.info(f"✅ Permit created successfully: ID={permit.id}, Number={permit.number}")
            logger.info(f"✅ Renewal URL saved: {permit.renewal_url}")

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
    # FIX: Add the missing queryset attribute
    queryset = Permit.objects.all()
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
        permit = serializer.save(uploaded_by=self.request.user)

        PermitHistory.objects.create(
            permit=permit,
            action='Permit created manually',
            user=self.request.user,
            notes='Manual permit creation via API'
        )

    @action(detail=True, methods=['post', 'patch'], url_path='renew')
    def renew_permit(self, request, pk=None):
        """
        Upload renewal document for existing permit with AI extraction

        UPDATES the existing permit with new data (dates, license number, document)
        Returns HTTP 422 if extraction needs manual review

        POST/PATCH /api/permits/{id}/renew/

        Scenarios:
        1. Same license number (e.g., Air Pollution): Updates dates only
        2. New license number (e.g., Tobacco): Updates dates AND license number
        """
        permit = self.get_object()

        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']
        old_number = permit.number
        old_expiry = permit.expiry_date
        old_renewal_url = permit.renewal_url  # Track previous renewal URL

        try:
            logger.info(f"Processing renewal UPDATE for permit {permit.id} (#{permit.number})")

            extractor = PermitDataExtractor()

            logger.info("Starting AI data extraction for renewal...")
            extracted_data = extractor.extract_from_file(uploaded_file)
            logger.info(f"Renewal AI extraction complete: {extracted_data}")

            # DEBUG: Log the renewal_url from extraction
            logger.info(f"🔍 RENEWAL EXTRACTED renewal_url: {extracted_data.get('renewal_url')}")

            if extracted_data.get('needs_review'):
                logger.warning(f"Renewal extraction needs review: {extracted_data.get('inference_notes')}")

                return Response(
                    {
                        'needs_review': True,
                        'message': extracted_data.get('inference_notes', 'Some fields could not be extracted'),
                        'permit_id': permit.id,
                        'suggested': {
                            'license_type': extracted_data.get('license_type') or permit.name,
                            'license_no': extracted_data.get('license_no') or permit.number,
                            'issue_date': extracted_data.get('issue_date'),
                            'expiry_date': extracted_data.get('expiry_date'),
                            'issued_by': extracted_data.get('issued_by') or permit.issued_by,
                            'renewal_url': extracted_data.get('renewal_url') or permit.renewal_url,  # ADD THIS
                        }
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

            # Parse issue date
            issue_date = permit.issue_date
            if extracted_data.get('issue_date'):
                try:
                    issue_date = datetime.strptime(extracted_data['issue_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid issue_date format: {extracted_data.get('issue_date')}")

            # Parse expiry date (required field)
            expiry_date = permit.expiry_date
            if extracted_data.get('expiry_date'):
                try:
                    expiry_date = datetime.strptime(extracted_data['expiry_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid expiry_date format: {extracted_data.get('expiry_date')}")

            # Extract license number and renewal URL
            new_number = extracted_data.get('license_no') or permit.number
            renewal_url = extracted_data.get('renewal_url') or permit.renewal_url  # Use new or keep existing
            issued_by = extracted_data.get('issued_by') or permit.issued_by

            # UPDATE the existing permit record INCLUDING renewal_url
            permit.number = new_number
            permit.issue_date = issue_date
            permit.expiry_date = expiry_date
            permit.issued_by = issued_by
            permit.renewal_url = renewal_url  # CRITICAL: UPDATE RENEWAL URL
            permit.document = uploaded_file
            permit.is_active = True
            permit.save()

            logger.info(f"✅ Permit updated successfully: ID={permit.id}")
            logger.info(f"  Old license #: {old_number} → New license #: {new_number}")
            logger.info(f"  Old expiry: {old_expiry} → New expiry: {expiry_date}")
            logger.info(f"  Renewal URL: {old_renewal_url} → {renewal_url}")

            # Create history entry for the renewal
            renewal_url_info = ""
            if renewal_url != old_renewal_url:
                renewal_url_info = f" | Renewal URL updated: {renewal_url}" if renewal_url else " | Renewal URL removed"
            
            if new_number != old_number:
                history_notes = f'Permit renewed. License number changed from {old_number} to {new_number}. New expiry: {expiry_date}{renewal_url_info}'
            else:
                history_notes = f'Permit renewed. License number unchanged. New expiry: {expiry_date}{renewal_url_info}'

            PermitHistory.objects.create(
                permit=permit,
                action='Permit renewed (updated)',
                user=request.user,
                notes=history_notes,
                document_url=permit.document_url
            )

            serializer = PermitSerializer(permit)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
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