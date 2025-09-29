#!/usr/bin/env python
"""
Debug script to investigate User List API endpoint issue
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
django.setup()

from accounts.models import User
from accounts.serializers import UserListSerializer
from django.contrib.auth import get_user_model
import json

def debug_user_list_api():
    """Debug the User List API endpoint issue"""
    
    print("=== DEBUGGING USER LIST API ENDPOINT ===\n")
    
    # 1. Check database for users
    print("1. DATABASE INVESTIGATION:")
    print("-" * 40)
    
    total_users = User.objects.count()
    print(f"Total users in database: {total_users}")
    
    if total_users == 0:
        print("❌ ISSUE FOUND: No users exist in the database!")
        print("   Solution: Create users using management commands")
        return
    
    # Show user details
    users = User.objects.all()
    print("\nUsers in database:")
    for user in users:
        print(f"  - {user.username} (role: {user.role}, active: {user.is_active}, superuser: {user.is_superuser})")
    
    # 2. Check permissions logic
    print("\n2. PERMISSION LOGIC INVESTIGATION:")
    print("-" * 40)
    
    admin_users = User.objects.filter(role='admin')
    superusers = User.objects.filter(is_superuser=True)
    
    print(f"Admin users: {admin_users.count()}")
    print(f"Superusers: {superusers.count()}")
    
    if admin_users.count() == 0 and superusers.count() == 0:
        print("❌ ISSUE FOUND: No admin users or superusers exist!")
        print("   Solution: Create an admin user or promote existing user to admin")
        return
    
    # Test permission logic for each user
    print("\nPermission test for each user:")
    for user in users:
        has_permission = user.is_superuser or user.role == 'admin'
        print(f"  - {user.username}: {'✅ CAN ACCESS' if has_permission else '❌ NO ACCESS'}")
    
    # 3. Check serializer
    print("\n3. SERIALIZER INVESTIGATION:")
    print("-" * 40)
    
    try:
        # Test serializing all users
        serializer = UserListSerializer(users, many=True)
        serialized_data = serializer.data
        print(f"Serializer output count: {len(serialized_data)}")
        
        if len(serialized_data) == 0:
            print("❌ ISSUE FOUND: Serializer returning empty data!")
        else:
            print("✅ Serializer working correctly")
            print(f"Sample serialized user: {json.dumps(serialized_data[0], indent=2, default=str)}")
            
    except Exception as e:
        print(f"❌ SERIALIZER ERROR: {e}")
    
    # 4. Check queryset filtering
    print("\n4. QUERYSET FILTERING INVESTIGATION:")
    print("-" * 40)
    
    # Simulate the view's get_queryset logic
    for user in users:
        if user.is_superuser or user.role == 'admin':
            queryset = User.objects.all().order_by('-created_at')
            print(f"For user {user.username}: queryset count = {queryset.count()}")
        else:
            print(f"For user {user.username}: access denied (empty queryset)")
    
    # 5. Check for common issues
    print("\n5. COMMON ISSUES CHECK:")
    print("-" * 40)
    
    # Check if users are active
    inactive_users = User.objects.filter(is_active=False).count()
    if inactive_users > 0:
        print(f"⚠️  WARNING: {inactive_users} inactive users found")
    
    # Check for database connection issues
    try:
        User.objects.first()
        print("✅ Database connection working")
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")
    
    # 6. Recommendations
    print("\n6. RECOMMENDATIONS:")
    print("-" * 40)
    
    print("To fix the empty array issue:")
    print("1. Ensure the requesting user has admin role or is superuser")
    print("2. Check that users exist in the database")
    print("3. Verify the API endpoint is being called correctly")
    print("4. Check server logs for permission errors")
    print("5. Test with a known admin user")
    
    print("\nTo create an admin user:")
    print("  python manage.py create_admin_user")
    
    print("\nTo check current user permissions:")
    print("  python manage.py list_users --detailed")

if __name__ == "__main__":
    debug_user_list_api()