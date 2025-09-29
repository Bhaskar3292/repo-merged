"""
Serializers for permission management
"""
from rest_framework import serializers
from .models import PermissionCategory, Permission, RolePermission, UserPermission


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for Permission model
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Permission
        fields = ['id', 'category', 'category_name', 'name', 'code', 'description', 
                 'permission_type', 'admin_default', 'contributor_default', 
                 'viewer_default', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermissionCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for PermissionCategory model
    """
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = PermissionCategory
        fields = ['id', 'name', 'description', 'order', 'permissions']


class RolePermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for RolePermission model
    """
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    category_name = serializers.CharField(source='permission.category.name', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'permission', 'permission_name', 'permission_code', 
                 'category_name', 'is_granted', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserPermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for UserPermission model
    """
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    category_name = serializers.CharField(source='permission.category.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserPermission
        fields = ['id', 'user', 'username', 'permission', 'permission_name', 
                 'permission_code', 'category_name', 'is_granted', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class RolePermissionBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk updating role permissions
    """
    role = serializers.ChoiceField(choices=RolePermission.ROLE_CHOICES)
    permissions = serializers.ListField(
        child=serializers.DictField(
            child=serializers.BooleanField()
        )
    )


class UserPermissionCheckSerializer(serializers.Serializer):
    """
    Serializer for checking user permissions
    """
    permission_codes = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of permission codes to check"
    )