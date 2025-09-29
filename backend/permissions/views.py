"""
Views for permission management
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from accounts.permissions import IsAdminUser
from accounts.utils import log_security_event, get_client_ip
from .models import PermissionCategory, Permission, RolePermission, UserPermission
from .serializers import (
    PermissionCategorySerializer, PermissionSerializer, 
    RolePermissionSerializer, UserPermissionSerializer,
    RolePermissionBulkUpdateSerializer, UserPermissionCheckSerializer
)


class PermissionCategoryListView(generics.ListAPIView):
    """
    List all permission categories with their permissions
    """
    serializer_class = PermissionCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PermissionCategory.objects.all().order_by('order')


class PermissionListView(generics.ListAPIView):
    """
    List all permissions
    """
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Permission.objects.all().order_by('category__order', 'name')


class RolePermissionListView(generics.ListAPIView):
    """
    List permissions for a specific role
    """
    serializer_class = RolePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if user is admin or superuser
        if not (self.request.user.role == 'admin' or self.request.user.is_superuser):
            return RolePermission.objects.none()
        
        role = self.kwargs.get('role')
        return RolePermission.objects.filter(role=role).order_by('permission__category__order', 'permission__name')
    


class RolePermissionUpdateView(generics.UpdateAPIView):
    """
    Update a specific role permission
    """
    serializer_class = RolePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = RolePermission.objects.all()
    
    def update(self, request, *args, **kwargs):
        # Check if user is admin or superuser
        if not (request.user.role == 'admin' or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can update permissions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        
        # Log permission change
        log_security_event(
            user=self.request.user,
            action='permission_granted' if instance.is_granted else 'permission_revoked',
            description=f'Permission {instance.permission.name} {"granted to" if instance.is_granted else "revoked from"} {instance.role} role',
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            metadata={
                'permission_id': instance.permission.id,
                'permission_code': instance.permission.code,
                'role': instance.role,
                'granted': instance.is_granted
            }
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_role_permissions(request):
    """
    Bulk update permissions for a role
    """
    # Check if user is admin or superuser
    if not (request.user.role == 'admin' or request.user.is_superuser):
        return Response(
            {'error': 'Only administrators can update permissions'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = RolePermissionBulkUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    role = serializer.validated_data['role']
    permissions_data = serializer.validated_data['permissions']
    
    changes = []
    
    with transaction.atomic():
        for perm_data in permissions_data:
            permission_id = perm_data.get('permission_id')
            is_granted = perm_data.get('is_granted', False)
            
            permission = get_object_or_404(Permission, id=permission_id)
            role_permission, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
                defaults={'is_granted': is_granted}
            )
            
            if not created:
                changes.append({
                    'permission': permission.name,
                    'old_value': role_permission.is_granted,
                    'new_value': is_granted
                })
                role_permission.is_granted = is_granted
                role_permission.save()
    
    # Log bulk permission changes
    if changes:
        log_security_event(
            user=request.user,
            action='permission_granted',
            description=f'Bulk updated {len(changes)} permissions for {role} role',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'role': role, 'changes': changes}
        )
    
    return Response({'message': f'Permissions updated for {role} role'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_user_permissions(request):
    """
    Check if current user has specific permissions
    """
    serializer = UserPermissionCheckSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    
    permission_codes = serializer.validated_data['permission_codes']
    user = request.user
    
    results = {}
    
    for code in permission_codes:
        try:
            permission = Permission.objects.get(code=code)
            has_permission = check_user_permission(user, permission)
            results[code] = has_permission
        except Permission.DoesNotExist:
            results[code] = False
    
    return Response(results)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_permissions(request):
    """
    Get all permissions for the current user
    """
    user = request.user
    permissions = Permission.objects.all()
    
    user_permissions = {}
    
    for permission in permissions:
        has_permission = check_user_permission(user, permission)
        user_permissions[permission.code] = {
            'granted': has_permission,
            'name': permission.name,
            'category': permission.category.name,
            'type': permission.permission_type
        }
    
    return Response(user_permissions)


def check_user_permission(user, permission):
    """
    Check if a user has a specific permission
    Priority: User-specific > Role-specific > Default
    """
    # Superusers have all permissions
    if user.is_superuser:
        return True
    
    # Check user-specific permission first
    try:
        user_perm = UserPermission.objects.get(user=user, permission=permission)
        return user_perm.is_granted
    except UserPermission.DoesNotExist:
        pass
    
    # Check role-specific permission
    try:
        role_perm = RolePermission.objects.get(role=user.role, permission=permission)
        return role_perm.is_granted
    except RolePermission.DoesNotExist:
        pass
    
    # Fall back to default permission for role
    if user.role == 'admin':
        return permission.admin_default
    elif user.role == 'contributor':
        return permission.contributor_default
    elif user.role == 'viewer':
        return permission.viewer_default
    
    return False


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_role_permissions_matrix(request):
    """
    Get permissions matrix for all roles
    """
    # Check if user is admin or superuser
    if not (request.user.role == 'admin' or request.user.is_superuser):
        return Response(
            {'error': 'Only administrators can view permissions matrix'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    categories = PermissionCategory.objects.all().order_by('order')
    roles = ['admin', 'contributor', 'viewer']
    
    matrix = {}
    
    for category in categories:
        matrix[category.name] = {
            'permissions': []
        }
        
        for permission in category.permissions.all():
            perm_data = {
                'id': permission.id,
                'name': permission.name,
                'code': permission.code,
                'type': permission.permission_type,
                'roles': {}
            }
            
            for role in roles:
                # Check if there's a role-specific override
                try:
                    role_perm = RolePermission.objects.get(role=role, permission=permission)
                    perm_data['roles'][role] = role_perm.is_granted
                except RolePermission.DoesNotExist:
                    # Use default permission
                    if role == 'admin':
                        perm_data['roles'][role] = permission.admin_default
                    elif role == 'contributor':
                        perm_data['roles'][role] = permission.contributor_default
                    elif role == 'viewer':
                        perm_data['roles'][role] = permission.viewer_default
            
            matrix[category.name]['permissions'].append(perm_data)
    
    return Response(matrix)