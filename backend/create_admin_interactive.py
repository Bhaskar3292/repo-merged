#!/usr/bin/env python
"""
Interactive management command to create admin users with comprehensive input validation
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
django.setup()

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.utils import log_security_event
import getpass
import re

User = get_user_model()


class Command(BaseCommand):
    help = 'Interactively create an admin user with comprehensive validation'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--batch',
            action='store_true',
            help='Create admin user with default values for testing',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🔐 ADMIN USER CREATION WIZARD'))
        self.stdout.write('='*60)
        
        if options['batch']:
            self.create_batch_admin()
            return
        
        try:
            # Collect user information
            user_data = self.collect_user_data()
            
            # Validate all data
            if not self.validate_user_data(user_data):
                return
            
            # Create the user
            user = self.create_admin_user(user_data)
            
            # Display success information
            self.display_success(user)
            
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\n\n⚠️  Operation cancelled by user'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error: {e}'))
    
    def collect_user_data(self):
        """Collect user data interactively"""
        self.stdout.write('\nPlease provide the following information:\n')
        
        data = {}
        
        # Username
        data['username'] = self.get_input(
            'Username',
            required=True,
            validator=self.validate_username
        )
        
        # First Name
        data['first_name'] = self.get_input(
            'First Name',
            required=True,
            validator=self.validate_name
        )
        
        # Last Name
        data['last_name'] = self.get_input(
            'Last Name',
            required=True,
            validator=self.validate_name
        )
        
        # Email
        data['email'] = self.get_input(
            'Email Address',
            required=True,
            validator=self.validate_email
        )
        
        # Phone Number
        data['phone'] = self.get_input(
            'Phone Number (optional)',
            required=False,
            validator=self.validate_phone
        )
        
        # Password
        data['password'] = self.get_password()
        
        return data
    
    def get_input(self, prompt, required=True, validator=None):
        """Get user input with validation"""
        while True:
            value = input(f'{prompt}: ').strip()
            
            if required and not value:
                self.stdout.write(self.style.ERROR('❌ This field is required.'))
                continue
            
            if value and validator:
                error = validator(value)
                if error:
                    self.stdout.write(self.style.ERROR(f'❌ {error}'))
                    continue
            
            return value
    
    def get_password(self):
        """Get password securely with validation"""
        self.stdout.write('\nPassword Requirements:')
        self.stdout.write('• Minimum 12 characters')
        self.stdout.write('• At least one uppercase letter')
        self.stdout.write('• At least one lowercase letter')
        self.stdout.write('• At least one number')
        self.stdout.write('• At least one special character (!@#$%^&*)')
        self.stdout.write('• Cannot contain personal information\n')
        
        while True:
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Confirm Password: ')
            
            if password != password_confirm:
                self.stdout.write(self.style.ERROR('❌ Passwords do not match. Please try again.'))
                continue
            
            # Validate password strength
            try:
                validate_password(password)
                return password
            except ValidationError as e:
                self.stdout.write(self.style.ERROR('❌ Password validation failed:'))
                for error in e.messages:
                    self.stdout.write(self.style.ERROR(f'   • {error}'))
                self.stdout.write('')
    
    def validate_username(self, username):
        """Validate username"""
        if len(username) < 3:
            return 'Username must be at least 3 characters long'
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return 'Username can only contain letters, numbers, and underscores'
        
        if User.objects.filter(username=username).exists():
            return f'Username "{username}" already exists'
        
        return None
    
    def validate_name(self, name):
        """Validate first/last name"""
        if len(name) < 2:
            return 'Name must be at least 2 characters long'
        
        if not re.match(r'^[a-zA-Z\s\-\']+$', name):
            return 'Name can only contain letters, spaces, hyphens, and apostrophes'
        
        return None
    
    def validate_email(self, email):
        """Validate email address"""
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            return 'Please enter a valid email address'
        
        if User.objects.filter(email=email).exists():
            return f'Email "{email}" is already registered'
        
        return None
    
    def validate_phone(self, phone):
        """Validate phone number"""
        if not phone:
            return None
        
        # Remove common formatting characters
        cleaned = re.sub(r'[\s\-\(\)\.]+', '', phone)
        
        if not re.match(r'^\+?[\d]{10,15}$', cleaned):
            return 'Please enter a valid phone number (10-15 digits)'
        
        return None
    
    def validate_user_data(self, data):
        """Final validation of all user data"""
        errors = []
        
        # Check for existing users
        if User.objects.filter(username=data['username']).exists():
            errors.append(f'Username "{data["username"]}" already exists')
        
        if User.objects.filter(email=data['email']).exists():
            errors.append(f'Email "{data["email"]}" is already registered')
        
        if errors:
            self.stdout.write(self.style.ERROR('\n❌ Validation errors:'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'   • {error}'))
            return False
        
        return True
    
    def create_admin_user(self, data):
        """Create the admin user"""
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role='admin',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            
            # Log user creation
            log_security_event(
                user=user,
                action='user_created',
                description=f'Admin user {data["username"]} created via interactive command',
                metadata={
                    'created_by': 'interactive_command',
                    'phone': data.get('phone', ''),
                    'creation_method': 'management_command'
                }
            )
            
            return user
            
        except Exception as e:
            raise Exception(f'Failed to create user: {e}')
    
    def create_batch_admin(self):
        """Create admin user with default values for testing"""
        data = {
            'username': 'admin',
            'email': 'admin@facility.com',
            'password': 'SecureAdmin123!',
            'first_name': 'System',
            'last_name': 'Administrator',
            'phone': '(555) 123-4567'
        }
        
        if User.objects.filter(username=data['username']).exists():
            self.stdout.write(self.style.WARNING(f'User "{data["username"]}" already exists'))
            return
        
        user = self.create_admin_user(data)
        self.display_success(user, batch=True)
    
    def display_success(self, user, batch=False):
        """Display success message and user details"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ ADMIN USER CREATED SUCCESSFULLY'))
        self.stdout.write('='*60)
        
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Full Name: {user.first_name} {user.last_name}')
        self.stdout.write(f'Role: {user.get_role_display()}')
        self.stdout.write(f'Staff Status: {"Yes" if user.is_staff else "No"}')
        self.stdout.write(f'Superuser: {"Yes" if user.is_superuser else "No"}')
        self.stdout.write(f'Active: {"Yes" if user.is_active else "No"}')
        self.stdout.write(f'Created: {user.created_at.strftime("%Y-%m-%d %H:%M:%S")}')
        
        if batch:
            self.stdout.write(f'Password: SecureAdmin123!')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('🚀 NEXT STEPS'))
        self.stdout.write('='*60)
        
        self.stdout.write('1. Start the servers:')
        self.stdout.write('   Backend:  python manage.py runserver')
        self.stdout.write('   Frontend: cd ../frontend && npm run dev')
        self.stdout.write('')
        self.stdout.write('2. Login to the application:')
        self.stdout.write(f'   Email: {user.email}')
        if not batch:
            self.stdout.write('   Password: [the password you just created]')
        else:
            self.stdout.write('   Password: SecureAdmin123!')
        self.stdout.write('')
        self.stdout.write('3. Security recommendations:')
        self.stdout.write('   • Enable 2FA in Settings → Security')
        self.stdout.write('   • Change password in production')
        self.stdout.write('   • Create additional users via Admin Panel')
        self.stdout.write('   • Monitor audit logs regularly')
        
        self.stdout.write('\n🎉 Your admin user is ready to use!')


if __name__ == "__main__":
    command = Command()
    command.handle()