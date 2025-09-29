"""
Management command to check backend setup and configuration
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import connection
from facilities.models import Location, DashboardSection
from permissions.models import Permission, PermissionCategory
import sys

User = get_user_model()


class Command(BaseCommand):
    help = 'Check backend setup and configuration'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Backend Setup Check'))
        self.stdout.write('=' * 60)
        
        # Check database connection
        self.check_database()
        
        # Check models and migrations
        self.check_models()
        
        # Check users
        self.check_users()
        
        # Check permissions
        self.check_permissions()
        
        # Check dashboard sections
        self.check_dashboard_sections()
        
        # Check settings
        self.check_settings()
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✅ Setup check complete!'))
    
    def check_database(self):
        """Check database connection and tables"""
        self.stdout.write('\n📊 Database Check:')
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write('  ✅ Database connection: OK')
            
            # Check if tables exist
            table_names = connection.introspection.table_names()
            required_tables = ['auth_user', 'facilities_location', 'permissions_permission']
            
            for table in required_tables:
                if table in table_names:
                    self.stdout.write(f'  ✅ Table {table}: EXISTS')
                else:
                    self.stdout.write(f'  ❌ Table {table}: MISSING')
                    
        except Exception as e:
            self.stdout.write(f'  ❌ Database error: {e}')
    
    def check_models(self):
        """Check model counts"""
        self.stdout.write('\n📋 Models Check:')
        try:
            user_count = User.objects.count()
            location_count = Location.objects.count()
            permission_count = Permission.objects.count()
            
            self.stdout.write(f'  📊 Users: {user_count}')
            self.stdout.write(f'  📊 Locations: {location_count}')
            self.stdout.write(f'  📊 Permissions: {permission_count}')
            
        except Exception as e:
            self.stdout.write(f'  ❌ Model check error: {e}')
    
    def check_users(self):
        """Check user accounts"""
        self.stdout.write('\n👥 Users Check:')
        try:
            total_users = User.objects.count()
            admin_users = User.objects.filter(role='admin').count()
            active_users = User.objects.filter(is_active=True).count()
            
            self.stdout.write(f'  📊 Total users: {total_users}')
            self.stdout.write(f'  👑 Admin users: {admin_users}')
            self.stdout.write(f'  ✅ Active users: {active_users}')
            
            if admin_users == 0:
                self.stdout.write('  ⚠️  No admin users found!')
                self.stdout.write('     💡 Create one: python manage.py create_admin_user')
            
        except Exception as e:
            self.stdout.write(f'  ❌ Users check error: {e}')
    
    def check_permissions(self):
        """Check permissions setup"""
        self.stdout.write('\n🔐 Permissions Check:')
        try:
            categories = PermissionCategory.objects.count()
            permissions = Permission.objects.count()
            
            self.stdout.write(f'  📊 Permission categories: {categories}')
            self.stdout.write(f'  📊 Permissions: {permissions}')
            
            if permissions == 0:
                self.stdout.write('  ⚠️  No permissions found!')
                self.stdout.write('     💡 Create them: python manage.py create_default_permissions')
            
        except Exception as e:
            self.stdout.write(f'  ❌ Permissions check error: {e}')
    
    def check_dashboard_sections(self):
        """Check dashboard sections"""
        self.stdout.write('\n📊 Dashboard Sections Check:')
        try:
            sections = DashboardSection.objects.count()
            active_sections = DashboardSection.objects.filter(is_active=True).count()
            
            self.stdout.write(f'  📊 Total sections: {sections}')
            self.stdout.write(f'  ✅ Active sections: {active_sections}')
            
            if sections == 0:
                self.stdout.write('  ⚠️  No dashboard sections found!')
                self.stdout.write('     💡 Create them: python manage.py create_dashboard_sections')
            
        except Exception as e:
            self.stdout.write(f'  ❌ Dashboard sections check error: {e}')
    
    def check_settings(self):
        """Check Django settings"""
        self.stdout.write('\n⚙️  Settings Check:')
        
        # Check DEBUG mode
        debug_status = "ON" if settings.DEBUG else "OFF"
        self.stdout.write(f'  🔧 DEBUG mode: {debug_status}')
        
        # Check database
        db_engine = settings.DATABASES['default']['ENGINE']
        self.stdout.write(f'  🗄️  Database engine: {db_engine.split(".")[-1]}')
        
        # Check secret key
        if settings.SECRET_KEY == 'django-insecure-development-key-change-in-production':
            self.stdout.write('  ⚠️  Using default SECRET_KEY (change for production)')
        else:
            self.stdout.write('  ✅ Custom SECRET_KEY configured')
        
        # Check CORS
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        self.stdout.write(f'  🌐 CORS origins: {len(cors_origins)} configured')
        
        # Check installed apps
        required_apps = ['accounts', 'facilities', 'permissions', 'security']
        for app in required_apps:
            if app in settings.INSTALLED_APPS:
                self.stdout.write(f'  ✅ App {app}: INSTALLED')
            else:
                self.stdout.write(f'  ❌ App {app}: MISSING')