"""
Seed permissions, categories, and role-permission mappings
Creates all initial permission data for the RBAC system
"""
from django.db import migrations


def seed_permissions(apps, schema_editor):
    """Create categories, permissions, and role mappings"""
    PermissionCategory = apps.get_model('permissions', 'PermissionCategory')
    Permission = apps.get_model('permissions', 'Permission')
    RolePermission = apps.get_model('permissions', 'RolePermission')

    # Create categories
    categories_data = [
        {'name': 'Locations', 'description': 'Location and facility management', 'order': 1},
        {'name': 'Facilities', 'description': 'Facility operations', 'order': 2},
        {'name': 'Tanks', 'description': 'Tank monitoring and management', 'order': 3},
        {'name': 'Permits', 'description': 'Permits and licenses', 'order': 4},
        {'name': 'Testing', 'description': 'Tank testing and compliance', 'order': 5},
        {'name': 'Commander', 'description': 'Commander information', 'order': 6},
        {'name': 'Settings', 'description': 'System settings', 'order': 7},
        {'name': 'Admin', 'description': 'Administrative functions', 'order': 8},
    ]

    categories = {}
    for cat_data in categories_data:
        category, _ = PermissionCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'description': cat_data['description'],
                'order': cat_data['order']
            }
        )
        categories[cat_data['name']] = category

    # Create permissions
    permissions_data = [
        # Locations
        {'category': 'Locations', 'code': 'locations:read', 'name': 'View Locations',
         'description': 'Can view location list and details', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Locations', 'code': 'locations:write', 'name': 'Manage Locations',
         'description': 'Can create, edit, and delete locations', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Facilities
        {'category': 'Facilities', 'code': 'facilities:read', 'name': 'View Facilities',
         'description': 'Can view facility information', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Facilities', 'code': 'facilities:write', 'name': 'Manage Facilities',
         'description': 'Can edit facility information', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Tanks
        {'category': 'Tanks', 'code': 'tanks:read', 'name': 'View Tanks',
         'description': 'Can view tank information', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Tanks', 'code': 'tanks:write', 'name': 'Manage Tanks',
         'description': 'Can create, edit, and delete tanks', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Permits
        {'category': 'Permits', 'code': 'permits:read', 'name': 'View Permits',
         'description': 'Can view permits and licenses', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Permits', 'code': 'permits:write', 'name': 'Manage Permits',
         'description': 'Can create and edit permits', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Testing
        {'category': 'Testing', 'code': 'testing:read', 'name': 'View Testing Data',
         'description': 'Can view tank testing records', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Testing', 'code': 'testing:write', 'name': 'Manage Testing',
         'description': 'Can create and update testing records', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Commander
        {'category': 'Commander', 'code': 'commander:read', 'name': 'View Commander Info',
         'description': 'Can view commander information', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': True, 'viewer_default': True},
        {'category': 'Commander', 'code': 'commander:write', 'name': 'Manage Commander Info',
         'description': 'Can edit commander information', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': True, 'viewer_default': False},

        # Settings
        {'category': 'Settings', 'code': 'settings:read', 'name': 'View Settings',
         'description': 'Can view system settings', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': False, 'viewer_default': False},
        {'category': 'Settings', 'code': 'settings:write', 'name': 'Manage Settings',
         'description': 'Can modify system settings', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': False, 'viewer_default': False},

        # Admin
        {'category': 'Admin', 'code': 'admin:read', 'name': 'View Admin Panel',
         'description': 'Can access admin panel', 'permission_type': 'page',
         'admin_default': True, 'contributor_default': False, 'viewer_default': False},
        {'category': 'Admin', 'code': 'admin:write', 'name': 'Manage Users',
         'description': 'Can create and manage users', 'permission_type': 'button',
         'admin_default': True, 'contributor_default': False, 'viewer_default': False},
    ]

    permissions = {}
    for perm_data in permissions_data:
        category_name = perm_data.pop('category')
        permission, _ = Permission.objects.get_or_create(
            code=perm_data['code'],
            defaults={
                **perm_data,
                'category': categories[category_name]
            }
        )
        permissions[perm_data['code']] = permission

    # Create role-permission mappings for all three roles
    for permission in permissions.values():
        # Administrator - all permissions granted
        RolePermission.objects.get_or_create(
            role='admin',
            permission=permission,
            defaults={'is_granted': True}
        )

        # Contributor - based on contributor_default
        RolePermission.objects.get_or_create(
            role='contributor',
            permission=permission,
            defaults={'is_granted': permission.contributor_default}
        )

        # Viewer - based on viewer_default
        RolePermission.objects.get_or_create(
            role='viewer',
            permission=permission,
            defaults={'is_granted': permission.viewer_default}
        )


def reverse_seed(apps, schema_editor):
    """Remove seeded data"""
    RolePermission = apps.get_model('permissions', 'RolePermission')
    Permission = apps.get_model('permissions', 'Permission')
    PermissionCategory = apps.get_model('permissions', 'PermissionCategory')

    RolePermission.objects.all().delete()
    Permission.objects.all().delete()
    PermissionCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_seed),
    ]
