"""
Tests for permissions app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import PermissionCategory, Permission, RolePermission

User = get_user_model()


class PermissionModelTest(TestCase):
    """Test Permission model functionality"""
    
    def setUp(self):
        self.category = PermissionCategory.objects.create(
            name='Test Category',
            description='Test category for permissions'
        )
        self.permission = Permission.objects.create(
            category=self.category,
            name='Test Permission',
            code='test_permission',
            permission_type='button',
            admin_default=True,
            contributor_default=False,
            viewer_default=False
        )
    
    def test_permission_creation(self):
        """Test permission creation"""
        self.assertEqual(self.permission.name, 'Test Permission')
        self.assertEqual(self.permission.code, 'test_permission')
        self.assertTrue(self.permission.admin_default)
    
    def test_role_permission(self):
        """Test role permission assignment"""
        role_perm = RolePermission.objects.create(
            role='admin',
            permission=self.permission,
            is_granted=True
        )
        self.assertTrue(role_perm.is_granted)
        self.assertEqual(role_perm.role, 'admin')