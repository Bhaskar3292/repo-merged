"""
Signal handlers for accounts app
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from .models import User
from .utils import get_client_ip, log_security_event


def ensure_admin_permissions():
    """
    Ensure all permissions exist for the admin role
    Creates RolePermission entries with is_granted=True for all permissions
    """
    try:
        from permissions.models import Permission, RolePermission

        # Get all permissions
        all_permissions = Permission.objects.all()

        # Create or update RolePermission for admin role
        for permission in all_permissions:
            RolePermission.objects.update_or_create(
                role='admin',
                permission=permission,
                defaults={'is_granted': True}
            )

        return True
    except Exception as e:
        # Log error but don't fail user creation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Failed to ensure admin permissions: {str(e)}')
        return False


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    Handle user creation and updates
    Automatically set admin defaults for Administrator role
    """
    # Assign admin defaults (only if role is admin)
    if instance.role == 'admin':
        update_fields = []

        # Ensure admin is active and staff
        if not instance.is_active:
            instance.is_active = True
            update_fields.append('is_active')

        if not instance.is_staff:
            instance.is_staff = True
            update_fields.append('is_staff')

        # Ensure organization is set
        if not instance.organization_id:
            from .models import Organization
            # Try to get default organization
            default_org = Organization.objects.filter(is_active=True).first()
            if default_org:
                instance.organization = default_org
                update_fields.append('organization')

        # Save if any fields were updated (avoid recursion with update_fields)
        if update_fields and not kwargs.get('update_fields'):
            User.objects.filter(pk=instance.pk).update(**{
                field: getattr(instance, field) for field in update_fields
            })

    if created:
        # Ensure admin role has all permissions
        if instance.role == 'admin':
            ensure_admin_permissions()

        # Log user creation
        log_security_event(
            user=instance,
            action='user_created',
            description=f'User account created: {instance.username} (role: {instance.role})',
            metadata={
                'user_id': instance.id,
                'role': instance.role,
                'organization_id': instance.organization_id,
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