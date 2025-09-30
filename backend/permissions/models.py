"""
Comprehensive RBAC models for permission management
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PermissionCategory(models.Model):
    """
    Categories for organizing permissions
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Permission Categories'
    
    def __str__(self):
        return self.name


class Permission(models.Model):
    """
    Individual permission definition
    """
    PERMISSION_TYPES = [
        ('page', 'Page Access'),
        ('action', 'Action/Button'),
        ('view', 'View Data'),
        ('edit', 'Edit Data'),
        ('delete', 'Delete Data'),
    ]
    
    category = models.ForeignKey(PermissionCategory, on_delete=models.CASCADE, related_name='permissions')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, help_text="Unique code for this permission")
    description = models.TextField(blank=True)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES)
    
    # Default permissions for each role
    admin_default = models.BooleanField(default=True, help_text="Default permission for admin role")
    contributor_default = models.BooleanField(default=False, help_text="Default permission for contributor role")
    viewer_default = models.BooleanField(default=False, help_text="Default permission for viewer role")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category__order', 'name']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"


class RolePermission(models.Model):
    """
    Role-specific permission assignments
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('contributor', 'Contributor'),
        ('viewer', 'Viewer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='role_permissions')
    is_granted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['role', 'permission']
    
    def __str__(self):
        return f"{self.get_role_display()} - {self.permission.name} ({'✓' if self.is_granted else '✗'})"


class UserPermission(models.Model):
    """
    User-specific permission overrides
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='user_permissions')
    is_granted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'permission']
    
    def __str__(self):
        return f"{self.user.username} - {self.permission.name} ({'✓' if self.is_granted else '✗'})"


def get_role_permissions_matrix():
    """
    Get permissions matrix for all roles
    """
    categories = PermissionCategory.objects.all().order_by('order')
    roles = ['admin', 'contributor', 'viewer']
    
    matrix = {}
    
    for category in categories:
        matrix[category.name] = {
            'id': category.id,
            'description': category.description,
            'permissions': []
        }
        
        for permission in category.permissions.all():
            perm_data = {
                'id': permission.id,
                'name': permission.name,
                'code': permission.code,
                'type': permission.permission_type,
                'description': permission.description,
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
    
    return matrix


def check_user_permission(user, permission_code):
    """
    Check if a user has a specific permission
    Priority: User-specific > Role-specific > Default
    """
    # Superusers have all permissions
    if user.is_superuser:
        return True
    
    try:
        permission = Permission.objects.get(code=permission_code)
    except Permission.DoesNotExist:
        return False
    
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