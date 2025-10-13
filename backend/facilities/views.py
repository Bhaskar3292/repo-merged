"""
Views for facility management
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
import logging
from accounts.permissions import IsAdminUser, IsContributorOrAdmin, CanEditFacility
from accounts.utils import log_security_event, get_client_ip
from permissions.decorators import require_permission, require_any_permission
from permissions.models import check_user_permission
from .models import (
    Location, LocationDashboard, DashboardSection,
    DashboardSectionData, Tank, Permit, FacilityProfile, CommanderInfo
)
from .serializers import (
    LocationSerializer, LocationDetailSerializer, LocationDashboardSerializer,
    DashboardSectionSerializer, DashboardSectionDataSerializer,
    TankSerializer, PermitSerializer, FacilityProfileSerializer,
    ProfileGeneralInfoSerializer, ProfileOperationalInfoSerializer,
    ProfileContactsSerializer, ProfileOperationHoursSerializer,
    CommanderInfoSerializer
)

logger = logging.getLogger(__name__)

class LocationListCreateView(generics.ListCreateAPIView):
    """
    List all locations or create a new location
    """
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('view_locations')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @require_permission('create_locations')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    def get_queryset(self):
        from django.db.models import Count
        user = self.request.user

        # Filter locations based on user's assigned locations
        queryset = Location.objects.filter(is_active=True)

        # Admins and superusers see all locations
        if not (user.is_superuser or user.role == 'admin'):
            # Filter by user's assigned locations
            accessible_ids = user.get_accessible_location_ids()
            queryset = queryset.filter(id__in=accessible_ids)

        queryset = queryset.annotate(
            tank_count=Count('tanks', distinct=True),
            permit_count=Count('permits', distinct=True)
        ).order_by('name')

        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response
    
    def perform_create(self, serializer):
        # Only admins and contributors can create locations
        user = self.request.user
        if not (user.is_superuser or user.role in ['admin', 'contributor']):
            raise permissions.PermissionDenied("Insufficient permissions to create locations")
        
        with transaction.atomic():
            location = serializer.save(created_by=self.request.user)
            
            # Log location creation
            log_security_event(
                user=self.request.user,
                action='user_created',
                description=f'Created location: {location.name}',
                ip_address=get_client_ip(self.request),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                metadata={'location_id': location.id, 'location_name': location.name}
            )
            
            # Create dashboard for the location
            dashboard = LocationDashboard.objects.create(location=location)
            
            # Create empty dashboard sections based on templates
            sections = DashboardSection.objects.filter(is_active=True)
            for section in sections:
                DashboardSectionData.objects.create(
                    dashboard=dashboard,
                    section=section,
                    data={},  # Empty state
                    last_updated_by=self.request.user
                )


class LocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a location
    """
    serializer_class = LocationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('view_locations')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @require_permission('edit_locations')
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @require_permission('delete_locations')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Location.objects.filter(is_active=True)

        # Filter by user's assigned locations
        if not (user.is_superuser or user.role == 'admin'):
            accessible_ids = user.get_accessible_location_ids()
            queryset = queryset.filter(id__in=accessible_ids)

        return queryset
    
    def perform_update(self, serializer):
        old_name = self.get_object().name
        serializer.save()
        
        # Log location update
        log_security_event(
            user=self.request.user,
            action='user_updated',
            description=f'Updated location: {old_name} -> {serializer.instance.name}',
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            metadata={'location_id': serializer.instance.id}
        )
    
    def perform_destroy(self, instance):
        # Log location deletion
        log_security_event(
            user=self.request.user,
            action='user_deleted',
            description=f'Deleted location: {instance.name}',
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            metadata={'location_id': instance.id, 'location_name': instance.name}
        )
        
        # Soft delete
        instance.is_active = False
        instance.save()


class LocationDashboardView(generics.RetrieveAPIView):
    """
    Retrieve location dashboard
    """
    serializer_class = LocationDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        dashboard, created = LocationDashboard.objects.get_or_create(location=location)
        
        if created:
            # Create empty dashboard sections
            sections = DashboardSection.objects.filter(is_active=True)
            for section in sections:
                DashboardSectionData.objects.create(
                    dashboard=dashboard,
                    section=section,
                    data={},
                    last_updated_by=self.request.user
                )
        
        return dashboard


class DashboardSectionDataUpdateView(generics.UpdateAPIView):
    """
    Update dashboard section data
    """
    serializer_class = DashboardSectionDataSerializer
    permission_classes = [CanEditFacility]
    
    def get_queryset(self):
        return DashboardSectionData.objects.all()
    
    def perform_update(self, serializer):
        serializer.save(last_updated_by=self.request.user)


class DashboardSectionListView(generics.ListAPIView):
    """
    List all dashboard section templates
    """
    serializer_class = DashboardSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DashboardSection.objects.filter(is_active=True).order_by('order')


class TankListCreateView(generics.ListCreateAPIView):
    """
    List tanks for a location or create a new tank
    """
    serializer_class = TankSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('view_tanks')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @require_permission('create_tanks')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    def get_queryset(self):
        location_id = self.kwargs.get('location_id')
        if location_id:
            return Tank.objects.filter(location_id=location_id)
        return Tank.objects.all()
    
    def perform_create(self, serializer):
        location_id = self.kwargs.get('location_id')
        if location_id:
            location = get_object_or_404(Location, id=location_id, is_active=True)
            serializer.save(location=location)
        else:
            serializer.save()


class TankDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a tank
    """
    serializer_class = TankSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tank.objects.all()
    
    @require_permission('view_tanks')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @require_permission('edit_tanks')
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @require_permission('delete_tanks')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class PermitListCreateView(generics.ListCreateAPIView):
    """
    List permits for a location or create a new permit
    """
    serializer_class = PermitSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('view_permits')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @require_permission('create_permits')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    def get_queryset(self):
        location_id = self.kwargs.get('location_id')
        if location_id:
            return Permit.objects.filter(location_id=location_id)
        return Permit.objects.all()
    
    def perform_create(self, serializer):
        location_id = self.kwargs.get('location_id')
        if location_id:
            location = get_object_or_404(Location, id=location_id, is_active=True)
            serializer.save(location=location)
        else:
            serializer.save()


class PermitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a permit
    """
    serializer_class = PermitSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Permit.objects.all()
    
    @require_permission('view_permits')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @require_permission('edit_permits')
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @require_permission('delete_permits')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


@api_view(['GET'])
@require_permission('view_dashboard')
def dashboard_stats(request):
    """
    Get dashboard statistics
    """
    stats = {
        'total_locations': Location.objects.filter(is_active=True).count(),
        'total_tanks': Tank.objects.count(),
        'active_tanks': Tank.objects.filter(status='active').count(),
        'total_permits': Permit.objects.count(),
        'expiring_permits': Permit.objects.filter(
            expiry_date__lte=timezone.now().date() + timezone.timedelta(days=30)
        ).count(),
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def location_tank_count(request, location_id):
    """
    Get tank count for a specific location
    """
    try:
        location = get_object_or_404(Location, id=location_id, is_active=True)
        count = Tank.objects.filter(location=location).count()
        return Response({'count': count})
    except Exception as e:
        logger.error(f"Error fetching tank count for location {location_id}: {str(e)}")
        return Response({'error': 'Failed to fetch tank count'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def location_permit_count(request, location_id):
    """
    Get permit count for a specific location
    """
    try:
        location = get_object_or_404(Location, id=location_id, is_active=True)
        count = Permit.objects.filter(location=location).count()
        return Response({'count': count})
    except Exception as e:
        logger.error(f"Error fetching permit count for location {location_id}: {str(e)}")
        return Response({'error': 'Failed to fetch permit count'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FacilityProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update facility profile
    """
    serializer_class = FacilityProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        
        # Get or create facility profile
        profile, created = FacilityProfile.objects.get_or_create(
            location=location,
            defaults={
                'operating_hours': {
                    'monday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'tuesday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'wednesday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'thursday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'friday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'saturday': {'closed': False, 'open': '09:00', 'close': '17:00'},
                    'sunday': {'closed': True, 'open': '09:00', 'close': '17:00'}
                }
            }
        )
        
        return profile

class ProfileGeneralInfoView(generics.UpdateAPIView):
    """
    Update General Information section only
    """
    serializer_class = ProfileGeneralInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        profile, created = FacilityProfile.objects.get_or_create(location=location)
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'General Information updated successfully',
            'data': serializer.data
        })


class ProfileOperationalInfoView(generics.UpdateAPIView):
    """
    Update Operational Information section only
    """
    serializer_class = ProfileOperationalInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        profile, created = FacilityProfile.objects.get_or_create(location=location)
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'Operational Information updated successfully',
            'data': serializer.data
        })


class ProfileContactsView(generics.UpdateAPIView):
    """
    Update Facility Contacts section only
    """
    serializer_class = ProfileContactsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        profile, created = FacilityProfile.objects.get_or_create(location=location)
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'Facility Contacts updated successfully',
            'data': serializer.data
        })


class ProfileOperationHoursView(generics.UpdateAPIView):
    """
    Update Operation Hours section only
    """
    serializer_class = ProfileOperationHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        location_id = self.kwargs['location_id']
        location = get_object_or_404(Location, id=location_id, is_active=True)
        profile, created = FacilityProfile.objects.get_or_create(
            location=location,
            defaults={
                'operating_hours': {
                    'monday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'tuesday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'wednesday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'thursday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'friday': {'closed': False, 'open': '08:00', 'close': '18:00'},
                    'saturday': {'closed': False, 'open': '09:00', 'close': '17:00'},
                    'sunday': {'closed': True, 'open': '09:00', 'close': '17:00'}
                }
            }
        )
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'Operation Hours updated successfully',
            'data': serializer.data
        })


class CommanderInfoListCreateView(generics.ListCreateAPIView):
    """
    List all commander info or create a new commander info entry
    """
    serializer_class = CommanderInfoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        queryset = CommanderInfo.objects.all()
        location_id = self.kwargs.get('location_id')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        return queryset

    def perform_create(self, serializer):
        location_id = self.request.data.get('location') or self.kwargs.get('location_id')
        if location_id:
            location = get_object_or_404(Location, id=location_id, is_active=True)
            serializer.save(location=location)
        else:
            serializer.save()


class CommanderInfoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a commander info entry
    """
    queryset = CommanderInfo.objects.all()
    serializer_class = CommanderInfoSerializer
    permission_classes = [permissions.IsAuthenticated]
