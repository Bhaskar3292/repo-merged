#!/usr/bin/env python
"""
Test script to verify logout API endpoint functionality
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User

def test_logout_api():
    """Test the logout API endpoint"""
    
    print("=== Testing Logout API Endpoint ===\n")
    
    # 1. Create a test user and get tokens
    try:
        user = User.objects.get(username='admin')
        print(f"✅ Using existing user: {user.username}")
    except User.DoesNotExist:
        print("❌ Admin user not found. Please create one first:")
        print("   python manage.py create_sample_users")
        return
    
    # Generate tokens for testing
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    print(f"✅ Generated tokens for user: {user.username}")
    print(f"   Access token: {access_token[:20]}...")
    print(f"   Refresh token: {refresh_token[:20]}...")
    
    # 2. Test logout with valid refresh token
    print("\n--- Test 1: Logout with valid refresh token ---")
    
    logout_data = {
        'refresh_token': refresh_token
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/logout/',
            json=logout_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Test 1 PASSED: Logout with valid token successful")
        else:
            print(f"❌ Test 1 FAILED: Expected 200, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Test 1 FAILED: Request error - {e}")
    
    # 3. Test logout without refresh token
    print("\n--- Test 2: Logout without refresh token ---")
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/logout/',
            json={},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Test 2 PASSED: Logout without token successful")
        else:
            print(f"❌ Test 2 FAILED: Expected 200, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Test 2 FAILED: Request error - {e}")
    
    # 4. Test logout with invalid refresh token
    print("\n--- Test 3: Logout with invalid refresh token ---")
    
    invalid_logout_data = {
        'refresh_token': 'invalid_token_12345'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/logout/',
            json=invalid_logout_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Test 3 PASSED: Logout with invalid token handled gracefully")
        else:
            print(f"❌ Test 3 FAILED: Expected 200, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Test 3 FAILED: Request error - {e}")
    
    print("\n=== Test Summary ===")
    print("The logout endpoint should return 200 OK for all scenarios")
    print("Check the Django server logs for detailed error information")

if __name__ == "__main__":
    test_logout_api()