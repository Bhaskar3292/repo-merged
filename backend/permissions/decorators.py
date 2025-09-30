"""
Permission decorators for RBAC enforcement
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import check_user_permission


def require_permission(permission_code):
    """
    Decorator to require specific permission for API views
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not check_user_permission(request.user, permission_code):
                return Response(
                    {
                        'error': 'Permission denied',
                        'required_permission': permission_code,
                        'user_role': request.user.role
                    }, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permission_codes):
    """
    Decorator to require any of the specified permissions
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            has_permission = any(
                check_user_permission(request.user, code) 
                for code in permission_codes
            )
            
            if not has_permission:
                return Response(
                    {
                        'error': 'Permission denied',
                        'required_permissions': list(permission_codes),
                        'user_role': request.user.role
                    }, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator