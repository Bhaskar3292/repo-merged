"""
Management command to expire temporary users
Run this as a cron job every hour: python manage.py expire_temporary_users
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from accounts.utils import log_security_event


class Command(BaseCommand):
    help = 'Expire temporary users that have passed their expiration date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually expiring',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()

        # Find temporary users that need to be expired
        expired_users = User.objects.filter(
            user_type='temporary',
            is_expired=False,
            expires_at__lte=now,
            is_active=True
        )

        count = expired_users.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No temporary users to expire'))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would expire {count} temporary users:'
                )
            )
            for user in expired_users:
                self.stdout.write(f'  - {user.username} (expired at {user.expires_at})')
            return

        # Expire users
        expired_count = 0
        for user in expired_users:
            user.is_expired = True
            user.is_active = False
            user.save(update_fields=['is_expired', 'is_active'])

            # Log expiration
            log_security_event(
                user=user,
                action='user_expired',
                description=f'Temporary user expired: {user.username}',
                ip_address='127.0.0.1',  # System action
                user_agent='System/Cron',
                metadata={
                    'user_id': user.id,
                    'expires_at': user.expires_at.isoformat() if user.expires_at else None,
                    'expired_at': now.isoformat()
                }
            )

            expired_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Expired user: {user.username} (ID: {user.id})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully expired {expired_count} temporary users'
            )
        )

        # Show warning for users expiring soon (within 24 hours)
        expiring_soon = User.objects.filter(
            user_type='temporary',
            is_expired=False,
            expires_at__gt=now,
            expires_at__lte=now + timezone.timedelta(hours=24),
            is_active=True
        )

        soon_count = expiring_soon.count()
        if soon_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠️  {soon_count} temporary users will expire within 24 hours:'
                )
            )
            for user in expiring_soon:
                time_remaining = user.expires_at - now
                hours = int(time_remaining.total_seconds() / 3600)
                self.stdout.write(f'  - {user.username} (expires in {hours} hours)')
