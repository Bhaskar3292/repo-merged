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
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force unlock even if account is not locked',
        )
    
    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User "{username}" not found.'))
            return
        
        if not user.is_account_locked() and not options.get('force'):
            self.stdout.write(self.style.WARNING(f'⚠️  Account "{username}" is not locked.'))
            self.stdout.write('Use --force to reset failed login attempts anyway.')
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
        self.stdout.write(f'Failed login attempts reset to: {user.failed_login_attempts}')
        
        if user.account_locked_until:
            self.stdout.write(f'Lock expiration cleared: {user.account_locked_until}')