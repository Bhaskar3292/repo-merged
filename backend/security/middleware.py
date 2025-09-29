"""
Security middleware for enhanced protection
"""
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import logging

logger = logging.getLogger('security')


class SecurityMiddleware(MiddlewareMixin):
    """
    Custom security middleware for additional protection
    """
    
    def process_request(self, request):
        """
        Process incoming requests for security checks
        """
        # Log suspicious requests
        if self.is_suspicious_request(request):
            logger.warning(
                f"Suspicious request detected: {request.method} {request.path} "
                f"from {self.get_client_ip(request)} - {request.META.get('HTTP_USER_AGENT', '')}"
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Add security headers to responses
        """
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Remove server information
        if 'Server' in response:
            del response['Server']
        
        return response
    
    def is_suspicious_request(self, request):
        """
        Detect potentially suspicious requests
        """
        suspicious_patterns = [
            'admin/login',
            'wp-admin',
            'phpmyadmin',
            '.env',
            'config.php',
            'shell',
            'cmd',
            'eval',
            'exec'
        ]
        
        path = request.path.lower()
        return any(pattern in path for pattern in suspicious_patterns)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip