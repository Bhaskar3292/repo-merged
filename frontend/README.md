# Facility Management System - Frontend

## Overview
React TypeScript frontend for the Facility Management System with modern UI components, role-based access control, and comprehensive facility management features.

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Setup
Create a `.env` file in the frontend directory:
```bash
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=10000
VITE_ENABLE_API_LOGGING=true
```

### 3. Start Development Server
```bash
npm run dev
```

## Project Structure

```
frontend/src/
├── api/                        # API configuration
│   └── axios.ts               # Axios setup with interceptors
├── components/                # React components
│   ├── admin/                 # Admin-specific components
│   ├── auth/                  # Authentication components
│   ├── common/                # Reusable components
│   ├── dashboard/             # Dashboard components
│   ├── facility/              # Facility management
│   └── settings/              # Settings components
├── contexts/                  # React contexts
├── hooks/                     # Custom React hooks
├── pages/                     # Page-level components
├── services/                  # API services
├── types/                     # TypeScript definitions
├── utils/                     # Utility functions
├── App.tsx                    # Main app component
└── main.tsx                   # App entry point
```

## Features

### Authentication & Security
- **Secure Login**: JWT-based authentication with automatic token refresh
- **Two-Factor Authentication**: TOTP support with QR code setup
- **Role-Based Access**: Different UI based on user permissions
- **Account Security**: Password strength validation, account lockout handling
- **Session Management**: Automatic logout on token expiry

### User Interface
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern Components**: Clean, accessible UI components
- **Real-time Updates**: Live data updates and notifications
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Smooth loading indicators and skeleton screens

### Facility Management
- **Location Management**: Create, edit, and manage facility locations
- **Tank Monitoring**: Tank status, levels, and maintenance tracking
- **Permit Tracking**: License and permit management with expiry alerts
- **Dashboard Customization**: Configurable dashboard sections
- **Release Detection**: Environmental monitoring and alert systems

## Role-Based Features

### Administrator
- Full system access
- User management (create, edit, delete users)
- System configuration
- All facility operations

### Contributor
- Create and edit facilities
- Manage tanks and permits
- Edit dashboard sections
- Generate reports

### Viewer
- Read-only access to facilities
- View dashboards and reports
- No editing capabilities

## Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Environment Variables
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_API_TIMEOUT` - Request timeout in milliseconds (default: 10000)
- `VITE_ENABLE_API_LOGGING` - Enable API request/response logging (default: false)

This frontend provides a modern, secure, and user-friendly interface for comprehensive facility management operations.