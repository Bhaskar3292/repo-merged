"""
Management command to reset database (development only)
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Reset database and recreate with fresh data (DEVELOPMENT ONLY)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm database reset',
        )
    
    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stdout.write(self.style.ERROR('❌ This command can only be run in DEBUG mode'))
            return
        
        if not options.get('confirm'):
            self.stdout.write(self.style.WARNING('⚠️  This will DELETE ALL DATA in the database!'))
            self.stdout.write('To confirm, run: python manage.py reset_database --confirm')
            return
        
        self.stdout.write(self.style.WARNING('🗑️  Resetting database...'))
        
        # Delete SQLite database file if it exists
        db_path = settings.DATABASES['default']['NAME']
        if isinstance(db_path, str) and db_path.endswith('.sqlite3') and os.path.exists(db_path):
            os.remove(db_path)
            self.stdout.write('Deleted SQLite database file')
        
        # Run migrations
        self.stdout.write('Running migrations...')
        call_command('migrate')
        
        # Create default data
        self.stdout.write('Creating default permissions...')
        call_command('create_default_permissions')
        
        self.stdout.write('Creating dashboard sections...')
        call_command('create_dashboard_sections')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database reset complete!'))
        self.stdout.write('\n📝 Next steps:')
        self.stdout.write('   1. Create admin user: python manage.py create_admin_user')
        self.stdout.write('   2. Or create sample users: python manage.py create_sample_users')