"""
Tests for security app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import SecurityEvent, SecuritySettings

User = get_user_model()


class SecurityEventTest(TestCase):
    """Test SecurityEvent model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='viewer'
        )
    
    def test_security_event_creation(self):
        """Test security event creation"""
        event = SecurityEvent.objects.create(
            event_type='login_success',
            severity='low',
            user=self.user,
            ip_address='127.0.0.1',
            description='Test login event'
        )
        self.assertEqual(event.event_type, 'login_success')
        self.assertEqual(event.user, self.user)


class SecuritySettingsTest(TestCase):
    """Test SecuritySettings model"""
    
    def test_security_settings_singleton(self):
        """Test that only one SecuritySettings instance can exist"""
        settings1 = SecuritySettings.get_settings()
        settings2 = SecuritySettings.get_settings()
        self.assertEqual(settings1.id, settings2.id)