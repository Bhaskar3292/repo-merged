"""
Management command to setup admin user with full permissions
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from accounts.models import User, Organization
from facilities.models import Location, Tank, Permit
from permissions.models import Permission, RolePermission


class Command(BaseCommand):
    help = 'Setup admin user with full permissions and sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username (default: admin)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help='Admin email',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Admin@123456',
            help='Admin password',
        )
        parser.add_argument(
            '--create-sample-data',
            action='store_true',
            help='Create sample locations, tanks, and permits',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        create_sample = options['create_sample_data']

        self.stdout.write(self.style.SUCCESS('\n🔧 Setting up admin user...\n'))

        with transaction.atomic():
            # Step 1: Ensure organization exists
            org = self._ensure_organization()

            # Step 2: Seed permissions (if not already done)
            self._seed_permissions()

            # Step 3: Create or update admin user
            admin_user = self._setup_admin_user(username, email, password, org)

            # Step 4: Create sample data if requested
            if create_sample:
                self._create_sample_data(admin_user, org)

            # Step 5: Verify admin permissions
            self._verify_admin_setup(admin_user)

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Admin setup complete!\n'
            f'\n📝 Login Credentials:'
            f'\n   Username: {admin_user.username}'
            f'\n   Email: {admin_user.email}'
            f'\n   Password: {password}'
            f'\n   Organization: {admin_user.organization.name if admin_user.organization else "None"}'
            f'\n\n🔑 Permissions: {len(admin_user.get_permissions())} granted'
            f'\n📊 Organization: {org.name}'
            f'\n📍 Locations: {Location.objects.filter(organization=org).count()}'
            f'\n🛢️  Tanks: {Tank.objects.count()}'
            f'\n📄 Permits: {Permit.objects.count()}'
        ))

    def _ensure_organization(self):
        """Ensure default organization exists"""
        org, created = Organization.objects.get_or_create(
            name='Default Organization',
            defaults={'slug': 'default-organization'}
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Created organization: Default Organization'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ Using existing organization: Default Organization'))

        return org

    def _seed_permissions(self):
        """Seed RBAC permissions"""
        self.stdout.write('  ⏳ Checking permissions...')

        # Check if permissions exist
        perm_count = Permission.objects.count()

        if perm_count == 0:
            self.stdout.write('  ⏳ Seeding permissions...')
            # Run seed_rbac if available
            from django.core.management import call_command
            try:
                call_command('seed_rbac')
                self.stdout.write(self.style.SUCCESS('  ✓ Permissions seeded'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Could not seed permissions: {e}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Permissions already exist ({perm_count} permissions)'))

    def _setup_admin_user(self, username, email, password, org):
        """Create or update admin user"""
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f'  ✓ Found existing user: {username}')

            # Update user to admin with all settings
            user.role = 'admin'
            user.email = email
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True  # Make superuser for maximum access
            user.organization = org
            user.set_password(password)
            user.save()

            self.stdout.write(self.style.SUCCESS('  ✓ Updated user to admin with full permissions'))

        except User.DoesNotExist:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='admin',
                is_active=True,
                is_staff=True,
                is_superuser=True,
                organization=org
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created admin user: {username}'))

        return user

    def _create_sample_data(self, admin_user, org):
        """Create sample locations, tanks, and permits"""
        self.stdout.write('\n  ⏳ Creating sample data...')

        # Create locations
        locations_data = [
            {'name': 'Main Facility - PA', 'address': '123 Main St, Philadelphia, PA 19019', 'state': 'PA'},
            {'name': 'North Station - PA', 'address': '456 North Ave, Pittsburgh, PA 15213', 'state': 'PA'},
            {'name': 'Delaware Depot - DE', 'address': '789 Market St, Wilmington, DE 19801', 'state': 'DE'},
        ]

        created_locations = []
        for loc_data in locations_data:
            location, created = Location.objects.get_or_create(
                name=loc_data['name'],
                organization=org,
                defaults={
                    'address': loc_data['address'],
                    'state': loc_data.get('state', 'PA'),
                    'is_active': True,
                    'created_by': admin_user
                }
            )

            if created:
                created_locations.append(location)
                self.stdout.write(f'    ✓ Created location: {location.name}')

                # Create tanks for this location
                for i in range(1, 4):
                    tank, tank_created = Tank.objects.get_or_create(
                        location=location,
                        tank_number=f'{i}',
                        defaults={
                            'name': f'Tank {i}',
                            'capacity': 10000 + (i * 1000),
                            'product_type': 'Gasoline' if i % 2 == 0 else 'Diesel',
                            'status': 'active',
                            'installation_date': timezone.now().date()
                        }
                    )
                    if tank_created:
                        self.stdout.write(f'      ✓ Created tank: {tank.name}')

                # Create permits for this location
                for i in range(1, 3):
                    permit, permit_created = Permit.objects.get_or_create(
                        location=location,
                        permit_number=f'PERMIT-{location.id}-{i}',
                        defaults={
                            'permit_type': 'Operating' if i == 1 else 'Environmental',
                            'issue_date': timezone.now().date(),
                            'expiry_date': (timezone.now() + timezone.timedelta(days=365)).date(),
                            'status': 'active'
                        }
                    )
                    if permit_created:
                        self.stdout.write(f'      ✓ Created permit: {permit.permit_number}')

        if created_locations:
            self.stdout.write(self.style.SUCCESS(
                f'\n  ✓ Created {len(created_locations)} locations with tanks and permits'
            ))
        else:
            self.stdout.write(self.style.WARNING('  ⚠ Sample data already exists'))

    def _verify_admin_setup(self, admin_user):
        """Verify admin has correct configuration"""
        self.stdout.write('\n  ⏳ Verifying admin setup...')

        checks = {
            'Is Active': admin_user.is_active,
            'Is Staff': admin_user.is_staff,
            'Is Superuser': admin_user.is_superuser,
            'Role is Admin': admin_user.role == 'admin',
            'Has Organization': admin_user.organization is not None,
        }

        all_passed = True
        for check_name, passed in checks.items():
            if passed:
                self.stdout.write(f'    ✓ {check_name}')
            else:
                self.stdout.write(self.style.ERROR(f'    ✗ {check_name}'))
                all_passed = False

        # Check permissions
        permissions = admin_user.get_permissions()
        if len(permissions) > 0:
            self.stdout.write(f'    ✓ Has {len(permissions)} permissions')
        else:
            self.stdout.write(self.style.WARNING('    ⚠ No permissions found (may need to run seed_rbac)'))

        if all_passed:
            self.stdout.write(self.style.SUCCESS('  ✓ All checks passed'))
        else:
            self.stdout.write(self.style.ERROR('  ✗ Some checks failed'))
