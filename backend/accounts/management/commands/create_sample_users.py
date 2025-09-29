"""
Management command to create sample users for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from accounts.utils import log_security_event

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample users for testing (development only)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing sample users before creating new ones',
        )
    
    def handle(self, *args, **options):
        if options.get('reset'):
            self.reset_sample_users()
        
        self.create_sample_users()
    
    def reset_sample_users(self):
        """Delete existing sample users"""
        sample_emails = [
            'admin@facility.com',
            'operator@facility.com', 
            'viewer@facility.com'
        ]
        
        deleted_count = 0
        for email in sample_emails:
            try:
                user = User.objects.get(email=email)
                user.delete()
                deleted_count += 1
                self.stdout.write(f"Deleted user: {user.username}")
            except User.DoesNotExist:
                pass
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} sample users'))
    
    def create_sample_users(self):
        """Create sample users for testing"""
        sample_users = [
            {
                'username': 'admin',
                'email': 'admin@facility.com',
                'password': 'SecureAdmin123!',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'operator',
                'email': 'operator@facility.com',
                'password': 'SecureOp123!',
                'first_name': 'Operator',
                'last_name': 'User',
                'role': 'contributor',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'username': 'viewer',
                'email': 'viewer@facility.com',
                'password': 'SecureView123!',
                'first_name': 'Viewer',
                'last_name': 'User',
                'role': 'viewer',
                'is_staff': False,
                'is_superuser': False,
            }
        ]
        
        created_count = 0
        
        with transaction.atomic():
            for user_data in sample_users:
                username = user_data['username']
                email = user_data['email']
                
                # Check if user already exists
                if User.objects.filter(username=username).exists():
                    self.stdout.write(f"User '{username}' already exists, skipping...")
                    continue
                
                if User.objects.filter(email=email).exists():
                    self.stdout.write(f"Email '{email}' already exists, skipping...")
                    continue
                
                # Create user
                try:
                    user = User.objects.create_user(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password'],
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        role=user_data['role'],
                        is_staff=user_data['is_staff'],
                        is_superuser=user_data['is_superuser'],
                        is_active=True
                    )
                    
                    created_count += 1
                    self.stdout.write(f"✅ Created user: {username} ({user.get_role_display()})")
                    
                    # Log user creation
                    log_security_event(
                        user=user,
                        action='user_created',
                        description=f'Sample user created via management command: {username}',
                        metadata={
                            'created_by': 'management_command',
                            'sample_user': True
                        }
                    )
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"❌ Failed to create user '{username}': {e}"))
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\n🎉 Successfully created {created_count} sample users'))
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('SAMPLE USER CREDENTIALS'))
            self.stdout.write('='*60)
            
            for user_data in sample_users:
                if not User.objects.filter(username=user_data['username']).exists():
                    continue
                    
                self.stdout.write(f"\n{user_data['first_name']} {user_data['last_name']} ({user_data['role'].title()}):")
                self.stdout.write(f"  Email: {user_data['email']}")
                self.stdout.write(f"  Password: {user_data['password']}")
                self.stdout.write(f"  Role: {user_data['role'].title()}")
            
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.WARNING('⚠️  IMPORTANT SECURITY NOTES:'))
            self.stdout.write('- These are sample users for DEVELOPMENT/TESTING only')
            self.stdout.write('- Change all passwords before production deployment')
            self.stdout.write('- Enable 2FA for admin accounts in production')
            self.stdout.write('- Delete sample users in production environment')
        else:
            self.stdout.write(self.style.WARNING('No new sample users were created (users may already exist)'))