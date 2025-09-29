#!/usr/bin/env python
"""
Development server runner with automatic setup
"""
import os
import sys
import subprocess
import django
from pathlib import Path

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facility_management.settings')
    django.setup()

def check_dependencies():
    """Check if all dependencies are installed"""
    try:
        import django
        import rest_framework
        import corsheaders
        import pyotp
        import qrcode
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("💡 Run: pip install -r requirements.txt")
        return False

def run_migrations():
    """Run database migrations"""
    print("🔄 Running database migrations...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("✅ Migrations completed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Migration failed")
        return False

def create_default_data():
    """Create default permissions and dashboard sections"""
    print("🔄 Creating default data...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'create_default_permissions'], check=True)
        subprocess.run([sys.executable, 'manage.py', 'create_dashboard_sections'], check=True)
        print("✅ Default data created successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Default data creation failed")
        return False

def check_admin_user():
    """Check if admin user exists"""
    setup_django()
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    admin_users = User.objects.filter(role='admin')
    if admin_users.exists():
        print(f"✅ Admin user(s) found: {', '.join([u.username for u in admin_users])}")
        return True
    else:
        print("⚠️  No admin users found")
        print("💡 Create one with: python manage.py create_admin_user")
        return False

def start_server():
    """Start the Django development server"""
    print("🚀 Starting Django development server...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'runserver'], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except subprocess.CalledProcessError:
        print("❌ Server failed to start")

def main():
    """Main setup and run function"""
    print("🏗️  Facility Management Backend Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path('manage.py').exists():
        print("❌ manage.py not found. Please run this script from the backend directory.")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        sys.exit(1)
    
    # Create default data
    create_default_data()
    
    # Check for admin user
    check_admin_user()
    
    print("\n" + "=" * 50)
    print("🎉 Backend setup complete!")
    print("📝 Next steps:")
    print("   1. Create admin user: python manage.py create_admin_user")
    print("   2. Start server: python manage.py runserver")
    print("   3. Access admin: http://localhost:8000/admin/")
    print("   4. API docs: http://localhost:8000/api/")
    print("=" * 50)
    
    # Ask if user wants to start server
    response = input("\n🚀 Start development server now? (y/N): ")
    if response.lower() in ['y', 'yes']:
        start_server()

if __name__ == '__main__':
    main()