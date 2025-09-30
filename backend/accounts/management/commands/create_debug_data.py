"""
Management command to create minimal debug data for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from facilities.models import Location, Tank, Permit
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create minimal debug data for testing (can be safely deleted)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Remove existing debug data before creating new',
        )
    
    def handle(self, *args, **options):
        if options.get('clean'):
            self.clean_debug_data()
        
        self.create_debug_data()
    
    def clean_debug_data(self):
        """Remove existing debug data"""
        self.stdout.write('🧹 Cleaning existing debug data...')
        
        # Remove debug users
        debug_users = User.objects.filter(username__startswith='debug_')
        count = debug_users.count()
        debug_users.delete()
        self.stdout.write(f'  Removed {count} debug users')
        
        # Remove debug locations
        debug_locations = Location.objects.filter(name__startswith='Debug')
        count = debug_locations.count()
        debug_locations.delete()
        self.stdout.write(f'  Removed {count} debug locations')
    
    def create_debug_data(self):
        """Create minimal debug data"""
        self.stdout.write('📊 Creating debug data...')
        
        # Create debug admin user
        admin_user, created = User.objects.get_or_create(
            username='debug_admin',
            defaults={
                'email': 'debug@facility.com',
                'first_name': 'Debug',
                'last_name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        if created:
            admin_user.set_password('DebugAdmin123!')
            admin_user.save()
            self.stdout.write('  ✅ Created debug admin user')
        
        # Create debug contributor
        contrib_user, created = User.objects.get_or_create(
            username='debug_contributor',
            defaults={
                'email': 'contrib@facility.com',
                'first_name': 'Debug',
                'last_name': 'Contributor',
                'role': 'contributor',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True
            }
        )
        if created:
            contrib_user.set_password('DebugContrib123!')
            contrib_user.save()
            self.stdout.write('  ✅ Created debug contributor user')
        
        # Create debug viewer
        viewer_user, created = User.objects.get_or_create(
            username='debug_viewer',
            defaults={
                'email': 'viewer@facility.com',
                'first_name': 'Debug',
                'last_name': 'Viewer',
                'role': 'viewer',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True
            }
        )
        if created:
            viewer_user.set_password('DebugViewer123!')
            viewer_user.save()
            self.stdout.write('  ✅ Created debug viewer user')
        
        # Create debug location
        location, created = Location.objects.get_or_create(
            name='Debug Test Location',
            defaults={
                'address': '123 Debug Street, Test City, TC 12345',
                'description': 'Test location for debugging purposes',
                'created_by': admin_user,
                'is_active': True
            }
        )
        if created:
            self.stdout.write('  ✅ Created debug location')
        
        # Create debug tank
        tank, created = Tank.objects.get_or_create(
            name='Debug Tank A1',
            location=location,
            defaults={
                'tank_type': 'gasoline',
                'capacity': 10000,
                'current_level': 7500,
                'status': 'active',
                'material': 'Fiberglass'
            }
        )
        if created:
            self.stdout.write('  ✅ Created debug tank')
        
        # Create debug permit
        permit, created = Permit.objects.get_or_create(
            permit_number='DEBUG-2024-001',
            location=location,
            defaults={
                'permit_type': 'operating',
                'issuing_authority': 'Debug Authority',
                'issue_date': date.today(),
                'expiry_date': date.today() + timedelta(days=365),
                'status': 'active',
                'description': 'Debug permit for testing'
            }
        )
        if created:
            self.stdout.write('  ✅ Created debug permit')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('DEBUG CREDENTIALS'))
        self.stdout.write('='*60)
        self.stdout.write('Admin: debug@facility.com / DebugAdmin123!')
        self.stdout.write('Contributor: contrib@facility.com / DebugContrib123!')
        self.stdout.write('Viewer: viewer@facility.com / DebugViewer123!')
        self.stdout.write('='*60)