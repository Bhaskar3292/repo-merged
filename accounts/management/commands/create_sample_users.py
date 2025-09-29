"""
Management command to create sample users for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.utils import log_security_event

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample users for testing the application'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing sample users',
        )
    
    def handle(self, *args, **options):
        if options['reset']:
            # Delete existing sample users (except superusers)
            User.objects.filter(
                username__in=['admin', 'operator1', 'viewer1'],
                is_superuser=False
            ).delete()
            self.stdout.write('Deleted existing sample users')
        
        # Sample users data
        sample_users = [
            {
                'username': 'admin',
                'email': 'admin@facility.com',
                'password': 'SecureAdmin123!',
                'first_name': 'John',
                'last_name': 'Admin',
                'role': 'admin',
                'is_active': True,
            },
            {
                'username': 'operator1',
                'email': 'operator@facility.com',
                'password': 'SecureOp123!',
                'first_name': 'Jane',
                'last_name': 'Operator',
                'role': 'contributor',
                'is_active': True,
            },
            {
                'username': 'viewer1',
                'email': 'viewer@facility.com',
                'password': 'SecureView123!',
                'first_name': 'Bob',
                'last_name': 'Viewer',
                'role': 'viewer',
                'is_active': True,
            },
        ]
        
        created_count = 0
        
        for user_data in sample_users:
            username = user_data['username']
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"User '{username}' already exists, skipping...")
                continue
            
            # Create user
            password = user_data.pop('password')
            user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.save()
            
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f"Created user: {username} ({user.role})")
            )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} sample users')
            )
            
            # Display login credentials
            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('SAMPLE LOGIN CREDENTIALS'))
            self.stdout.write('='*60)
            
            for user_data in sample_users:
                user = User.objects.get(username=user_data['username'])
                self.stdout.write(f"""
{user.get_role_display().upper()} USER:
  Email: {user.email}
  Password: SecureAdmin123! (for admin) / SecureOp123! (for operator) / SecureView123! (for viewer)
  Role: {user.role}
  Permissions: {self.get_role_permissions(user.role)}
                """)
            
            self.stdout.write('='*60)
            self.stdout.write(self.style.WARNING('IMPORTANT: Change these passwords in production!'))
            self.stdout.write('='*60)
        else:
            self.stdout.write('No new users were created')
    
    def get_role_permissions(self, role):
        """Get human-readable permissions for a role"""
        permissions = {
            'admin': 'Full system access, user management, all CRUD operations',
            'contributor': 'Create/edit facilities, tanks, permits, dashboards',
            'viewer': 'Read-only access to assigned facilities'
        }
        return permissions.get(role, 'No permissions defined')