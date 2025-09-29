"""
Management command to debug API endpoints and data flow
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
from facilities.models import Location, Tank, Permit
from permissions.models import Permission, PermissionCategory
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Debug API endpoints and data flow'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create minimal test data for debugging',
        )
        parser.add_argument(
            '--test-endpoints',
            action='store_true',
            help='Test all API endpoints',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 API Debug Tool'))
        self.stdout.write('=' * 60)
        
        if options.get('create_test_data'):
            self.create_test_data()
        
        if options.get('test_endpoints'):
            self.test_endpoints()
        
        # Always run basic checks
        self.check_database_data()
        self.check_permissions()
        self.test_basic_endpoints()
    
    def create_test_data(self):
        """Create minimal test data for debugging"""
        self.stdout.write('\n📊 Creating Test Data:')
        
        # Create admin user if doesn't exist
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
        else:
            self.stdout.write('  ℹ️  Debug admin user already exists')
        
        # Create test location
        location, created = Location.objects.get_or_create(
            name='Debug Test Location',
            defaults={
                'address': '123 Debug Street, Test City, TC 12345',
                'description': 'Test location for debugging purposes',
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write('  ✅ Created debug location')
        else:
            self.stdout.write('  ℹ️  Debug location already exists')
        
        # Create test tank
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
        else:
            self.stdout.write('  ℹ️  Debug tank already exists')
        
        # Create test permit
        from datetime import date, timedelta
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
        else:
            self.stdout.write('  ℹ️  Debug permit already exists')
        
        self.stdout.write(f'\n📝 Debug Credentials:')
        self.stdout.write(f'  Username: debug_admin')
        self.stdout.write(f'  Email: debug@facility.com')
        self.stdout.write(f'  Password: DebugAdmin123!')
    
    def check_database_data(self):
        """Check what data exists in the database"""
        self.stdout.write('\n📊 Database Data Check:')
        
        user_count = User.objects.count()
        location_count = Location.objects.count()
        tank_count = Tank.objects.count()
        permit_count = Permit.objects.count()
        permission_count = Permission.objects.count()
        
        self.stdout.write(f'  👥 Users: {user_count}')
        self.stdout.write(f'  📍 Locations: {location_count}')
        self.stdout.write(f'  🛢️  Tanks: {tank_count}')
        self.stdout.write(f'  📄 Permits: {permit_count}')
        self.stdout.write(f'  🔐 Permissions: {permission_count}')
        
        if user_count == 0:
            self.stdout.write('  ⚠️  No users found - create admin user first')
        
        if location_count == 0:
            self.stdout.write('  ⚠️  No locations found - this might explain empty location tab')
        
        # Show sample data
        if location_count > 0:
            self.stdout.write('\n📍 Sample Locations:')
            for location in Location.objects.all()[:3]:
                self.stdout.write(f'  - {location.name} (ID: {location.id})')
        
        if user_count > 0:
            self.stdout.write('\n👥 Sample Users:')
            for user in User.objects.all()[:3]:
                self.stdout.write(f'  - {user.username} ({user.role}) - Active: {user.is_active}')
    
    def check_permissions(self):
        """Check permission setup"""
        self.stdout.write('\n🔐 Permission Check:')
        
        categories = PermissionCategory.objects.count()
        permissions = Permission.objects.count()
        
        self.stdout.write(f'  📂 Categories: {categories}')
        self.stdout.write(f'  🔑 Permissions: {permissions}')
        
        if permissions == 0:
            self.stdout.write('  ⚠️  No permissions found - run create_default_permissions')
    
    def test_basic_endpoints(self):
        """Test basic API endpoints without authentication"""
        self.stdout.write('\n🌐 Basic Endpoint Tests:')
        
        client = Client()
        
        # Test health endpoint
        try:
            response = client.get('/api/health/')
            self.stdout.write(f'  ✅ Health endpoint: {response.status_code}')
        except Exception as e:
            self.stdout.write(f'  ❌ Health endpoint error: {e}')
    
    def test_endpoints(self):
        """Test all API endpoints with authentication"""
        self.stdout.write('\n🧪 Authenticated Endpoint Tests:')
        
        # Get or create admin user for testing
        try:
            admin_user = User.objects.filter(role='admin', is_active=True).first()
            if not admin_user:
                self.stdout.write('  ❌ No admin user found for testing')
                return
            
            client = Client()
            client.force_login(admin_user)
            
            # Test endpoints
            endpoints = [
                ('/api/facilities/locations/', 'Locations'),
                ('/api/auth/users/', 'Users'),
                ('/api/facilities/tanks/', 'Tanks'),
                ('/api/facilities/permits/', 'Permits'),
                ('/api/permissions/user/permissions/', 'User Permissions'),
                ('/api/facilities/stats/', 'Dashboard Stats'),
            ]
            
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint)
                    if response.status_code == 200:
                        data = response.json() if hasattr(response, 'json') else None
                        if isinstance(data, list):
                            self.stdout.write(f'  ✅ {name}: {response.status_code} - {len(data)} items')
                        elif isinstance(data, dict):
                            self.stdout.write(f'  ✅ {name}: {response.status_code} - dict with {len(data)} keys')
                        else:
                            self.stdout.write(f'  ✅ {name}: {response.status_code}')
                    else:
                        self.stdout.write(f'  ❌ {name}: {response.status_code}')
                        if hasattr(response, 'content'):
                            self.stdout.write(f'     Error: {response.content.decode()[:100]}')
                except Exception as e:
                    self.stdout.write(f'  ❌ {name}: Exception - {e}')
        
        except Exception as e:
            self.stdout.write(f'  ❌ Authentication setup failed: {e}')