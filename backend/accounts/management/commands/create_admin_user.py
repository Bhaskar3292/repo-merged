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
            '--first-name',
            type=str,
            help='First name for the admin user',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            help='Last name for the admin user',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Admin User Creation ===\n'))
        
        # Get user input
        username = options.get('username') or self.get_input('Username', required=True)
        email = options.get('email') or self.get_input('Email address', required=True, validate_email=True)
        first_name = options.get('first_name') or self.get_input('First name', required=False)
        last_name = options.get('last_name') or self.get_input('Last name', required=False)
        
        # Get password securely
        password = self.get_password()
        
        # Validate inputs
        if not self.validate_inputs(username, email, password):
            return
        
        # Create user
        try:
            user = self.create_admin_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ Admin user "{username}" created successfully!'))
            self.display_user_info(user)
            
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
    
    def validate_inputs(self, username, email, password):
        """Validate all inputs before user creation"""
        errors = []
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            errors.append(f'Username "{username}" already exists.')
        
        # Check if email exists
        if User.objects.filter(email=email).exists():
            errors.append(f'Email "{email}" is already in use.')
        
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
    
    def create_admin_user(self, username, email, password, first_name, last_name):
        """Create admin user"""
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
        
        return user
    
    def display_user_info(self, user):
        """Display created user information"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('ADMIN USER CREATED'))
        self.stdout.write('='*50)
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Full Name: {user.first_name} {user.last_name}')
        self.stdout.write(f'Role: {user.get_role_display()}')
        self.stdout.write(f'Active: {"Yes" if user.is_active else "No"}')
        self.stdout.write('='*50)