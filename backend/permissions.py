"""
Custom permissions for role-based access control
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission class for admin users only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsContributorOrAdmin(permissions.BasePermission):
    """
    Permission class for contributors and admins
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['admin', 'contributor'] or request.user.is_superuser)
        )


class CanEditFacility(permissions.BasePermission):
    """
    Permission class for facility editing
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['admin', 'contributor'] or request.user.is_superuser)
        )
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.method == 'DELETE':
            return request.user.role == 'admin' or request.user.is_superuser
        
        return request.user.role in ['admin', 'contributor'] or request.user.is_superuser