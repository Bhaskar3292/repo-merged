"""
Views for facility management
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from accounts.permissions import IsAdminUser, IsContributorOrAdmin, CanEditFacility
from accounts.utils import log_security_event, get_client_ip
from .models import (
    Location, LocationDashboard, DashboardSection, 
    DashboardSectionData, Tank, Permit
)
from .serializers import (
    LocationSerializer, LocationDetailSerializer, LocationDashboardSerializer,
    DashboardSectionSerializer, DashboardSectionDataSerializer,
    TankSerializer, PermitSerializer
)


class LocationListCreateView(generics.ListCreateAPIView):
    """
    List all locations or create a new location
    """
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Location.objects.filter(is_active=True).order_by('name')
        # Add logging for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"LocationListCreateView queryset count: {queryset.count()}")
        return queryset
    
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
    permission_classes = [CanEditFacility]
    
    def get_queryset(self):
        return Location.objects.filter(is_active=True)
    
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
    permission_classes = [CanEditFacility]
    
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
    permission_classes = [CanEditFacility]
    queryset = Tank.objects.all()


class PermitListCreateView(generics.ListCreateAPIView):
    """
    List permits for a location or create a new permit
    """
    serializer_class = PermitSerializer
    permission_classes = [CanEditFacility]
    
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
    permission_classes = [CanEditFacility]
    queryset = Permit.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
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