"""
Models for facility management with dynamic dashboards
"""
from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class Location(models.Model):
    """
    Location model representing different facility locations
    """
    name = models.CharField(max_length=200, unique=True)
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default='United States')
    facility_type = models.CharField(
        max_length=50,
        choices=[
            ('gas_station', 'Gas Station'),
            ('truck_stop', 'Truck Stop'),
            ('storage_facility', 'Storage Facility'),
            ('distribution_center', 'Distribution Center'),
            ('terminal', 'Terminal'),
            ('convenience_store', 'Convenience Store'),
        ],
        default='gas_station'
    )
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_locations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class DashboardSection(models.Model):
    """
    Dashboard section template defining structure
    """
    SECTION_TYPES = [
        ('info', 'Information'),
        ('metrics', 'Metrics'),
        ('status', 'Status'),
        ('controls', 'Controls'),
        ('reports', 'Reports'),
    ]
    
    name = models.CharField(max_length=100)
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # JSON field to store field definitions
    field_schema = models.JSONField(default=dict, help_text="Field definitions for this section")
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_section_type_display()})"


class LocationDashboard(models.Model):
    """
    Location-specific dashboard instance
    """
    location = models.OneToOneField(Location, on_delete=models.CASCADE, related_name='dashboard')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Dashboard for {self.location.name}"


class DashboardSectionData(models.Model):
    """
    Location-specific data for dashboard sections
    """
    dashboard = models.ForeignKey(LocationDashboard, on_delete=models.CASCADE, related_name='sections')
    section = models.ForeignKey(DashboardSection, on_delete=models.CASCADE)
    
    # JSON field to store actual data values
    data = models.JSONField(default=dict, help_text="Actual data values for this section")
    
    last_updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['dashboard', 'section']
    
    def __str__(self):
        return f"{self.dashboard.location.name} - {self.section.name}"


class Tank(models.Model):
    """
    Tank model for facility management
    """
    TANK_TYPES = [
        ('gasoline', 'Gasoline'),
        ('diesel', 'Diesel'),
        ('oil', 'Oil'),
        ('water', 'Water'),
        ('chemical', 'Chemical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
        ('inactive', 'Inactive'),
        ('decommissioned', 'Decommissioned'),
    ]
    
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='tanks')
    name = models.CharField(max_length=100)
    tank_type = models.CharField(max_length=20, choices=TANK_TYPES)
    capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Capacity in gallons")
    current_level = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Current level in gallons")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Technical specifications
    material = models.CharField(max_length=50, blank=True)
    installation_date = models.DateField(null=True, blank=True)
    last_inspection = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['location', 'name']
        ordering = ['location', 'name']
    
    def __str__(self):
        return f"{self.location.name} - {self.name}"
    
    @property
    def fill_percentage(self):
        if self.capacity > 0:
            return (self.current_level / self.capacity) * 100
        return 0


class Permit(models.Model):
    """
    Permit model for regulatory compliance
    """
    PERMIT_TYPES = [
        ('operating', 'Operating Permit'),
        ('environmental', 'Environmental Permit'),
        ('safety', 'Safety Permit'),
        ('construction', 'Construction Permit'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    ]
    
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='permits')
    permit_type = models.CharField(max_length=20, choices=PERMIT_TYPES)
    permit_number = models.CharField(max_length=100)
    issuing_authority = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    description = models.TextField(blank=True)
    renewal_required = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['location', 'permit_number']
        ordering = ['location', 'expiry_date']
    
    def __str__(self):
        return f"{self.location.name} - {self.permit_number}"
    
    @property
    def is_expiring_soon(self):
        from datetime import date, timedelta
        return self.expiry_date <= date.today() + timedelta(days=30)
    
    @property
    def is_expired(self):
        from datetime import date
        return self.expiry_date < date.today()