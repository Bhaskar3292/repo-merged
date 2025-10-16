"""
Management command to check admin access and diagnose issues
"""
from django.core.management.base import BaseCommand
from accounts.models import User, Organization
from facilities.models import Location, Tank, Permit
from permissions.models import Permission, RolePermission


class Command(BaseCommand):
    help = 'Check admin user access and diagnose permission issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username to check (default: admin)',
        )

    def handle(self, *args, **options):
        username = options['username']

        self.stdout.write(self.style.SUCCESS(f'\n🔍 Checking access for: {username}\n'))

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User "{username}" not found!'))
            self.stdout.write('\n💡 Create admin user with: python manage.py setup_admin')
            return

        # User Information
        self.stdout.write(self.style.SUCCESS('👤 USER INFORMATION:'))
        self.stdout.write(f'   Username: {user.username}')
        self.stdout.write(f'   Email: {user.email}')
        self.stdout.write(f'   Role: {user.get_role_display()}')
        self.stdout.write(f'   Is Active: {user.is_active} {"✓" if user.is_active else "✗"}')
        self.stdout.write(f'   Is Staff: {user.is_staff} {"✓" if user.is_staff else "✗"}')
        self.stdout.write(f'   Is Superuser: {user.is_superuser} {"✓" if user.is_superuser else "✗"}')

        # Organization
        self.stdout.write(self.style.SUCCESS('\n🏢 ORGANIZATION:'))
        if user.organization:
            self.stdout.write(f'   ✓ Organization: {user.organization.name}')
            self.stdout.write(f'   ✓ Organization ID: {user.organization.id}')
        else:
            self.stdout.write(self.style.ERROR('   ✗ No organization assigned!'))
            self.stdout.write('   💡 Fix: Run python manage.py setup_admin')

        # Permissions
        self.stdout.write(self.style.SUCCESS('\n🔑 PERMISSIONS:'))
        permissions = user.get_permissions()
        if permissions:
            self.stdout.write(f'   ✓ Total Permissions: {len(permissions)}')

            # Group by category
            categories = {}
            for perm_code in permissions:
                category = perm_code.split(':')[0]
                if category not in categories:
                    categories[category] = []
                categories[category].append(perm_code)

            for category, perms in sorted(categories.items()):
                self.stdout.write(f'\n   {category.upper()}:')
                for perm in sorted(perms):
                    self.stdout.write(f'     • {perm}')
        else:
            self.stdout.write(self.style.ERROR('   ✗ No permissions found!'))
            self.stdout.write('   💡 Fix: Run python manage.py seed_rbac')

        # Data Access
        self.stdout.write(self.style.SUCCESS('\n📊 DATA ACCESS:'))

        # Check locations
        if user.organization:
            locations = Location.objects.filter(organization=user.organization, is_active=True)
        else:
            locations = Location.objects.filter(is_active=True)

        location_count = locations.count()
        self.stdout.write(f'   Accessible Locations: {location_count}')

        if location_count > 0:
            self.stdout.write('   Recent Locations:')
            for loc in locations[:5]:
                tank_count = Tank.objects.filter(location=loc).count()
                permit_count = Permit.objects.filter(location=loc).count()
                self.stdout.write(
                    f'     • {loc.name} (Tanks: {tank_count}, Permits: {permit_count})'
                )
        else:
            self.stdout.write(self.style.WARNING('   ⚠ No locations found!'))
            self.stdout.write('   💡 Fix: Run python manage.py setup_admin --create-sample-data')

        # Total counts
        total_tanks = Tank.objects.count()
        total_permits = Permit.objects.count()
        total_orgs = Organization.objects.count()

        self.stdout.write(f'\n   Total Tanks: {total_tanks}')
        self.stdout.write(f'   Total Permits: {total_permits}')
        self.stdout.write(f'   Total Organizations: {total_orgs}')

        # Dashboard stats
        self.stdout.write(self.style.SUCCESS('\n📈 DASHBOARD STATS:'))
        if user.organization:
            org_locations = Location.objects.filter(organization=user.organization, is_active=True).count()
            self.stdout.write(f'   Organization Locations: {org_locations}')

        active_tanks = Tank.objects.filter(status='active').count()
        self.stdout.write(f'   Active Tanks: {active_tanks}')

        from django.utils import timezone
        expiring_permits = Permit.objects.filter(
            expiry_date__lte=timezone.now().date() + timezone.timedelta(days=30)
        ).count()
        self.stdout.write(f'   Expiring Permits (30 days): {expiring_permits}')

        # Issues Summary
        issues = []
        if not user.is_active:
            issues.append('User is not active')
        if not user.is_staff and user.role == 'admin':
            issues.append('Admin user should have is_staff=True')
        if not user.organization:
            issues.append('No organization assigned')
        if not permissions:
            issues.append('No permissions assigned')
        if location_count == 0:
            issues.append('No accessible locations')

        if issues:
            self.stdout.write(self.style.ERROR('\n❌ ISSUES FOUND:'))
            for issue in issues:
                self.stdout.write(f'   • {issue}')
            self.stdout.write(self.style.WARNING('\n💡 FIX ALL ISSUES:'))
            self.stdout.write('   python manage.py setup_admin --create-sample-data')
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ No issues found! Admin has full access.'))

        # Quick fix commands
        self.stdout.write(self.style.SUCCESS('\n🔧 QUICK FIX COMMANDS:'))
        self.stdout.write('   Setup admin with sample data:')
        self.stdout.write('   → python manage.py setup_admin --create-sample-data')
        self.stdout.write('\n   Just seed permissions:')
        self.stdout.write('   → python manage.py seed_rbac')
        self.stdout.write('\n   Check specific user:')
        self.stdout.write('   → python manage.py check_admin_access --username=youruser')
