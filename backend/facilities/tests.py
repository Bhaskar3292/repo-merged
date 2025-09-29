"""
Tests for facilities app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Location, Tank, Permit

User = get_user_model()


class LocationModelTest(TestCase):
    """Test Location model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='admin'
        )
        self.location = Location.objects.create(
            name='Test Location',
            address='123 Test St',
            description='Test facility',
            created_by=self.user
        )
    
    def test_location_creation(self):
        """Test location creation"""
        self.assertEqual(self.location.name, 'Test Location')
        self.assertEqual(self.location.created_by, self.user)
        self.assertTrue(self.location.is_active)
    
    def test_location_str(self):
        """Test location string representation"""
        self.assertEqual(str(self.location), 'Test Location')


class TankModelTest(TestCase):
    """Test Tank model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='admin'
        )
        self.location = Location.objects.create(
            name='Test Location',
            address='123 Test St',
            created_by=self.user
        )
        self.tank = Tank.objects.create(
            location=self.location,
            name='Tank A1',
            tank_type='gasoline',
            capacity=10000,
            current_level=7500
        )
    
    def test_tank_creation(self):
        """Test tank creation"""
        self.assertEqual(self.tank.name, 'Tank A1')
        self.assertEqual(self.tank.location, self.location)
        self.assertEqual(self.tank.capacity, 10000)
    
    def test_fill_percentage(self):
        """Test fill percentage calculation"""
        self.assertEqual(self.tank.fill_percentage, 75.0)


class FacilitiesAPITest(APITestCase):
    """Test facilities API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_location(self):
        """Test location creation via API"""
        data = {
            'name': 'New Location',
            'address': '456 New St',
            'description': 'New test facility'
        }
        response = self.client.post('/api/facilities/locations/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Location.objects.filter(name='New Location').exists())