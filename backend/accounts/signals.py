"""
Signal handlers for accounts app
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from .models import User
from .utils import get_client_ip, log_security_event


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    Handle user creation and updates
    """
    if created:
        # Log user creation
        log_security_event(
            user=instance,
            action='user_created',
            description=f'User account created: {instance.username}',
            metadata={
                'user_id': instance.id,
                'role': instance.role,
                'created_via': 'system'
            }
        )


@receiver(post_delete, sender=User)
def user_post_delete(sender, instance, **kwargs):
    """
    Handle user deletion
    """
    log_security_event(
        user=None,
        action='user_deleted',
        description=f'User account deleted: {instance.username}',
        metadata={
            'deleted_user_id': instance.id,
            'deleted_username': instance.username,
            'deleted_role': instance.role
        }
    )


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Handle successful user login
    """
    ip_address = get_client_ip(request)
    
    # Reset failed login attempts
    user.reset_failed_login()
    user.last_login_ip = ip_address
    user.save(update_fields=['last_login_ip'])


@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """
    Handle user logout
    """
    if user and user.is_authenticated:
        log_security_event(
            user=user,
            action='logout',
            description='User logged out',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )


@receiver(user_login_failed)
def user_login_failed_handler(sender, credentials, request, **kwargs):
    """
    Handle failed login attempts
    """
    username = credentials.get('username', '')
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Try to find user and increment failed attempts
    try:
        user = User.objects.get(username=username)
        user.increment_failed_login()
        
        log_security_event(
            user=user,
            action='login_failed',
            description=f'Failed login attempt for {username}',
            ip_address=ip_address,
            user_agent=user_agent
        )
    except User.DoesNotExist:
        log_security_event(
            user=None,
            action='login_failed',
            description=f'Failed login attempt for non-existent user: {username}',
            ip_address=ip_address,
            user_agent=user_agent
        )