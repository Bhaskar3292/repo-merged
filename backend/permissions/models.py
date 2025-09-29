"""
Models for permission management system
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
        ('button', 'Button/Action'),
        ('field', 'Field Access'),
        ('section', 'Section Access'),
        ('page', 'Page Access'),
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
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"


class RolePermission(models.Model):
    """
    Role-specific permission overrides
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
        return f"{self.get_role_display()} - {self.permission.name} ({'Granted' if self.is_granted else 'Denied'})"


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
        return f"{self.user.username} - {self.permission.name} ({'Granted' if self.is_granted else 'Denied'})"