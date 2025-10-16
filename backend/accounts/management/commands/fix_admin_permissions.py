"""
Management command to fix admin user permissions
Ensures all admin role users have complete access to all permissions
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from permissions.models import Permission, RolePermission


class Command(BaseCommand):
    help = 'Fix admin user permissions - ensure admin role has all permissions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Fix permissions for a specific admin username',
        )

    def handle(self, *args, **options):
        username = options.get('username')

        self.stdout.write(self.style.WARNING('Fixing admin permissions...'))

        try:
            # Get all permissions
            all_permissions = Permission.objects.all()
            permission_count = all_permissions.count()

            if permission_count == 0:
                self.stdout.write(self.style.ERROR('No permissions found in database!'))
                self.stdout.write(self.style.WARNING('Run migrations first: python manage.py migrate'))
                return

            self.stdout.write(f'Found {permission_count} permissions in database')

            # Fix role permissions for admin role
            with transaction.atomic():
                created_count = 0
                updated_count = 0

                for permission in all_permissions:
                    role_perm, created = RolePermission.objects.update_or_create(
                        role='admin',
                        permission=permission,
                        defaults={'is_granted': True}
                    )

                    if created:
                        created_count += 1
                    else:
                        if not role_perm.is_granted:
                            role_perm.is_granted = True
                            role_perm.save()
                            updated_count += 1

                self.stdout.write(self.style.SUCCESS(
                    f'Admin role permissions: {created_count} created, {updated_count} updated'
                ))

            # List admin users
            if username:
                admin_users = User.objects.filter(username=username, role='admin')
                if not admin_users.exists():
                    self.stdout.write(self.style.ERROR(f'No admin user found with username: {username}'))
                    return
            else:
                admin_users = User.objects.filter(role='admin')

            admin_count = admin_users.count()

            if admin_count == 0:
                self.stdout.write(self.style.WARNING('No admin users found'))
                return

            self.stdout.write(f'\nFound {admin_count} admin user(s):')

            for user in admin_users:
                # Ensure user is active and staff
                updates = {}
                if not user.is_active:
                    updates['is_active'] = True
                if not user.is_staff:
                    updates['is_staff'] = True

                if updates:
                    User.objects.filter(pk=user.pk).update(**updates)
                    self.stdout.write(f'  - {user.username}: Updated {", ".join(updates.keys())}')
                else:
                    self.stdout.write(f'  - {user.username}: Already configured correctly')

                # Show user permissions
                user_permissions = user.get_permissions()
                self.stdout.write(f'    Permissions: {len(user_permissions)}/{permission_count}')

            self.stdout.write(self.style.SUCCESS('\n✓ Admin permissions fixed successfully!'))
            self.stdout.write(self.style.SUCCESS('All admin users now have full access to:'))
            self.stdout.write('  - All locations in their organization')
            self.stdout.write('  - All navigation tabs and features')
            self.stdout.write('  - Complete facility and tank data')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fixing admin permissions: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())
