"""
URL configuration for facility_management project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Backend server is running',
        'protocol': 'http'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/', include('accounts.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/permissions/', include('permissions.urls')),
    path('api/permits/', include('permits.urls')),
]