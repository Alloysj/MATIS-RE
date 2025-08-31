# Route Protection System

This document explains how the route protection system works in the MATIS SACCO application.

## Overview

The route protection system ensures that users can only access routes and features they are authorized to use based on their role and permissions. It provides two implementation approaches:

1. **State-based routing** (current App.tsx) - Enhanced with protection
2. **React Router v7** (RouterApp.tsx) - Full URL-based routing with protection

## Key Components

### 1. RouteProtectionService (`/services/routeProtection.ts`)

Core service that handles all authorization logic:

- **Route Configuration**: Defines which roles and permissions are required for each route
- **Authorization Checking**: Validates user access to specific routes
- **Permission Management**: Integrates with the userData service for role-based permissions
- **Navigation Control**: Provides safe navigation with automatic redirects

### 2. ProtectedRoute Component (`/components/ProtectedRoute.tsx`)

React component that wraps routes to provide protection:

```tsx
<ProtectedRoute user={user} routePath="admin/dashboard" onNavigate={handleNavigate}>
  <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
</ProtectedRoute>
```

### 3. useAuth Hook (`/hooks/useAuth.ts`)

Custom React hook for authentication and authorization:

```tsx
const { user, hasPermission, hasRole, canAccess, login, logout } = useAuth();
```

## Route Configuration

Routes are configured in `routeConfigs` with the following properties:

```typescript
interface RouteConfig {
  path: string;                    // Route path
  allowedRoles?: string[];         // Roles that can access this route
  requiredPermissions?: string[];  // Specific permissions required
  requiresCapitalPayment?: boolean; // For vehicle owners only
  isPublic?: boolean;              // Public routes (no auth required)
}
```

### Example Route Configurations

```typescript
// Public route
'home': { path: 'home', isPublic: true }

// Vehicle owner route requiring capital payment
'users/home': { 
  path: 'users/home', 
  allowedRoles: ['Vehicle Owner'],
  requiredPermissions: ['view_own_profile'],
  requiresCapitalPayment: true
}

// Admin-only route
'admin/users': { 
  path: 'admin/users', 
  allowedRoles: ['Admin'],
  requiredPermissions: ['manage_members']
}

// Multi-role staff route
'staff/dashboard': { 
  path: 'staff/dashboard', 
  allowedRoles: ['Staff', 'Chairperson', 'Treasurer'],
  requiredPermissions: ['view_reports']
}
```

## Implementation Approaches

### Current State-Based Routing (App.tsx)

Enhanced your existing routing system with protection:

**Features:**
- Works with current navigation system
- No additional dependencies
- Automatic authorization checking
- Graceful unauthorized access handling

**Usage:**
```tsx
// Navigation with automatic protection
const handleNavigate = (page: string) => {
  const authResult = RouteProtectionService.isAuthorized(user, page);
  if (!authResult.authorized) {
    // Handle unauthorized access
    return;
  }
  setCurrentPage(page);
};

// Protected route rendering
case 'admin/dashboard':
  return (
    <ProtectedRoute user={user} routePath="admin/dashboard" onNavigate={handleNavigate}>
      <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
    </ProtectedRoute>
  );
```

### React Router v7 Implementation (RouterApp.tsx)

Full URL-based routing with protection:

**Features:**
- Real URL routing with browser history
- Deep linking support
- Automatic redirects
- Parameter-based routes
- Better SEO support

**Usage:**
```tsx
// To use React Router instead of current system:
// 1. Install React Router: npm install react-router-dom
// 2. Replace App.tsx import in main.tsx:
import RouterApp from './components/RouterApp';

// 3. Use RouterApp instead of App
<RouterApp />
```

## Permission System

### Built-in Permissions

The system includes comprehensive permissions:

**User Management:**
- `view_own_profile` - View own profile information
- `manage_members` - Create, edit, and manage member accounts
- `approve_members` - Approve new member registrations
- `manage_roles` - Create and manage user roles and permissions

**Fleet Management:**
- `manage_own_vehicles` - Manage own registered vehicles
- `manage_fleet` - Manage all SACCO vehicles and assignments
- `manage_routes` - Manage vehicle routes and schedules

**Financial:**
- `view_own_financials` - View own financial information
- `manage_financials` - Manage SACCO finances and accounts
- `apply_loans` - Apply for loans and advances
- `manage_loans` - Process and manage loan applications
- `approve_transactions` - Approve financial transactions
- `manage_expenses` - Track and manage SACCO expenses

**Reports:**
- `view_reports` - View standard operational reports
- `view_all_reports` - View all system reports including sensitive data

**System:**
- `full_access` - Complete system access with all permissions
- `manage_board_matters` - Manage board meetings and decisions
- `approve_major_decisions` - Approve major SACCO decisions

### Role Permissions

**Vehicle Owner:**
- `view_own_profile`
- `manage_own_vehicles`
- `apply_loans`
- `view_own_financials`

**Admin:**
- `full_access` (grants all permissions)

**Staff:**
- `manage_loans`
- `view_reports`
- `manage_members`
- `manage_fleet`
- `manage_expenses`

**Chairperson:**
- `view_all_reports`
- `approve_major_decisions`
- `manage_board_matters`

**Treasurer:**
- `manage_financials`
- `approve_transactions`
- `view_all_reports`

## Using the Protection System

### 1. Checking Permissions in Components

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { hasPermission, hasRole, user } = useAuth();

  // Check specific permission
  if (hasPermission('manage_members')) {
    // Show user management features
  }

  // Check role
  if (hasRole(['Admin', 'Staff'])) {
    // Show admin/staff features
  }

  // Check multiple conditions
  if (user?.role === 'Vehicle Owner' && user?.hasCompletedCapitalPayment) {
    // Show vehicle owner features
  }
}
```

### 2. Conditional Rendering

```tsx
function NavigationMenu() {
  const { hasPermission, canAccess } = useAuth();

  return (
    <nav>
      {canAccess('admin/users') && (
        <Link to="/admin/users">User Management</Link>
      )}
      
      {hasPermission('manage_fleet') && (
        <Link to="/admin/fleet">Fleet Management</Link>
      )}
    </nav>
  );
}
```

### 3. Programmatic Navigation Protection

```tsx
function handleNavigateToAdmin() {
  const { canAccess } = useAuth();
  
  if (canAccess('admin/dashboard')) {
    navigate('/admin/dashboard');
  } else {
    // Show error or redirect
    alert('You do not have permission to access the admin dashboard');
  }
}
```

## Security Considerations

1. **Client-Side Only**: This protection is client-side only and should be supplemented with server-side authorization
2. **Data Validation**: Always validate permissions on the backend before processing requests
3. **Sensitive Data**: Don't expose sensitive data to unauthorized users, even if UI is hidden
4. **Session Management**: Implement proper session management and token refresh
5. **Audit Logging**: Log access attempts and permission changes for security monitoring

## Extending the System

### Adding New Routes

1. Add route configuration to `routeConfigs` in `/services/routeProtection.ts`
2. Add the route to your routing system (App.tsx or RouterApp.tsx)
3. Wrap the route component with `ProtectedRoute`

### Adding New Permissions

1. Add permission to `mockPermissions` in `/services/userData.ts`
2. Assign permission to appropriate roles in `mockRoles`
3. Update route configurations that require the new permission

### Adding New Roles

1. Add role to `mockRoles` in `/services/userData.ts`
2. Define permissions for the new role
3. Update route configurations to include the new role where appropriate

## Migration Guide

### From Current System to React Router

1. Install React Router:
```bash
npm install react-router-dom @types/react-router-dom
```

2. Replace App component:
```tsx
// In main.tsx or index.tsx
import RouterApp from './components/RouterApp';
// Replace <App /> with <RouterApp />
```

3. Update navigation calls:
```tsx
// Old: onNavigate('admin/dashboard')
// New: navigate('/admin/dashboard')
```

4. Update route path references:
```tsx
// Old: currentPage === 'admin/dashboard'
// New: location.pathname === '/admin/dashboard'
```

## Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions necessary
2. **Role Hierarchy**: Design roles with clear hierarchies and inheritance
3. **Permission Granularity**: Create specific permissions rather than broad access
4. **Regular Audits**: Regularly review and audit user permissions
5. **Default Deny**: Deny access by default, explicitly grant permissions
6. **Error Handling**: Provide clear error messages for unauthorized access
7. **User Experience**: Guide users to appropriate actions when access is denied

## Troubleshooting

### Common Issues

1. **User not redirected after login**: Check if default route for role is accessible
2. **Permission denied errors**: Verify user has required permissions in userData service
3. **Route not protected**: Ensure route is wrapped with ProtectedRoute component
4. **Navigation not working**: Check route configuration and handleNavigate implementation

### Debug Tools

```tsx
// Check current user permissions
console.log('User permissions:', RouteProtectionService.getUserPermissions(user));

// Check route access
console.log('Can access route:', RouteProtectionService.isAuthorized(user, 'admin/dashboard'));

// Get accessible routes
console.log('Accessible routes:', RouteProtectionService.getAccessibleRoutes(user));
```