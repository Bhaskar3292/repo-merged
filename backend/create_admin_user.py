"""
Management command to create admin users interactively
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.utils import log_security_event
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user interactively with proper validation'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username for the admin user',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the admin user',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin user (not recommended for security)',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            help='First name for the admin user',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            help='Last name for the admin user',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if user exists (will update existing user)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Admin User Creation ===\n'))
        
        # Get user input
        username = options.get('username') or self.get_input('Username', required=True)
        email = options.get('email') or self.get_input('Email address', required=True, validate_email=True)
        first_name = options.get('first_name') or self.get_input('First name', required=False)
        last_name = options.get('last_name') or self.get_input('Last name', required=False)
        
        # Get password securely
        if options.get('password'):
            password = options['password']
            self.stdout.write(self.style.WARNING('Warning: Password provided via command line is not secure!'))
        else:
            password = self.get_password()
        
        # Validate inputs
        if not self.validate_inputs(username, email, password, options.get('force', False)):
            return
        
        # Create or update user
        try:
            user, created = self.create_or_update_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                force=options.get('force', False)
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'\n✅ Admin user "{username}" created successfully!'))
            else:
                self.stdout.write(self.style.SUCCESS(f'\n✅ Admin user "{username}" updated successfully!'))
            
            self.display_user_info(user)
            self.display_next_steps()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error creating admin user: {e}'))
    
    def get_input(self, prompt, required=True, validate_email=False):
        """Get user input with validation"""
        while True:
            value = input(f'{prompt}: ').strip()
            
            if required and not value:
                self.stdout.write(self.style.ERROR('This field is required.'))
                continue
            
            if validate_email and value:
                import re
                email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
                if not re.match(email_pattern, value):
                    self.stdout.write(self.style.ERROR('Please enter a valid email address.'))
                    continue
            
            return value
    
    def get_password(self):
        """Get password securely with validation"""
        while True:
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            
            if password != password_confirm:
                self.stdout.write(self.style.ERROR('Passwords do not match. Please try again.'))
                continue
            
            # Validate password strength
            try:
                validate_password(password)
                return password
            except ValidationError as e:
                self.stdout.write(self.style.ERROR('Password validation failed:'))
                for error in e.messages:
                    self.stdout.write(self.style.ERROR(f'  - {error}'))
                self.stdout.write('')
    
    def validate_inputs(self, username, email, password, force=False):
        """Validate all inputs before user creation"""
        errors = []
        
        # Check if username exists
        if User.objects.filter(username=username).exists() and not force:
            errors.append(f'Username "{username}" already exists. Use --force to update existing user.')
        
        # Check if email exists
        if User.objects.filter(email=email).exists() and not force:
            existing_user = User.objects.get(email=email)
            if existing_user.username != username:
                errors.append(f'Email "{email}" is already used by user "{existing_user.username}".')
        
        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            errors.extend(e.messages)
        
        if errors:
            self.stdout.write(self.style.ERROR('\n❌ Validation errors:'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))
            return False
        
        return True
    
    def create_or_update_user(self, username, email, password, first_name, last_name, force=False):
        """Create or update admin user"""
        if User.objects.filter(username=username).exists():
            if force:
                # Update existing user
                user = User.objects.get(username=username)
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.set_password(password)
                user.role = 'admin'
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.save()
                
                # Log user update
                log_security_event(
                    user=user,
                    action='user_updated',
                    description=f'Admin user {username} updated via management command',
                    metadata={'updated_by': 'management_command'}
                )
                
                return user, False
            else:
                raise ValueError(f'User "{username}" already exists. Use --force to update.')
        else:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='admin',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            
            # Log user creation
            log_security_event(
                user=user,
                action='user_created',
                description=f'Admin user {username} created via management command',
                metadata={'created_by': 'management_command'}
            )
            
            return user, True
    
    def display_user_info(self, user):
        """Display created user information"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('ADMIN USER DETAILS'))
        self.stdout.write('='*50)
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Full Name: {user.first_name} {user.last_name}')
        self.stdout.write(f'Role: {user.get_role_display()}')
        self.stdout.write(f'Staff Status: {"Yes" if user.is_staff else "No"}')
        self.stdout.write(f'Superuser: {"Yes" if user.is_superuser else "No"}')
        self.stdout.write(f'Active: {"Yes" if user.is_active else "No"}')
        self.stdout.write(f'Created: {user.created_at.strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write('='*50)
    
    def display_next_steps(self):
        """Display next steps for the user"""
        self.stdout.write('\n' + self.style.SUCCESS('NEXT STEPS:'))
        self.stdout.write('1. 🌐 Start the development servers:')
        self.stdout.write('   Backend:  python manage.py runserver')
        self.stdout.write('   Frontend: cd ../frontend && npm run dev')
        self.stdout.write('')
        self.stdout.write('2. 🔐 Login to the application:')
        self.stdout.write('   - Navigate to the frontend URL')
        self.stdout.write('   - Use the credentials you just created')
        self.stdout.write('')
        self.stdout.write('3. 🛡️  Enable Two-Factor Authentication:')
        self.stdout.write('   - Go to Settings → Security')
        self.stdout.write('   - Click "Enable 2FA"')
        self.stdout.write('   - Scan QR code with authenticator app')
        self.stdout.write('')
        self.stdout.write('4. 👥 Create additional users:')
        self.stdout.write('   - Go to Admin Panel → User Management')
        self.stdout.write('   - Click "Create User"')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('⚠️  SECURITY REMINDER:'))
        self.stdout.write('- Change this password in production')
        self.stdout.write('- Enable 2FA for all admin accounts')
        self.stdout.write('- Monitor audit logs regularly')
        self.stdout.write('- Use HTTPS in production')