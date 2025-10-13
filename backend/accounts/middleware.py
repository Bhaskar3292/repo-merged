"""
Middleware for authentication and authorization checks
"""
from django.utils import timezone
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class UserExpirationMiddleware:
    """
    Middleware to check if temporary users have expired on every request
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if user is authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user

            # Check if temporary user has expired
            if user.user_type == 'temporary':
                if user.check_expiration():
                    return JsonResponse({
                        'error': 'User account has expired',
                        'code': 'ACCOUNT_EXPIRED',
                        'expired_at': user.expires_at.isoformat() if user.expires_at else None
                    }, status=401)

                # Check if user is about to expire (within 1 hour)
                if user.expires_at:
                    time_remaining = user.expires_at - timezone.now()
                    if time_remaining.total_seconds() < 3600:  # Less than 1 hour
                        request.user_expiring_soon = True
                        request.time_until_expiration = int(time_remaining.total_seconds())

        response = self.get_response(request)
        return response


class LocationAccessMiddleware:
    """
    Middleware to enforce location-based access control
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for non-API endpoints
        if not request.path.startswith('/api/facilities'):
            return self.get_response(request)

        # Skip for unauthenticated requests (will be handled by authentication)
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)

        # Extract location_id from URL if present
        location_id = self._extract_location_id(request)

        if location_id:
            user = request.user
            # Admins and superusers have access to all locations
            if not (user.is_superuser or user.role == 'admin'):
                if not user.has_location_access(location_id):
                    return JsonResponse({
                        'error': 'You do not have access to this location',
                        'code': 'LOCATION_ACCESS_DENIED',
                        'location_id': location_id
                    }, status=403)

        response = self.get_response(request)
        return response

    def _extract_location_id(self, request):
        """Extract location ID from URL path"""
        import re

        # Match patterns like /api/facilities/locations/1 or /api/facilities/locations/1/
        location_match = re.search(r'/api/facilities/locations/(\d+)', request.path)
        if location_match:
            return int(location_match.group(1))

        # Check query parameters
        if 'location_id' in request.GET:
            try:
                return int(request.GET['location_id'])
            except (ValueError, TypeError):
                pass

        # Check POST data
        if request.method == 'POST' and hasattr(request, 'data'):
            if isinstance(request.data, dict) and 'location_id' in request.data:
                try:
                    return int(request.data['location_id'])
                except (ValueError, TypeError):
                    pass

        return None
