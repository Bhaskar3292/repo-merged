"""
Management command to debug data flow and API endpoints
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
    help = 'Debug data flow and API endpoints'
    
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
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
    
    def handle(self, *args, **options):
        self.verbose = options.get('verbose', False)
        
        self.stdout.write(self.style.SUCCESS('🔍 Data Flow Debug Tool'))
        self.stdout.write('=' * 60)
        
        # Check database data
        self.check_database_data()
        
        # Create test data if requested
        if options.get('create_test_data'):
            self.create_test_data()
        
        # Test endpoints if requested
        if options.get('test_endpoints'):
            self.test_all_endpoints()
        
        # Always run basic checks
        self.check_permissions()
        self.test_basic_endpoints()
        self.provide_curl_examples()
    
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
            self.stdout.write('  ⚠️  No locations found - this explains empty location tab')
        
        # Show sample data if verbose
        if self.verbose:
            if location_count > 0:
                self.stdout.write('\n📍 Sample Locations:')
                for location in Location.objects.all()[:5]:
                    self.stdout.write(f'  - {location.name} (ID: {location.id}, Active: {location.is_active})')
            
            if user_count > 0:
                self.stdout.write('\n👥 Sample Users:')
                for user in User.objects.all()[:5]:
                    self.stdout.write(f'  - {user.username} ({user.role}) - Active: {user.is_active}')
    
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
        
        # Create test location
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
        
        # Create test permit
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
        
        self.stdout.write(f'\n📝 Debug Credentials:')
        self.stdout.write(f'  Username: debug_admin')
        self.stdout.write(f'  Email: debug@facility.com')
        self.stdout.write(f'  Password: DebugAdmin123!')
    
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
            if self.verbose:
                self.stdout.write(f'     Response: {response.content.decode()}')
        except Exception as e:
            self.stdout.write(f'  ❌ Health endpoint error: {e}')
    
    def test_all_endpoints(self):
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
                        try:
                            data = response.json()
                            if isinstance(data, list):
                                self.stdout.write(f'  ✅ {name}: {response.status_code} - {len(data)} items')
                                if self.verbose and len(data) > 0:
                                    self.stdout.write(f'     Sample: {json.dumps(data[0], indent=2)[:200]}...')
                            elif isinstance(data, dict):
                                self.stdout.write(f'  ✅ {name}: {response.status_code} - dict with {len(data)} keys')
                                if self.verbose:
                                    self.stdout.write(f'     Keys: {list(data.keys())}')
                            else:
                                self.stdout.write(f'  ✅ {name}: {response.status_code}')
                        except:
                            self.stdout.write(f'  ✅ {name}: {response.status_code} - non-JSON response')
                    else:
                        self.stdout.write(f'  ❌ {name}: {response.status_code}')
                        if self.verbose and hasattr(response, 'content'):
                            self.stdout.write(f'     Error: {response.content.decode()[:200]}')
                except Exception as e:
                    self.stdout.write(f'  ❌ {name}: Exception - {e}')
        
        except Exception as e:
            self.stdout.write(f'  ❌ Authentication setup failed: {e}')
    
    def provide_curl_examples(self):
        """Provide curl examples for testing endpoints"""
        self.stdout.write('\n🌐 CURL Test Examples:')
        self.stdout.write('=' * 40)
        
        # Get admin user token for examples
        admin_user = User.objects.filter(role='admin', is_active=True).first()
        if admin_user:
            self.stdout.write(f'\n1. First, get authentication token:')
            self.stdout.write(f'curl -X POST http://localhost:8000/api/auth/login/ \\')
            self.stdout.write(f'  -H "Content-Type: application/json" \\')
            self.stdout.write(f'  -d \'{{"email": "{admin_user.email}", "password": "YOUR_PASSWORD"}}\'')
            
            self.stdout.write(f'\n2. Test endpoints with token:')
            
            endpoints = [
                ('locations', '/api/facilities/locations/'),
                ('users', '/api/auth/users/'),
                ('tanks', '/api/facilities/tanks/'),
                ('permits', '/api/facilities/permits/'),
                ('stats', '/api/facilities/stats/'),
            ]
            
            for name, endpoint in endpoints:
                self.stdout.write(f'\n# Test {name}:')
                self.stdout.write(f'curl -X GET http://localhost:8000{endpoint} \\')
                self.stdout.write(f'  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\')
                self.stdout.write(f'  -H "Content-Type: application/json"')
        else:
            self.stdout.write('  ⚠️  No admin user found - create one first')
        
        self.stdout.write(f'\n3. Test health endpoint (no auth required):')
        self.stdout.write(f'curl -X GET http://localhost:8000/api/health/')