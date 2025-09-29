"""
Management command to create comprehensive role-based permissions
"""
from django.core.management.base import BaseCommand
from permissions.models import PermissionCategory, Permission, RolePermission


class Command(BaseCommand):
    help = 'Create comprehensive role-based permissions for the application'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating role-based permissions...'))
        
        # Create permission categories
        categories_data = [
            {'name': 'User Management', 'description': 'User account and profile management', 'order': 1},
            {'name': 'Location Management', 'description': 'Facility location management', 'order': 2},
            {'name': 'Dashboard Access', 'description': 'Dashboard viewing and editing', 'order': 3},
            {'name': 'Tank Management', 'description': 'Tank monitoring and management', 'order': 4},
            {'name': 'Permit Management', 'description': 'Permits and licenses management', 'order': 5},
            {'name': 'System Administration', 'description': 'System configuration and administration', 'order': 6},
        ]
        
        for cat_data in categories_data:
            category, created = PermissionCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f"✅ Created category: {category.name}")
        
        # Create detailed permissions
        permissions_data = [
            # User Management
            {
                'category': 'User Management',
                'name': 'View Users',
                'code': 'view_users',
                'description': 'Can view user list and profiles',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Create Users',
                'code': 'create_users',
                'description': 'Can create new user accounts',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Edit Users',
                'code': 'edit_users',
                'description': 'Can edit existing user accounts',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Delete Users',
                'code': 'delete_users',
                'description': 'Can delete user accounts',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Management',
                'name': 'Manage User Roles',
                'code': 'manage_user_roles',
                'description': 'Can assign and modify user roles',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Location Management
            {
                'category': 'Location Management',
                'name': 'View Locations',
                'code': 'view_locations',
                'description': 'Can view facility locations',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Location Management',
                'name': 'Create Locations',
                'code': 'create_locations',
                'description': 'Can create new facility locations',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Edit Locations',
                'code': 'edit_locations',
                'description': 'Can edit facility location details',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Delete Locations',
                'code': 'delete_locations',
                'description': 'Can delete facility locations',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Dashboard Access
            {
                'category': 'Dashboard Access',
                'name': 'View Dashboard',
                'code': 'view_dashboard',
                'description': 'Can view facility dashboards',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Dashboard Access',
                'name': 'Edit Dashboard',
                'code': 'edit_dashboard',
                'description': 'Can edit dashboard sections and data',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Dashboard Access',
                'name': 'Configure Dashboard',
                'code': 'configure_dashboard',
                'description': 'Can configure dashboard layout and sections',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Tank Management
            {
                'category': 'Tank Management',
                'name': 'View Tanks',
                'code': 'view_tanks',
                'description': 'Can view tank information and status',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Tank Management',
                'name': 'Create Tanks',
                'code': 'create_tanks',
                'description': 'Can add new tanks to facilities',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Edit Tanks',
                'code': 'edit_tanks',
                'description': 'Can edit tank information and settings',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Delete Tanks',
                'code': 'delete_tanks',
                'description': 'Can remove tanks from facilities',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Permit Management
            {
                'category': 'Permit Management',
                'name': 'View Permits',
                'code': 'view_permits',
                'description': 'Can view permits and licenses',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Permit Management',
                'name': 'Create Permits',
                'code': 'create_permits',
                'description': 'Can create new permits and licenses',
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
                'description': 'Can delete permits and licenses',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # System Administration
            {
                'category': 'System Administration',
                'name': 'Manage Users',
                'code': 'manage_users',
                'description': 'Full user management access',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'System Administration',
                'name': 'Manage Permissions',
                'code': 'manage_permissions',
                'description': 'Can configure role permissions',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'System Administration',
                'name': 'System Configuration',
                'code': 'system_config',
                'description': 'Can configure system settings',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'System Administration',
                'name': 'View Audit Logs',
                'code': 'view_audit_logs',
                'description': 'Can view system audit logs',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
        ]
        
        created_permissions = 0
        for perm_data in permissions_data:
            try:
                category = PermissionCategory.objects.get(name=perm_data.pop('category'))
                permission, created = Permission.objects.get_or_create(
                    code=perm_data['code'],
                    defaults={**perm_data, 'category': category}
                )
                if created:
                    created_permissions += 1
                    self.stdout.write(f"✅ Created permission: {permission.name}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error creating permission: {e}"))
        
        # Create default role permissions
        self.create_default_role_permissions()
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 Successfully created {created_permissions} permissions'))
    
    def create_default_role_permissions(self):
        """Create default role permission assignments"""
        self.stdout.write('\nCreating default role permissions...')
        
        roles = ['admin', 'contributor', 'viewer']
        permissions = Permission.objects.all()
        
        for role in roles:
            for permission in permissions:
                # Get default value for this role
                if role == 'admin':
                    default_value = permission.admin_default
                elif role == 'contributor':
                    default_value = permission.contributor_default
                else:  # viewer
                    default_value = permission.viewer_default
                
                # Create role permission if it doesn't exist
                role_perm, created = RolePermission.objects.get_or_create(
                    role=role,
                    permission=permission,
                    defaults={'is_granted': default_value}
                )
                
                if created and default_value:
                    self.stdout.write(f"✅ Granted {permission.name} to {role}")
        
        self.stdout.write('✅ Default role permissions created')