"""
URL patterns for facilities app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Location URLs
    path('locations/', views.LocationListCreateView.as_view(), name='location_list_create'),
    path('locations/<int:pk>/', views.LocationDetailView.as_view(), name='location_detail'),
    
    # Facility Contacts
    path('locations/<int:location_id>/contacts/', views.FacilityContactListCreateView.as_view(), name='facility_contacts'),
    path('contacts/<int:pk>/', views.FacilityContactDetailView.as_view(), name='facility_contact_detail'),
    
    # Operating Hours
    path('locations/<int:location_id>/operating-hours/', views.OperatingHoursDetailView.as_view(), name='operating_hours'),
    
    # Dashboard URLs
    path('locations/<int:location_id>/dashboard/', views.LocationDashboardView.as_view(), name='location_dashboard'),
    path('dashboard-sections/', views.DashboardSectionListView.as_view(), name='dashboard_sections'),
    path('dashboard-section-data/<int:pk>/', views.DashboardSectionDataUpdateView.as_view(), name='dashboard_section_data_update'),
    
    # Tank URLs
    path('tanks/', views.TankListCreateView.as_view(), name='tank_list_create'),
    path('locations/<int:location_id>/tanks/', views.TankListCreateView.as_view(), name='location_tanks'),
    path('tanks/<int:pk>/', views.TankDetailView.as_view(), name='tank_detail'),
    
    # Permit URLs
    path('permits/', views.PermitListCreateView.as_view(), name='permit_list_create'),
    path('locations/<int:location_id>/permits/', views.PermitListCreateView.as_view(), name='location_permits'),
    path('permits/<int:pk>/', views.PermitDetailView.as_view(), name='permit_detail'),
    
    # Stats
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
]