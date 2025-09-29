"""
Management command to diagnose user model configuration and data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import connection
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Diagnose user model configuration and data storage'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 User Model Diagnosis'))
        self.stdout.write('=' * 60)
        
        # 1. Check AUTH_USER_MODEL setting
        self.check_auth_user_model()
        
        # 2. Check actual user model
        self.check_user_model()
        
        # 3. Check database tables
        self.check_database_tables()
        
        # 4. Check user data
        self.check_user_data()
        
        # 5. Test API endpoint
        self.test_api_endpoint()
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✅ Diagnosis Complete'))
    
    def check_auth_user_model(self):
        """Check AUTH_USER_MODEL setting"""
        self.stdout.write('\n📋 AUTH_USER_MODEL Configuration:')
        auth_user_model = getattr(settings, 'AUTH_USER_MODEL', 'auth.User')
        self.stdout.write(f'  Setting: {auth_user_model}')
        
        if auth_user_model == 'auth.User':
            self.stdout.write('  ⚠️  Using default Django User model')
        else:
            self.stdout.write(f'  ✅ Using custom User model: {auth_user_model}')
    
    def check_user_model(self):
        """Check the actual user model being used"""
        self.stdout.write('\n👤 Active User Model:')
        self.stdout.write(f'  Model: {User.__name__}')
        self.stdout.write(f'  Module: {User.__module__}')
        self.stdout.write(f'  Table: {User._meta.db_table}')
        
        # Check model fields
        self.stdout.write('\n📊 User Model Fields:')
        for field in User._meta.fields:
            self.stdout.write(f'  - {field.name}: {field.__class__.__name__}')
    
    def check_database_tables(self):
        """Check what user tables exist in database"""
        self.stdout.write('\n🗄️  Database Tables:')
        
        with connection.cursor() as cursor:
            # Get all table names
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%user%'
                ORDER BY table_name;
            """)
            
            user_tables = cursor.fetchall()
            
            if user_tables:
                for table in user_tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                    count = cursor.fetchone()[0]
                    self.stdout.write(f'  📊 {table_name}: {count} records')
                    
                    # Show sample data for user tables
                    if 'user' in table_name.lower() and count > 0:
                        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                        columns = [desc[0] for desc in cursor.description]
                        rows = cursor.fetchall()
                        
                        self.stdout.write(f'    Columns: {", ".join(columns)}')
                        for i, row in enumerate(rows, 1):
                            self.stdout.write(f'    Row {i}: {dict(zip(columns, row))}')
            else:
                self.stdout.write('  ❌ No user tables found')
    
    def check_user_data(self):
        """Check user data using Django ORM"""
        self.stdout.write('\n👥 User Data (Django ORM):')
        
        try:
            total_users = User.objects.count()
            self.stdout.write(f'  Total users: {total_users}')
            
            if total_users > 0:
                # Show user details
                users = User.objects.all()[:5]
                for user in users:
                    self.stdout.write(f'  - {user.username} ({user.email}) - Role: {user.role} - Active: {user.is_active}')
                
                # Check role distribution
                roles = {}
                for user in User.objects.all():
                    roles[user.role] = roles.get(user.role, 0) + 1
                
                self.stdout.write(f'\n  Role Distribution: {roles}')
            else:
                self.stdout.write('  ❌ No users found via Django ORM')
                
        except Exception as e:
            self.stdout.write(f'  ❌ Error querying users: {e}')
    
    def test_api_endpoint(self):
        """Test the API endpoint directly"""
        self.stdout.write('\n🌐 API Endpoint Test:')
        
        try:
            from django.test import Client
            from django.urls import reverse
            
            # Get an admin user for testing
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                admin_user = User.objects.filter(is_superuser=True).first()
            
            if admin_user:
                client = Client()
                client.force_login(admin_user)
                
                # Test users endpoint
                try:
                    response = client.get('/api/auth/users/')
                    self.stdout.write(f'  Status Code: {response.status_code}')
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.stdout.write(f'  Response Type: {type(data)}')
                        if isinstance(data, list):
                            self.stdout.write(f'  Users Returned: {len(data)}')
                            if data:
                                self.stdout.write(f'  Sample User: {data[0]}')
                        else:
                            self.stdout.write(f'  Response Data: {data}')
                    else:
                        self.stdout.write(f'  Error Response: {response.content.decode()}')
                        
                except Exception as e:
                    self.stdout.write(f'  ❌ API Test Error: {e}')
            else:
                self.stdout.write('  ❌ No admin user found for testing')
                
        except Exception as e:
            self.stdout.write(f'  ❌ API Test Setup Error: {e}')