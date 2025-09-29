"""
Management command to unlock user accounts
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.utils import log_security_event

User = get_user_model()


class Command(BaseCommand):
    help = 'Unlock a locked user account'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='Username of the account to unlock',
        )
    
    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User "{username}" not found.'))
            return
        
        if not user.is_account_locked():
            self.stdout.write(self.style.WARNING(f'⚠️  Account "{username}" is not locked.'))
            return
        
        # Unlock the account
        user.unlock_account()
        
        # Log the unlock action
        log_security_event(
            user=user,
            action='account_unlocked',
            description=f'Account unlocked via management command',
            metadata={'unlocked_by': 'management_command'}
        )
        
        self.stdout.write(self.style.SUCCESS(f'✅ Account "{username}" has been unlocked.'))