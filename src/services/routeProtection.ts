import { UserDataService } from './userData';

export interface User {
  id?: string;
  name: string;
  role: 'Vehicle Owner' | 'Admin' | 'Staff' | 'Chairperson' | 'Treasurer';
  phone: string;
  permissions?: string[];
  hasCompletedCapitalPayment?: boolean;
}

export interface RouteConfig {
  path: string;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requiresCapitalPayment?: boolean;
  isPublic?: boolean;
}

// Define route configurations with their access requirements
export const routeConfigs: Record<string, RouteConfig> = {
  // Public routes
  'home': { path: 'home', isPublic: true },
  'about': { path: 'about', isPublic: true },
  'join': { path: 'join', isPublic: true },
  'faq': { path: 'faq', isPublic: true },
  'contact': { path: 'contact', isPublic: true },
  'login': { path: 'login', isPublic: true },
  'register': { path: 'register', isPublic: true },
  'forgot-password': { path: 'forgot-password', isPublic: true },

  // Vehicle Owner routes
  'users/welcome': { 
    path: 'users/welcome', 
    allowedRoles: ['Vehicle Owner'],
    requiresCapitalPayment: false
  },
  'users/home': { 
    path: 'users/home', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['view_own_profile'],
    requiresCapitalPayment: true
  },
  'users/profile': { 
    path: 'users/profile', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['view_own_profile'],
    requiresCapitalPayment: true
  },
  'users/vehicles': { 
    path: 'users/vehicles', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['manage_own_vehicles'],
    requiresCapitalPayment: true
  },
  'users/apply-loan': { 
    path: 'users/apply-loan', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['apply_loans'],
    requiresCapitalPayment: true
  },
  'users/financial-status': { 
    path: 'users/financial-status', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['view_own_financials'],
    requiresCapitalPayment: true
  },
  'users/addVehicle': { 
    path: 'users/addVehicle', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['manage_own_vehicles'],
    requiresCapitalPayment: true
  },
  'users/exit': { 
    path: 'users/exit', 
    allowedRoles: ['Vehicle Owner'],
    requiredPermissions: ['view_own_profile'],
    requiresCapitalPayment: true
  },

  // Admin routes
  'admin/dashboard': { 
    path: 'admin/dashboard', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['full_access']
  },
  'admin/users': { 
    path: 'admin/users', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_members']
  },
  'admin/users/approve': { 
    path: 'admin/users/approve', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['approve_members']
  },
  'admin/users/roles': { 
    path: 'admin/users/roles', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_roles']
  },
  'admin/users/create': { 
    path: 'admin/users/create', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_members']
  },
  'admin/users/profiles': { 
    path: 'admin/users/profiles', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_members']
  },
  'admin/fleet': { 
    path: 'admin/fleet', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_fleet']
  },
  'admin/financials': { 
    path: 'admin/financials', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_financials']
  },
  'admin/loans': { 
    path: 'admin/loans', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_loans']
  },
  'admin/fleet/routes': { 
    path: 'admin/fleet/routes', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['manage_routes']
  },
  'admin/reports/users': { 
    path: 'admin/reports/users', 
    allowedRoles: ['Admin'],
    requiredPermissions: ['view_all_reports']
  },

  // Staff routes
  'staff/dashboard': { 
    path: 'staff/dashboard', 
    allowedRoles: ['Staff', 'Chairperson', 'Treasurer'],
    requiredPermissions: ['view_reports']
  },
  'staff/update': { 
    path: 'staff/update', 
    allowedRoles: ['Staff', 'Chairperson', 'Treasurer'],
    requiredPermissions: ['view_own_profile']
  },
  'staff/salary': { 
    path: 'staff/salary', 
    allowedRoles: ['Staff', 'Treasurer'],
    requiredPermissions: ['manage_financials']
  },
  'staff/loanmanagement': { 
    path: 'staff/loanmanagement', 
    allowedRoles: ['Staff', 'Chairperson', 'Treasurer'],
    requiredPermissions: ['manage_loans']
  },
  'staff/expensetracking': { 
    path: 'staff/expensetracking', 
    allowedRoles: ['Staff', 'Treasurer'],
    requiredPermissions: ['manage_expenses']
  },
  'staff/matatumanagement': { 
    path: 'staff/matatumanagement', 
    allowedRoles: ['Staff', 'Chairperson'],
    requiredPermissions: ['manage_fleet']
  },
  'staff/reports': { 
    path: 'staff/reports', 
    allowedRoles: ['Staff', 'Chairperson', 'Treasurer'],
    requiredPermissions: ['view_reports']
  }
};

export class RouteProtectionService {
  /**
   * Check if a user is authorized to access a specific route
   */
  static isAuthorized(user: User | null, routePath: string): {
    authorized: boolean;
    reason?: string;
    redirectTo?: string;
  } {
    const routeConfig = routeConfigs[routePath];
    
    // If route config not found, deny access
    if (!routeConfig) {
      return {
        authorized: false,
        reason: 'Route not found',
        redirectTo: 'home'
      };
    }

    // Allow access to public routes
    if (routeConfig.isPublic) {
      return { authorized: true };
    }

    // Require authentication for protected routes
    if (!user) {
      return {
        authorized: false,
        reason: 'Authentication required',
        redirectTo: 'login'
      };
    }

    // Check role authorization
    if (routeConfig.allowedRoles && !routeConfig.allowedRoles.includes(user.role)) {
      return {
        authorized: false,
        reason: `Access denied. Required roles: ${routeConfig.allowedRoles.join(', ')}`,
        redirectTo: this.getDefaultRouteForRole(user.role)
      };
    }

    // Check capital payment requirement for vehicle owners
    if (routeConfig.requiresCapitalPayment && user.role === 'Vehicle Owner' && !user.hasCompletedCapitalPayment) {
      return {
        authorized: false,
        reason: 'Capital payment required',
        redirectTo: 'users/welcome'
      };
    }

    // Check specific permissions
    if (routeConfig.requiredPermissions) {
      const userPermissions = this.getUserPermissions(user);
      const hasRequiredPermissions = routeConfig.requiredPermissions.every(permission =>
        userPermissions.includes(permission) || userPermissions.includes('full_access')
      );

      if (!hasRequiredPermissions) {
        return {
          authorized: false,
          reason: `Insufficient permissions. Required: ${routeConfig.requiredPermissions.join(', ')}`,
          redirectTo: this.getDefaultRouteForRole(user.role)
        };
      }
    }

    return { authorized: true };
  }

  /**
   * Get user permissions based on their role
   */
  private static getUserPermissions(user: User): string[] {
    // If user has explicit permissions, use those
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Otherwise, get permissions from role
    const roles = UserDataService.getAllRoles();
    const userRole = roles.find(role => role.name === user.role);
    return userRole ? userRole.permissions : [];
  }

  /**
   * Get the default route for a user's role
   */
  static getDefaultRouteForRole(role: string): string {
    switch (role) {
      case 'Vehicle Owner':
        return 'users/home';
      case 'Admin':
        return 'admin/dashboard';
      case 'Staff':
      case 'Chairperson':
      case 'Treasurer':
        return 'staff/dashboard';
      default:
        // Default unknown roles to Vehicle Owner dashboard
        return 'users/home';
    }
  }

  /**
   * Get all accessible routes for a user
   */
  static getAccessibleRoutes(user: User | null): string[] {
    return Object.keys(routeConfigs).filter(routePath => 
      this.isAuthorized(user, routePath).authorized
    );
  }

  /**
   * Middleware function to protect navigation
   */
  static protectNavigation(
    user: User | null, 
    targetRoute: string, 
    onUnauthorized?: (reason: string, redirectTo: string) => void
  ): boolean {
    const authResult = this.isAuthorized(user, targetRoute);
    
    if (!authResult.authorized && onUnauthorized && authResult.redirectTo) {
      onUnauthorized(authResult.reason || 'Access denied', authResult.redirectTo);
      return false;
    }
    
    return authResult.authorized;
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasRole(user: User | null, roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * Get navigation menu items based on user permissions
   */
  static getNavigationItems(user: User | null): Array<{
    label: string;
    route: string;
    icon?: string;
    children?: Array<{ label: string; route: string; }>;
  }> {
    if (!user) return [];

    const items = [];

    // Dashboard
    const dashboardRoute = this.getDefaultRouteForRole(user.role);
    if (this.isAuthorized(user, dashboardRoute).authorized) {
      items.push({
        label: 'Dashboard',
        route: dashboardRoute,
        icon: 'dashboard'
      });
    }

    // Role-specific navigation
    if (user.role === 'Vehicle Owner') {
      const vehicleOwnerItems = [
        { label: 'Profile', route: 'users/profile' },
        { label: 'My Vehicles', route: 'users/vehicles' },
        { label: 'Apply for Loan', route: 'users/apply-loan' },
        { label: 'Financial Status', route: 'users/financial-status' }
      ].filter(item => this.isAuthorized(user, item.route).authorized);

      if (vehicleOwnerItems.length > 0) {
        items.push({
          label: 'My Account',
          route: '',
          children: vehicleOwnerItems
        });
      }
    } else if (user.role === 'Admin') {
      const adminItems = [
        { label: 'User Management', route: 'admin/users' },
        { label: 'Fleet Management', route: 'admin/fleet' },
        { label: 'Financial Overview', route: 'admin/financials' },
        { label: 'Loan Applications', route: 'admin/loans' },
        { label: 'Reports', route: 'admin/reports/users' }
      ].filter(item => this.isAuthorized(user, item.route).authorized);

      if (adminItems.length > 0) {
        items.push({
          label: 'Administration',
          route: '',
          children: adminItems
        });
      }
    } else if (['Staff', 'Chairperson', 'Treasurer'].includes(user.role)) {
      const staffItems = [
        { label: 'Loan Management', route: 'staff/loanmanagement' },
        { label: 'Expense Tracking', route: 'staff/expensetracking' },
        { label: 'Matatu Management', route: 'staff/matatumanagement' },
        { label: 'Reports', route: 'staff/reports' }
      ].filter(item => this.isAuthorized(user, item.route).authorized);

      if (staffItems.length > 0) {
        items.push({
          label: 'Operations',
          route: '',
          children: staffItems
        });
      }
    }

    return items;
  }
}
