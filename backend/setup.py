#!/usr/bin/env python
"""
Setup script for Facility Management Backend
"""
import os
import sys
import subprocess
from pathlib import Path

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def setup_database():
    """Setup database and run migrations"""
    print("🗄️  Setting up database...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("✅ Database setup complete")
        return True
    except subprocess.CalledProcessError:
        print("❌ Database setup failed")
        return False

def create_default_data():
    """Create default permissions and dashboard sections"""
    print("📋 Creating default data...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'create_default_permissions'], check=True)
        subprocess.run([sys.executable, 'manage.py', 'create_dashboard_sections'], check=True)
        print("✅ Default data created")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to create default data")
        return False

def main():
    """Main setup function"""
    print("🏗️  Facility Management Backend Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path('manage.py').exists():
        print("❌ manage.py not found. Please run this script from the backend directory.")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        sys.exit(1)
    
    # Create default data
    if not create_default_data():
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Backend setup complete!")
    print("\n📝 Next steps:")
    print("   1. Create admin user:")
    print("      python manage.py create_admin_user")
    print("   2. Start development server:")
    print("      python manage.py runserver")
    print("   3. Access admin panel:")
    print("      http://localhost:8000/admin/")
    print("   4. API health check:")
    print("      http://localhost:8000/api/health/")
    print("=" * 50)

if __name__ == '__main__':
    main()