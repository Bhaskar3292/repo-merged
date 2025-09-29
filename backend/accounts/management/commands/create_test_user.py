"""
Management command to create a single test user for debugging
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.utils import log_security_event

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a single test user for debugging (can be safely deleted)'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating test user for debugging...'))
        
        # Create test user
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@facility.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'contributor',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True
            }
        )
        
        if created:
            test_user.set_password('TestUser123!')
            test_user.save()
            
            # Log user creation
            log_security_event(
                user=test_user,
                action='user_created',
                description=f'Test user created via management command: {test_user.username}',
                metadata={'created_by': 'debug_command', 'test_user': True}
            )
            
            self.stdout.write(self.style.SUCCESS(f'✅ Test user created: {test_user.username}'))
            self.stdout.write(f'   Email: {test_user.email}')
            self.stdout.write(f'   Password: TestUser123!')
            self.stdout.write(f'   Role: {test_user.role}')
        else:
            self.stdout.write(self.style.WARNING(f'⚠️  Test user already exists: {test_user.username}'))
        
        # Show total user count
        total_users = User.objects.count()
        self.stdout.write(f'\n📊 Total users in database: {total_users}')
        
        # Show all users
        self.stdout.write('\n👥 All users:')
        for user in User.objects.all():
            self.stdout.write(f'   - {user.username} ({user.role}) - Active: {user.is_active}')