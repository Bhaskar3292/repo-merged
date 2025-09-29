"""
Management command to create default permissions
"""
from django.core.management.base import BaseCommand
from permissions.models import PermissionCategory, Permission


class Command(BaseCommand):
    help = 'Create default permissions for the application'
    
    def handle(self, *args, **options):
        # Create permission categories
        categories_data = [
            {'name': 'User Management', 'description': 'Permissions related to user management', 'order': 1},
            {'name': 'Location Management', 'description': 'Permissions related to location management', 'order': 2},
            {'name': 'Dashboard', 'description': 'Permissions related to dashboard access and editing', 'order': 3},
            {'name': 'Tank Management', 'description': 'Permissions related to tank management', 'order': 4},
            {'name': 'Permit Management', 'description': 'Permissions related to permit management', 'order': 5},
            {'name': 'Reports', 'description': 'Permissions related to reports and analytics', 'order': 6},
        ]
        
        for cat_data in categories_data:
            category, created = PermissionCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f"Created category: {category.name}")
        
        # Create permissions
        permissions_data = [
            # User Management
            {
                'category': 'User Management',
                'name': 'Create Users',
                'code': 'create_users',
                'description': 'Can create new users',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Edit Users',
                'code': 'edit_users',
                'description': 'Can edit existing users',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Delete Users',
                'code': 'delete_users',
                'description': 'Can delete users',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'View Users',
                'code': 'view_users',
                'description': 'Can view user list',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Location Management
            {
                'category': 'Location Management',
                'name': 'Create Locations',
                'code': 'create_locations',
                'description': 'Can create new locations',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Edit Locations',
                'code': 'edit_locations',
                'description': 'Can edit location details',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Delete Locations',
                'code': 'delete_locations',
                'description': 'Can delete locations',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'View Locations',
                'code': 'view_locations',
                'description': 'Can view locations',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            
            # Dashboard
            {
                'category': 'Dashboard',
                'name': 'Edit Dashboard',
                'code': 'edit_dashboard',
                'description': 'Can edit dashboard sections',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Dashboard',
                'name': 'View Dashboard',
                'code': 'view_dashboard',
                'description': 'Can view dashboard',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            
            # Tank Management
            {
                'category': 'Tank Management',
                'name': 'Create Tanks',
                'code': 'create_tanks',
                'description': 'Can create new tanks',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Edit Tanks',
                'code': 'edit_tanks',
                'description': 'Can edit tank information',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Delete Tanks',
                'code': 'delete_tanks',
                'description': 'Can delete tanks',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'View Tanks',
                'code': 'view_tanks',
                'description': 'Can view tank information',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            
            # Permit Management
            {
                'category': 'Permit Management',
                'name': 'Create Permits',
                'code': 'create_permits',
                'description': 'Can create new permits',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Permit Management',
                'name': 'Edit Permits',
                'code': 'edit_permits',
                'description': 'Can edit permit information',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Permit Management',
                'name': 'Delete Permits',
                'code': 'delete_permits',
                'description': 'Can delete permits',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'Permit Management',
                'name': 'View Permits',
                'code': 'view_permits',
                'description': 'Can view permit information',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            
            # Reports
            {
                'category': 'Reports',
                'name': 'Generate Reports',
                'code': 'generate_reports',
                'description': 'Can generate reports',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Reports',
                'name': 'View Reports',
                'code': 'view_reports',
                'description': 'Can view reports',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
        ]
        
        for perm_data in permissions_data:
            category = PermissionCategory.objects.get(name=perm_data.pop('category'))
            permission, created = Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={**perm_data, 'category': category}
            )
            if created:
                self.stdout.write(f"Created permission: {permission.name}")
        
        self.stdout.write(self.style.SUCCESS('Successfully created default permissions'))