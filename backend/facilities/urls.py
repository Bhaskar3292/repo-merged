"""
URL patterns for facilities app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Location URLs
    path('locations/', views.LocationListCreateView.as_view(), name='location_list_create'),
    path('locations/<int:pk>/', views.LocationDetailView.as_view(), name='location_detail'),
    
    # Dashboard URLs
    path('locations/<int:location_id>/dashboard/', views.LocationDashboardView.as_view(), name='location_dashboard'),
    path('dashboard-sections/', views.DashboardSectionListView.as_view(), name='dashboard_sections'),
    path('dashboard-section-data/<int:pk>/', views.DashboardSectionDataUpdateView.as_view(), name='dashboard_section_data_update'),
    
    # Tank URLs
    path('tanks/', views.TankListCreateView.as_view(), name='tank_list_create'),
    path('locations/<int:location_id>/tanks/', views.TankListCreateView.as_view(), name='location_tanks'),
    path('tanks/<int:pk>/', views.TankDetailView.as_view(), name='tank_detail'),

    # Stats
    path('stats/', views.dashboard_stats, name='dashboard_stats'),

    # Count endpoints
    path('locations/<int:location_id>/tanks/count/', views.location_tank_count, name='location_tank_count'),

    # Facility Profile
    path('locations/<int:location_id>/profile/', views.FacilityProfileView.as_view(), name='facility_profile'),

    # Facility Profile - Section-specific updates
    path('locations/<int:location_id>/profile/general/', views.ProfileGeneralInfoView.as_view(), name='profile_general'),
    path('locations/<int:location_id>/profile/operational/', views.ProfileOperationalInfoView.as_view(), name='profile_operational'),
    path('locations/<int:location_id>/profile/contacts/', views.ProfileContactsView.as_view(), name='profile_contacts'),
    path('locations/<int:location_id>/profile/operation-hours/', views.ProfileOperationHoursView.as_view(), name='profile_hours'),

    # Commander Info URLs
    path('commanders/', views.CommanderInfoListCreateView.as_view(), name='commander_list_create'),
    path('locations/<int:location_id>/commanders/', views.CommanderInfoListCreateView.as_view(), name='location_commanders'),
    path('commanders/<int:pk>/', views.CommanderInfoDetailView.as_view(), name='commander_detail'),
]