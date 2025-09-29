#!/usr/bin/env python
"""
Test script to verify User List API endpoint functionality
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

def test_user_list_api():
    """Test the User List API endpoint"""
    
    print("=== TESTING USER LIST API ENDPOINT ===\n")
    
    # Check if server is running
    try:
        health_response = requests.get('http://localhost:8000/api/health/', timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print("❌ Backend server health check failed")
            return
    except requests.exceptions.RequestException:
        print("❌ Backend server is not running or not accessible")
        print("   Please start the server with: python manage.py runserver")
        return
    
    # Get users from database
    users = User.objects.all()
    print(f"Users in database: {users.count()}")
    
    if users.count() == 0:
        print("❌ No users in database. Creating test users...")
        # Create a test admin user
        admin_user = User.objects.create_user(
            username='test_admin',
            email='admin@test.com',
            password='TestAdmin123!',
            role='admin',
            is_active=True
        )
        print(f"✅ Created test admin user: {admin_user.username}")
    
    # Test with different user roles
    test_users = []
    
    # Find or create admin user
    admin_user = User.objects.filter(role='admin').first()
    if not admin_user:
        admin_user = User.objects.filter(is_superuser=True).first()
    
    if admin_user:
        test_users.append(('admin', admin_user))
    
    # Find contributor user
    contributor_user = User.objects.filter(role='contributor').first()
    if contributor_user:
        test_users.append(('contributor', contributor_user))
    
    # Find viewer user
    viewer_user = User.objects.filter(role='viewer').first()
    if viewer_user:
        test_users.append(('viewer', viewer_user))
    
    if not test_users:
        print("❌ No test users available")
        return
    
    # Test API with each user type
    for role, user in test_users:
        print(f"\n--- Testing with {role} user: {user.username} ---")
        
        # Generate token for user
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(
                'http://localhost:8000/api/auth/users/',
                headers=headers,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and 'results' in data:
                    # Paginated response
                    user_count = len(data['results'])
                    total_count = data.get('count', user_count)
                    print(f"✅ SUCCESS: Returned {user_count} users (total: {total_count})")
                    
                    if user_count > 0:
                        sample_user = data['results'][0]
                        print(f"Sample user: {sample_user.get('username', 'N/A')} (role: {sample_user.get('role', 'N/A')})")
                    else:
                        print("⚠️  WARNING: Empty results array")
                        
                elif isinstance(data, list):
                    # Direct array response
                    user_count = len(data)
                    print(f"✅ SUCCESS: Returned {user_count} users")
                    
                    if user_count > 0:
                        sample_user = data[0]
                        print(f"Sample user: {sample_user.get('username', 'N/A')} (role: {sample_user.get('role', 'N/A')})")
                    else:
                        print("❌ ISSUE: Empty array returned")
                else:
                    print(f"⚠️  Unexpected response format: {type(data)}")
                    
            elif response.status_code == 403:
                print(f"❌ FORBIDDEN: User {user.username} with role {user.role} cannot access user list")
            elif response.status_code == 401:
                print("❌ UNAUTHORIZED: Token may be invalid")
            else:
                print(f"❌ ERROR: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST ERROR: {e}")
    
    print("\n=== SUMMARY ===")
    print("Expected behavior:")
    print("- Admin users and superusers: Should see all users")
    print("- Contributors and viewers: Should get 403 Forbidden")
    print("- Empty array indicates permission or query issues")

if __name__ == "__main__":
    test_user_list_api()