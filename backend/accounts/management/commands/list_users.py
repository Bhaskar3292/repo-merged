"""
Management command to list all users with their roles and status
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'List all users with their roles and security status'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            choices=['admin', 'contributor', 'viewer'],
            help='Filter users by role',
        )
        parser.add_argument(
            '--active-only',
            action='store_true',
            help='Show only active users',
        )
        parser.add_argument(
            '--locked-only',
            action='store_true',
            help='Show only locked accounts',
        )
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed user information',
        )
    
    def handle(self, *args, **options):
        # Build queryset based on filters
        queryset = User.objects.all().order_by('role', 'username')
        
        if options.get('role'):
            queryset = queryset.filter(role=options['role'])
        
        if options.get('active_only'):
            queryset = queryset.filter(is_active=True)
        
        users = list(queryset)
        
        if options.get('locked_only'):
            users = [user for user in users if user.is_account_locked()]
        
        if not users:
            self.stdout.write(self.style.WARNING('No users found matching the criteria.'))
            return
        
        # Display header
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS(f'USER LIST ({len(users)} users found)'))
        self.stdout.write('='*80)
        
        if options.get('detailed'):
            self.display_detailed_users(users)
        else:
            self.display_summary_users(users)
        
        # Display summary statistics
        self.display_statistics(users)
    
    def display_summary_users(self, users):
        """Display users in summary format"""
        # Table header
        self.stdout.write(f'{"Username":<20} {"Email":<30} {"Role":<12} {"Status":<8} {"2FA":<5} {"Locked":<7}')
        self.stdout.write('-' * 80)
        
        for user in users:
            status = "Active" if user.is_active else "Inactive"
            tfa_status = "Yes" if user.two_factor_enabled else "No"
            locked_status = "Yes" if user.is_account_locked() else "No"
            
            self.stdout.write(
                f'{user.username:<20} '
                f'{user.email:<30} '
                f'{user.get_role_display():<12} '
                f'{status:<8} '
                f'{tfa_status:<5} '
                f'{locked_status:<7}'
            )
    
    def display_detailed_users(self, users):
        """Display users in detailed format"""
        for i, user in enumerate(users, 1):
            self.stdout.write(f'\n{i}. {user.username} ({user.get_role_display()})')
            self.stdout.write('-' * 40)
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'Full Name: {user.first_name} {user.last_name}')
            self.stdout.write(f'Active: {"Yes" if user.is_active else "No"}')
            self.stdout.write(f'Staff: {"Yes" if user.is_staff else "No"}')
            self.stdout.write(f'Superuser: {"Yes" if user.is_superuser else "No"}')
            self.stdout.write(f'2FA Enabled: {"Yes" if user.two_factor_enabled else "No"}')
            self.stdout.write(f'Account Locked: {"Yes" if user.is_account_locked() else "No"}')
            self.stdout.write(f'Failed Login Attempts: {user.failed_login_attempts}')
            self.stdout.write(f'Last Login: {user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else "Never"}')
            self.stdout.write(f'Created: {user.created_at.strftime("%Y-%m-%d %H:%M:%S")}')
            
            if user.is_account_locked():
                self.stdout.write(self.style.ERROR(f'Locked Until: {user.account_locked_until.strftime("%Y-%m-%d %H:%M:%S")}'))
    
    def display_statistics(self, users):
        """Display user statistics"""
        total_users = len(users)
        active_users = len([u for u in users if u.is_active])
        locked_users = len([u for u in users if u.is_account_locked()])
        tfa_users = len([u for u in users if u.two_factor_enabled])
        
        role_counts = {}
        for user in users:
            role_counts[user.role] = role_counts.get(user.role, 0) + 1
        
        self.stdout.write('\n' + '='*40)
        self.stdout.write(self.style.SUCCESS('STATISTICS'))
        self.stdout.write('='*40)
        self.stdout.write(f'Total Users: {total_users}')
        self.stdout.write(f'Active Users: {active_users}')
        self.stdout.write(f'Locked Accounts: {locked_users}')
        self.stdout.write(f'2FA Enabled: {tfa_users}')
        self.stdout.write('')
        self.stdout.write('Users by Role:')
        for role, count in role_counts.items():
            role_display = dict(User.ROLE_CHOICES).get(role, role)
            self.stdout.write(f'  {role_display}: {count}')
        
        if locked_users > 0:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('⚠️  Locked Accounts Found:'))
            for user in users:
                if user.is_account_locked():
                    self.stdout.write(f'  - {user.username} (locked until {user.account_locked_until.strftime("%Y-%m-%d %H:%M:%S")})')
            self.stdout.write('')
            self.stdout.write('To unlock accounts, use: python manage.py unlock_user <username>')