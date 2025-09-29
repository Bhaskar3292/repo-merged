"""
Management command to diagnose the user management API issue
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.test import Client
from django.db import connection
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Diagnose user management API issues'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 User Management API Diagnosis'))
        self.stdout.write('=' * 60)
        
        # 1. Check user model configuration
        self.check_user_model()
        
        # 2. Check database data
        self.check_database_users()
        
        # 3. Test API endpoint
        self.test_user_api()
        
        # 4. Check permissions
        self.check_permissions()
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✅ Diagnosis Complete'))
    
    def check_user_model(self):
        """Check user model configuration"""
        self.stdout.write('\n👤 User Model Check:')
        self.stdout.write(f'  Model: {User.__name__}')
        self.stdout.write(f'  Module: {User.__module__}')
        self.stdout.write(f'  Table: {User._meta.db_table}')
        
        # Check if custom user model
        from django.conf import settings
        auth_model = getattr(settings, 'AUTH_USER_MODEL', 'auth.User')
        self.stdout.write(f'  AUTH_USER_MODEL: {auth_model}')
    
    def check_database_users(self):
        """Check users in database"""
        self.stdout.write('\n📊 Database Users:')
        
        try:
            total_users = User.objects.count()
            self.stdout.write(f'  Total users: {total_users}')
            
            if total_users > 0:
                self.stdout.write('\n  User Details:')
                for user in User.objects.all():
                    self.stdout.write(f'    - {user.username} ({user.email}) - Role: {user.role} - Active: {user.is_active}')
                
                # Check role distribution
                roles = {}
                for user in User.objects.all():
                    roles[user.role] = roles.get(user.role, 0) + 1
                self.stdout.write(f'\n  Role Distribution: {roles}')
                
                # Check admin users specifically
                admin_users = User.objects.filter(role='admin')
                self.stdout.write(f'  Admin users: {admin_users.count()}')
                for admin in admin_users:
                    self.stdout.write(f'    - {admin.username} (superuser: {admin.is_superuser})')
            else:
                self.stdout.write('  ❌ No users found in database')
                
        except Exception as e:
            self.stdout.write(f'  ❌ Error querying users: {e}')
    
    def test_user_api(self):
        """Test user API endpoint"""
        self.stdout.write('\n🌐 API Endpoint Test:')
        
        try:
            # Get admin user for testing
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                admin_user = User.objects.filter(is_superuser=True).first()
            
            if not admin_user:
                self.stdout.write('  ❌ No admin user found for testing')
                return
            
            client = Client()
            client.force_login(admin_user)
            
            # Test users endpoint
            response = client.get('/api/auth/users/')
            self.stdout.write(f'  Status Code: {response.status_code}')
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.stdout.write(f'  Response Type: {type(data)}')
                    if isinstance(data, list):
                        self.stdout.write(f'  Users Returned: {len(data)}')
                        if data:
                            self.stdout.write(f'  Sample User Keys: {list(data[0].keys())}')
                    else:
                        self.stdout.write(f'  Response: {data}')
                except Exception as e:
                    self.stdout.write(f'  ❌ JSON Parse Error: {e}')
                    self.stdout.write(f'  Raw Response: {response.content.decode()[:200]}')
            else:
                self.stdout.write(f'  ❌ Error Response: {response.content.decode()}')
                
        except Exception as e:
            self.stdout.write(f'  ❌ API Test Error: {e}')
    
    def check_permissions(self):
        """Check permission setup"""
        self.stdout.write('\n🔐 Permission Check:')
        
        try:
            from permissions.models import Permission, PermissionCategory
            
            categories = PermissionCategory.objects.count()
            permissions = Permission.objects.count()
            
            self.stdout.write(f'  Categories: {categories}')
            self.stdout.write(f'  Permissions: {permissions}')
            
            if permissions == 0:
                self.stdout.write('  ⚠️  No permissions found - run create_default_permissions')
            else:
                # Show sample permissions
                sample_perms = Permission.objects.all()[:5]
                self.stdout.write('  Sample Permissions:')
                for perm in sample_perms:
                    self.stdout.write(f'    - {perm.code}: {perm.name}')
                    
        except Exception as e:
            self.stdout.write(f'  ❌ Permission check error: {e}')