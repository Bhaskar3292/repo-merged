"""
Utility functions for accounts app
"""
from django.utils import timezone
from django.contrib.auth import authenticate
from .models import AuditLog, LoginAttempt


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_security_event(user, action, description, ip_address=None, user_agent='', metadata=None):
    """
    Log security-related events to audit log
    """
    AuditLog.objects.create(
        user=user,
        action=action,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {}
    )


def log_login_attempt(username, ip_address, success, user_agent=''):
    """
    Log login attempt for monitoring
    """
    LoginAttempt.objects.create(
        username=username,
        ip_address=ip_address,
        success=success,
        user_agent=user_agent
    )


def check_rate_limit(ip_address, username=None, window_minutes=15, max_attempts=10):
    """
    Check if IP or user has exceeded rate limit
    """
    cutoff_time = timezone.now() - timezone.timedelta(minutes=window_minutes)
    
    # Check IP-based rate limit
    ip_attempts = LoginAttempt.objects.filter(
        ip_address=ip_address,
        timestamp__gte=cutoff_time,
        success=False
    ).count()
    
    if ip_attempts >= max_attempts:
        return False, f"Too many failed attempts from this IP. Try again in {window_minutes} minutes."
    
    # Check username-based rate limit if provided
    if username:
        user_attempts = LoginAttempt.objects.filter(
            username=username,
            timestamp__gte=cutoff_time,
            success=False
        ).count()
        
        if user_attempts >= max_attempts:
            return False, f"Too many failed attempts for this account. Try again in {window_minutes} minutes."
    
    return True, None


def is_password_expired(user, max_age_days=90):
    """
    Check if user's password has expired
    """
    if not user.last_password_change:
        return True
    
    age = timezone.now() - user.last_password_change
    return age.days > max_age_days


def generate_secure_token(length=32):
    """
    Generate cryptographically secure random token
    """
    import secrets
    return secrets.token_urlsafe(length)