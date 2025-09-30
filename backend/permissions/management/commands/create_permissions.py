"""
Management command to create comprehensive RBAC permissions
"""
from django.core.management.base import BaseCommand
from permissions.models import PermissionCategory, Permission, RolePermission


class Command(BaseCommand):
    help = 'Create comprehensive RBAC permissions for the application'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating comprehensive RBAC permissions...'))
        
        # Create permission categories
        categories_data = [
            {'name': 'Dashboard & Navigation', 'description': 'Access to main dashboard and navigation', 'order': 1},
            {'name': 'Location Management', 'description': 'Facility location management', 'order': 2},
            {'name': 'Facility Operations', 'description': 'Facility operations and management', 'order': 3},
            {'name': 'Tank Management', 'description': 'Tank monitoring and management', 'order': 4},
            {'name': 'Release Detection', 'description': 'Environmental monitoring and alerts', 'order': 5},
            {'name': 'Permit Management', 'description': 'Permits and licenses management', 'order': 6},
            {'name': 'User Administration', 'description': 'User account management', 'order': 7},
            {'name': 'System Administration', 'description': 'System configuration and administration', 'order': 8},
        ]
        
        for cat_data in categories_data:
            category, created = PermissionCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f"✅ Created category: {category.name}")
        
        # Create comprehensive permissions
        permissions_data = [
            # Dashboard & Navigation
            {
                'category': 'Dashboard & Navigation',
                'name': 'View Dashboard',
                'code': 'view_dashboard',
                'description': 'Access to main dashboard page',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Dashboard & Navigation',
                'name': 'View Settings',
                'code': 'view_settings',
                'description': 'Access to settings page',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            
            # Location Management
            {
                'category': 'Location Management',
                'name': 'View Locations',
                'code': 'view_locations',
                'description': 'Access to locations tab and view location data',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Location Management',
                'name': 'Add Location',
                'code': 'add_location',
                'description': 'Create new facility locations',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Edit Location',
                'code': 'edit_location',
                'description': 'Modify existing location details',
                'permission_type': 'edit',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Location Management',
                'name': 'Delete Location',
                'code': 'delete_location',
                'description': 'Remove facility locations',
                'permission_type': 'delete',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Facility Operations
            {
                'category': 'Facility Operations',
                'name': 'View Facilities',
                'code': 'view_facilities',
                'description': 'Access to facilities tab and view facility data',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Facility Operations',
                'name': 'Edit Facility Dashboard',
                'code': 'edit_facility_dashboard',
                'description': 'Modify facility dashboard sections',
                'permission_type': 'edit',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Facility Operations',
                'name': 'Configure Facility',
                'code': 'configure_facility',
                'description': 'Configure facility settings and parameters',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Tank Management
            {
                'category': 'Tank Management',
                'name': 'View Tank Management',
                'code': 'view_tank_management',
                'description': 'Access to tank management tab',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Tank Management',
                'name': 'View Tank Data',
                'code': 'view_tank_data',
                'description': 'View tank information and status',
                'permission_type': 'view',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Tank Management',
                'name': 'Add Tank',
                'code': 'add_tank',
                'description': 'Add new tanks to facilities',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Edit Tank',
                'code': 'edit_tank',
                'description': 'Modify tank information and settings',
                'permission_type': 'edit',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Tank Management',
                'name': 'Delete Tank',
                'code': 'delete_tank',
                'description': 'Remove tanks from facilities',
                'permission_type': 'delete',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # Release Detection
            {
                'category': 'Release Detection',
                'name': 'View Release Detection',
                'code': 'view_release_detection',
                'description': 'Access to release detection tab',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Release Detection',
                'name': 'Configure Detection Systems',
                'code': 'configure_detection',
                'description': 'Configure release detection systems',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Release Detection',
                'name': 'Manage Alerts',
                'code': 'manage_alerts',
                'description': 'Manage and respond to alerts',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            
            # Permit Management
            {
                'category': 'Permit Management',
                'name': 'View Permits',
                'code': 'view_permits',
                'description': 'Access to permits and licenses tab',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Permit Management',
                'name': 'Add Permit',
                'code': 'add_permit',
                'description': 'Create new permits and licenses',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Permit Management',
                'name': 'Edit Permit',
                'code': 'edit_permit',
                'description': 'Modify permit information',
                'permission_type': 'edit',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },
            {
                'category': 'Permit Management',
                'name': 'Delete Permit',
                'code': 'delete_permit',
                'description': 'Remove permits and licenses',
                'permission_type': 'delete',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # User Administration
            {
                'category': 'User Administration',
                'name': 'View Admin Panel',
                'code': 'view_admin_panel',
                'description': 'Access to admin panel',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Administration',
                'name': 'View Users',
                'code': 'view_users',
                'description': 'View user list and profiles',
                'permission_type': 'view',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Administration',
                'name': 'Add User',
                'code': 'add_user',
                'description': 'Create new user accounts',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Administration',
                'name': 'Edit User',
                'code': 'edit_user',
                'description': 'Modify user accounts and roles',
                'permission_type': 'edit',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'User Administration',
                'name': 'Delete User',
                'code': 'delete_user',
                'description': 'Remove user accounts',
                'permission_type': 'delete',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            
            # System Administration
            {
                'category': 'System Administration',
                'name': 'Manage Permissions',
                'code': 'manage_permissions',
                'description': 'Configure role permissions',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'System Administration',
                'name': 'System Configuration',
                'code': 'system_config',
                'description': 'Configure system settings',
                'permission_type': 'action',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'System Administration',
                'name': 'View Audit Logs',
                'code': 'view_audit_logs',
                'description': 'View system audit logs',
                'permission_type': 'view',
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