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
│   │   ├── AdminDashboard.tsx # Main admin interface
│   │   └── UserManagement.tsx # User CRUD operations
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx      # Login interface
│   │   └── TwoFactorAuth.tsx  # 2FA setup/verification
│   ├── common/                # Reusable components
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   ├── ApiStatus.tsx      # API connection status
│   │   ├── ConfirmDialog.tsx  # Confirmation dialogs
│   │   └── TabNavigation.tsx  # Tab navigation
│   ├── dashboard/             # Dashboard components
│   │   ├── Dashboard.tsx      # Main dashboard layout
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── TopNavigation.tsx  # Top navigation bar
│   │   └── MainContent.tsx    # Content area router
│   ├── facility/              # Facility management
│   │   ├── FacilityDashboard.tsx    # Facility overview
│   │   ├── LocationManager.tsx      # Location management
│   │   ├── LocationDashboard.tsx    # Location-specific dashboard
│   │   ├── TankManagement.tsx       # Tank operations
│   │   ├── ReleaseDetection.tsx     # Release detection systems
│   │   └── PermitsLicenses.tsx      # Permit management
│   └── settings/              # Settings components
│       ├── SettingsPanel.tsx  # Main settings interface
│       ├── SecuritySettings.tsx     # Security configuration
│       └── ProfilePanel.tsx   # User profile management
├── contexts/                  # React contexts
│   └── AuthContext.tsx        # Authentication context
├── hooks/                     # Custom React hooks
│   └── useAuth.ts             # Authentication hook
├── pages/                     # Page-level components
│   └── LocationsPage.tsx      # Locations management page
├── services/                  # API services
│   └── api.ts                 # API service layer
├── types/                     # TypeScript definitions
│   └── auth.ts                # Authentication types
├── utils/                     # Utility functions
│   └── apiDebug.ts            # API debugging utilities
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

## Component Architecture

### Authentication Flow
1. **LoginForm** - Handles user authentication with 2FA support
2. **AuthContext** - Provides global authentication state
3. **ProtectedRoute** - Ensures authenticated access to protected pages
4. **useAuth** - Custom hook for authentication operations

### Dashboard Layout
1. **Dashboard** - Main layout container
2. **Sidebar** - Navigation with role-based menu items
3. **TopNavigation** - Search, notifications, and user menu
4. **MainContent** - Dynamic content area based on selected view

### Admin Features
1. **AdminDashboard** - Admin-only interface
2. **UserManagement** - Complete user CRUD operations
3. **Permission checks** - UI elements shown/hidden based on permissions

## API Integration

### Service Layer
- **api.ts** - Centralized API service with error handling
- **axios.ts** - Configured Axios instance with interceptors
- **Token Management** - Automatic token refresh and storage

### Error Handling
- **Network Errors** - Connection failure detection and user feedback
- **Authentication Errors** - Automatic logout on token expiry
- **Validation Errors** - Form validation with server-side error display
- **Permission Errors** - Graceful handling of access denied scenarios

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

### Debugging
The application includes comprehensive debugging tools:

```javascript
// Available in browser console (development only)
window.apiDebugger.runDiagnostics()  // Run full API diagnostics
window.apiDebugger.testEndpoint('/api/auth/users/')  // Test specific endpoint
window.apiDebugger.startApiMonitoring()  // Monitor all API calls
```

## Role-Based Features

### Administrator
- Full system access
- User management (create, edit, delete users)
- System configuration
- All facility operations
- Audit log access

### Contributor
- Create and edit facilities
- Manage tanks and permits
- Edit dashboard sections
- Generate reports
- No user management access

### Viewer
- Read-only access to assigned facilities
- View dashboards and reports
- No editing capabilities
- No administrative functions

## Security Considerations

### Frontend Security
- **XSS Prevention** - All user input is sanitized
- **CSRF Protection** - CSRF tokens for state-changing operations
- **Secure Storage** - Sensitive data stored securely
- **Input Validation** - Client-side validation with server-side verification

### API Security
- **Authentication Required** - All API calls require valid JWT tokens
- **Permission Checks** - Server-side permission validation
- **Rate Limiting** - Protection against abuse
- **Error Handling** - Secure error messages that don't leak information

## Production Build

### Build Process
```bash
npm run build
```

### Deployment Considerations
- Configure environment variables for production
- Set up proper CORS origins
- Enable HTTPS
- Configure CDN for static assets
- Set up monitoring and error tracking

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check backend server is running
   - Verify API URL in environment variables
   - Check CORS configuration

2. **Authentication Issues**
   - Clear browser localStorage
   - Check token expiry
   - Verify backend authentication endpoints

3. **Permission Errors**
   - Check user role assignments
   - Verify permission configuration in backend
   - Review browser console for detailed errors

### Development Tools
- **React Developer Tools** - Component inspection
- **Redux DevTools** - State management debugging
- **Network Tab** - API request/response inspection
- **Console Logging** - Comprehensive logging in development mode

This frontend provides a modern, secure, and user-friendly interface for comprehensive facility management operations.