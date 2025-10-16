"""
Management command to seed RBAC roles and permissions
Idempotent - can be run multiple times safely
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from permissions.models import Permission, RolePermission, PermissionCategory


class Command(BaseCommand):
    help = 'Seed RBAC roles and permissions (idempotent)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting RBAC seed...'))

        with transaction.atomic():
            # Create permission categories
            categories = self._create_categories()

            # Create permissions
            permissions_created = self._create_permissions(categories)

            # Assign all permissions to Administrator role
            admin_perms_created = self._assign_admin_permissions()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ RBAC seed completed successfully!\n'
            f'   - Permissions created/verified: {permissions_created}\n'
            f'   - Admin role permissions: {admin_perms_created}'
        ))

    def _create_categories(self):
        """Create permission categories"""
        categories_data = {
            'Locations': {'description': 'Location and facility management', 'order': 1},
            'Facilities': {'description': 'Facility operations', 'order': 2},
            'Tanks': {'description': 'Tank monitoring and management', 'order': 3},
            'Permits': {'description': 'Permits and licenses', 'order': 4},
            'Testing': {'description': 'Tank testing and compliance', 'order': 5},
            'Commander': {'description': 'Commander information', 'order': 6},
            'Settings': {'description': 'System settings', 'order': 7},
            'Admin': {'description': 'Administrative functions', 'order': 8},
        }

        categories = {}
        for name, data in categories_data.items():
            category, created = PermissionCategory.objects.get_or_create(
                name=name,
                defaults=data
            )
            categories[name] = category
            status = '✓ Created' if created else '✓ Exists'
            self.stdout.write(f'  {status}: Category "{name}"')

        return categories

    def _create_permissions(self, categories):
        """Create all permissions with proper defaults"""
        permissions_data = [
            # Locations
            {
                'category': 'Locations',
                'code': 'locations:read',
                'name': 'View Locations',
                'description': 'Can view location list and details',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Locations',
                'code': 'locations:write',
                'name': 'Manage Locations',
                'description': 'Can create, edit, and delete locations',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Facilities
            {
                'category': 'Facilities',
                'code': 'facilities:read',
                'name': 'View Facilities',
                'description': 'Can view facility information',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Facilities',
                'code': 'facilities:write',
                'name': 'Manage Facilities',
                'description': 'Can edit facility information',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Tanks
            {
                'category': 'Tanks',
                'code': 'tanks:read',
                'name': 'View Tanks',
                'description': 'Can view tank information',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Tanks',
                'code': 'tanks:write',
                'name': 'Manage Tanks',
                'description': 'Can create, edit, and delete tanks',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Permits
            {
                'category': 'Permits',
                'code': 'permits:read',
                'name': 'View Permits',
                'description': 'Can view permits and licenses',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Permits',
                'code': 'permits:write',
                'name': 'Manage Permits',
                'description': 'Can create, edit, and delete permits',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Testing
            {
                'category': 'Testing',
                'code': 'testing:read',
                'name': 'View Testing Data',
                'description': 'Can view tank testing records',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Testing',
                'code': 'testing:write',
                'name': 'Manage Testing',
                'description': 'Can create and update testing records',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Commander
            {
                'category': 'Commander',
                'code': 'commander:read',
                'name': 'View Commander Info',
                'description': 'Can view commander information',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': True,
            },
            {
                'category': 'Commander',
                'code': 'commander:write',
                'name': 'Manage Commander Info',
                'description': 'Can edit commander information',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': True,
                'viewer_default': False,
            },

            # Settings
            {
                'category': 'Settings',
                'code': 'settings:read',
                'name': 'View Settings',
                'description': 'Can view system settings',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'Settings',
                'code': 'settings:write',
                'name': 'Manage Settings',
                'description': 'Can modify system settings',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },

            # Admin
            {
                'category': 'Admin',
                'code': 'admin:read',
                'name': 'View Admin Panel',
                'description': 'Can access admin panel',
                'permission_type': 'page',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
            {
                'category': 'Admin',
                'code': 'admin:write',
                'name': 'Manage Users',
                'description': 'Can create and manage users',
                'permission_type': 'button',
                'admin_default': True,
                'contributor_default': False,
                'viewer_default': False,
            },
        ]

        created_count = 0
        for perm_data in permissions_data:
            category_name = perm_data.pop('category')
            category = categories[category_name]

            permission, created = Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={**perm_data, 'category': category}
            )

            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created: {permission.code}')
            else:
                # Update existing permission
                for key, value in perm_data.items():
                    setattr(permission, key, value)
                permission.category = category
                permission.save()
                self.stdout.write(f'  ✓ Updated: {permission.code}')

        return created_count

    def _assign_admin_permissions(self):
        """Assign all permissions to Administrator role"""
        all_permissions = Permission.objects.all()
        assigned_count = 0

        for permission in all_permissions:
            role_perm, created = RolePermission.objects.get_or_create(
                role='admin',
                permission=permission,
                defaults={'is_granted': True}
            )

            if not created and not role_perm.is_granted:
                role_perm.is_granted = True
                role_perm.save()
                created = True

            if created:
                assigned_count += 1

        self.stdout.write(f'\n  ✓ Administrator role has {all_permissions.count()} permissions')
        return assigned_count
