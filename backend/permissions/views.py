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
    List all role permissions for permission matrix
    """
    serializer_class = RolePermissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return RolePermission.objects.all().select_related('permission', 'permission__category').order_by('role', 'permission__category__order', 'permission__name')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def update_role_permission(request):
    """
    Update a single role permission
    Accepts: {role: string, permission_code: string, is_granted: boolean}
    """
    role = request.data.get('role')
    permission_code = request.data.get('permission_code')
    is_granted = request.data.get('is_granted')

    # Validate required fields
    if not role:
        return Response(
            {'error': 'role is required', 'field': 'role'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not permission_code:
        return Response(
            {'error': 'permission_code is required', 'field': 'permission_code'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if is_granted is None:
        return Response(
            {'error': 'is_granted is required', 'field': 'is_granted'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate role value
    valid_roles = ['admin', 'contributor', 'viewer']
    if role not in valid_roles:
        return Response(
            {'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}', 'field': 'role'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Admin permissions are always granted and cannot be changed
    if role == 'admin':
        return Response(
            {'error': 'Admin permissions cannot be modified', 'field': 'role'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Find permission by code
    try:
        permission = Permission.objects.get(code=permission_code)
    except Permission.DoesNotExist:
        return Response(
            {'error': f'Permission with code "{permission_code}" not found', 'field': 'permission_code'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Update or create role permission
    try:
        role_perm, created = RolePermission.objects.update_or_create(
            role=role,
            permission=permission,
            defaults={'is_granted': is_granted}
        )

        # Log the change
        log_security_event(
            user=request.user,
            action='permission_updated',
            description=f'Updated {role} permission for {permission_code}: {is_granted}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={
                'role': role,
                'permission_code': permission_code,
                'is_granted': is_granted,
                'action': 'created' if created else 'updated'
            }
        )

        return Response({
            'role': role_perm.role,
            'permission_code': permission.code,
            'is_granted': role_perm.is_granted,
            'message': f'Permission {"granted" if is_granted else "revoked"} successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to update permission: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def bulk_update_permissions(request):
    """
    Bulk update multiple role permissions
    Accepts: {permissions: [{role: string, permission_code: string, is_granted: boolean}]}
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        permissions_data = request.data.get('permissions', [])

        # Validate input
        if not permissions_data:
            return Response(
                {'error': 'No permissions provided', 'field': 'permissions'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(permissions_data, list):
            return Response(
                {'error': 'permissions must be an array', 'field': 'permissions'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        skipped_count = 0
        errors = []
        valid_roles = ['admin', 'contributor', 'viewer']

        with transaction.atomic():
            for idx, perm_data in enumerate(permissions_data):
                # Validate each permission entry
                if not isinstance(perm_data, dict):
                    errors.append(f'Item {idx}: Invalid format, must be an object')
                    continue

                role = perm_data.get('role')
                permission_code = perm_data.get('permission_code')
                is_granted = perm_data.get('is_granted')

                # Validate required fields
                if not role:
                    errors.append(f'Item {idx}: role is required')
                    continue

                if not permission_code:
                    errors.append(f'Item {idx}: permission_code is required')
                    continue

                if is_granted is None:
                    errors.append(f'Item {idx}: is_granted is required')
                    continue

                # Validate role value
                if role not in valid_roles:
                    errors.append(f'Item {idx}: Invalid role "{role}". Must be one of: {", ".join(valid_roles)}')
                    continue

                # Skip admin permissions
                if role == 'admin':
                    skipped_count += 1
                    continue

                try:
                    permission = Permission.objects.get(code=permission_code)
                    RolePermission.objects.update_or_create(
                        role=role,
                        permission=permission,
                        defaults={'is_granted': is_granted}
                    )
                    updated_count += 1
                except Permission.DoesNotExist:
                    errors.append(f'Item {idx}: Permission "{permission_code}" not found')
                except Exception as e:
                    logger.error(f'Error updating permission {permission_code}: {str(e)}', exc_info=True)
                    errors.append(f'Item {idx}: Error updating "{permission_code}": {str(e)}')

        # Log bulk update (with error handling)
        try:
            log_security_event(
                user=request.user,
                action='bulk_permission_update',
                description=f'Bulk updated {updated_count} permissions',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={
                    'updated_count': updated_count,
                    'skipped_count': skipped_count,
                    'total_attempted': len(permissions_data),
                    'error_count': len(errors)
                }
            )
        except Exception as log_error:
            logger.error(f'Failed to log security event: {str(log_error)}', exc_info=True)

        return Response({
            'message': f'Successfully updated {updated_count} permissions',
            'updated_count': updated_count,
            'skipped_count': skipped_count,
            'total_attempted': len(permissions_data),
            'errors': errors if errors else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f'Bulk update failed: {str(e)}', exc_info=True)
        return Response(
            {'error': f'Bulk update failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    


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
    
    from .models import get_role_permissions_matrix
    matrix = get_role_permissions_matrix()
    
    return Response(matrix)


