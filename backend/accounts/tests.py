"""
Tests for accounts app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='viewer'
        )
    
    def test_user_creation(self):
        """Test user creation with custom fields"""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.role, 'viewer')
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
    
    def test_user_permissions(self):
        """Test role-based permissions"""
        # Viewer permissions
        self.assertTrue(self.user.is_viewer)
        self.assertFalse(self.user.is_contributor)
        self.assertFalse(self.user.is_admin)
        
        # Admin user
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='AdminPassword123!',
            role='admin'
        )
        self.assertTrue(admin_user.is_admin)
        self.assertTrue(admin_user.can_create_users())
    
    def test_account_locking(self):
        """Test account locking functionality"""
        self.assertFalse(self.user.is_account_locked())
        
        # Increment failed attempts
        for _ in range(5):
            self.user.increment_failed_login()
        
        self.assertTrue(self.user.is_account_locked())
        
        # Unlock account
        self.user.unlock_account()
        self.assertFalse(self.user.is_account_locked())
        self.assertEqual(self.user.failed_login_attempts, 0)


class AuthenticationAPITest(APITestCase):
    """Test authentication API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='viewer'
        )
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
    
    def test_login_success(self):
        """Test successful login"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_logout(self):
        """Test user logout"""
        # Login first
        refresh = RefreshToken.for_user(self.user)
        
        # Logout
        data = {'refresh_token': str(refresh)}
        response = self.client.post(self.logout_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserManagementAPITest(APITestCase):
    """Test user management API endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='AdminPassword123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.client.force_authenticate(user=self.admin_user)
    
    def test_create_user(self):
        """Test user creation by admin"""
        url = reverse('create_user')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'NewUserPassword123!',
            'role': 'viewer',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_list_users(self):
        """Test listing users"""
        url = reverse('user_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)