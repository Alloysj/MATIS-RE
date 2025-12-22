import { canAccessMenuItem, menuRegistry } from '../navigation/menuRegistry';

export interface User {
  id?: string;
  name: string;
  role?: string;
  phone: string;
  permissions?: string[];
  hasCompletedCapitalPayment?: boolean;
}

export interface RouteConfig {
  path: string;
  isPublic?: boolean;
  requiresCapitalPayment?: boolean;
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
}

const anyOf = (permissions: string[] | undefined, required: string[] | undefined) => {
  if (!required || required.length === 0) return true;
  return required.some((permission) => permissions?.includes(permission));
};

const allOf = (permissions: string[] | undefined, required: string[] | undefined) => {
  if (!required || required.length === 0) return true;
  return required.every((permission) => permissions?.includes(permission));
};

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
  'not-found': { path: 'not-found', isPublic: true },

  // Shared app routes
  'app': { path: 'app' },
  'app/members': {
    path: 'app/members',
    requiredAnyPermissions: ['MEMBERS:READ', 'MEMBERS:READ_SELF', 'MEMBERS:CREATE', 'MEMBERS:APPROVE']
  },
  'app/vehicles': {
    path: 'app/vehicles',
    requiredAnyPermissions: ['VEHICLES:READ', 'VEHICLES:READ_SELF']
  },
  'app/remittances': {
    path: 'app/remittances',
    requiredAnyPermissions: ['FINANCE:COLLECT', 'FINANCE:VIEW']
  },
  'app/insurance': {
    path: 'app/insurance',
    requiredAnyPermissions: ['INSURANCE:VIEW', 'INSURANCE:WRITE']
  },
  'app/loans': {
    path: 'app/loans',
    requiredAnyPermissions: ['LOANS:VIEW', 'LOANS:APPLY', 'LOANS:APPROVE']
  },
  'app/dashboard': {
    path: 'app/dashboard',
    requiredAnyPermissions: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW']
  },
  'app/admin/dashboard': {
    path: 'app/admin/dashboard',
    requiredAnyPermissions: ['MEMBERS:READ', 'VEHICLES:READ', 'FINANCE:VIEW']
  },
  'app/members/approve': {
    path: 'app/members/approve',
    requiredAnyPermissions: ['MEMBERS:APPROVE']
  },
  'app/members/roles': {
    path: 'app/members/roles',
    requiredAnyPermissions: ['ADMIN:RBAC']
  },
  'app/members/create': {
    path: 'app/members/create',
    requiredAnyPermissions: ['MEMBERS:CREATE']
  },
  'app/members/profiles': {
    path: 'app/members/profiles',
    requiredAnyPermissions: ['MEMBERS:READ']
  },
  'app/members/profiles/:userId': {
    path: 'app/members/profiles/:userId',
    requiredAnyPermissions: ['MEMBERS:READ']
  },
  'app/vehicles/:vehicleId': {
    path: 'app/vehicles/:vehicleId',
    requiredAnyPermissions: ['VEHICLES:READ']
  },
  'app/vehicles/routes': {
    path: 'app/vehicles/routes',
    requiredAnyPermissions: ['VEHICLES:ROUTES_WRITE', 'VEHICLES:READ']
  },
  'app/vehicles/matatus': {
    path: 'app/vehicles/matatus',
    requiredAnyPermissions: ['VEHICLES:READ']
  },
  'app/payroll': {
    path: 'app/payroll',
    requiredAnyPermissions: ['PAYROLL:READ']
  },
  'app/payroll/admin': {
    path: 'app/payroll/admin',
    requiredAnyPermissions: ['PAYROLL:READ']
  },
  'app/expenses': {
    path: 'app/expenses',
    requiredAnyPermissions: ['EXPENSES:READ']
  },
  'app/loans/manage': {
    path: 'app/loans/manage',
    requiredAnyPermissions: ['LOANS:VIEW', 'LOANS:APPLY']
  },
  'app/reports': {
    path: 'app/reports',
    requiredAnyPermissions: ['FINANCE:VIEW']
  },
  'app/reports/users': {
    path: 'app/reports/users',
    requiredAnyPermissions: ['MEMBERS:READ']
  },
  'app/reports/financials': {
    path: 'app/reports/financials',
    requiredAnyPermissions: ['FINANCE:VIEW']
  },
  'app/reports/fleet': {
    path: 'app/reports/fleet',
    requiredAnyPermissions: ['VEHICLES:READ']
  },
  'app/staff/profile': {
    path: 'app/staff/profile',
    requiredAnyPermissions: ['STAFF:READ', 'MEMBERS:READ_SELF']
  },
  'app/admin/staff-profiles': {
    path: 'app/admin/staff-profiles',
    requiredAnyPermissions: ['ADMIN:RBAC']
  },

  // Vehicle owner routes
  'users/welcome': { path: 'users/welcome', requiredAnyPermissions: ['MEMBERS:READ_SELF'] },
  'users/home': { path: 'users/home', requiredAnyPermissions: ['MEMBERS:READ_SELF'], requiresCapitalPayment: true },
  'users/profile': { path: 'users/profile', requiredAnyPermissions: ['MEMBERS:READ_SELF'], requiresCapitalPayment: true },
  'users/vehicles': { path: 'users/vehicles', requiredAnyPermissions: ['VEHICLES:READ_SELF'], requiresCapitalPayment: true },
  'users/apply-loan': { path: 'users/apply-loan', requiredAnyPermissions: ['LOANS:APPLY'], requiresCapitalPayment: true },
  'users/financial-status': { path: 'users/financial-status', requiredAnyPermissions: ['FINANCE:VIEW_SELF'], requiresCapitalPayment: true },
  'users/addVehicle': { path: 'users/addVehicle', requiredAnyPermissions: ['VEHICLES:WRITE_SELF'], requiresCapitalPayment: true },
  'users/exit': { path: 'users/exit', requiredAnyPermissions: ['MEMBERS:READ_SELF'], requiresCapitalPayment: true },

  // Legacy admin routes
  'admin/dashboard': { path: 'admin/dashboard', requiredAnyPermissions: ['MEMBERS:READ', 'VEHICLES:READ', 'FINANCE:VIEW'] },
  'admin/users': { path: 'admin/users', requiredAnyPermissions: ['MEMBERS:READ'] },
  'admin/users/approve': { path: 'admin/users/approve', requiredAnyPermissions: ['MEMBERS:APPROVE'] },
  'admin/users/roles': { path: 'admin/users/roles', requiredAnyPermissions: ['ADMIN:RBAC'] },
  'admin/users/create': { path: 'admin/users/create', requiredAnyPermissions: ['MEMBERS:CREATE'] },
  'admin/users/profiles': { path: 'admin/users/profiles', requiredAnyPermissions: ['MEMBERS:READ'] },
  'admin/fleet': { path: 'admin/fleet', requiredAnyPermissions: ['VEHICLES:READ'] },
  'admin/financials': { path: 'admin/financials', requiredAnyPermissions: ['FINANCE:VIEW'] },
  'admin/wages': { path: 'admin/wages', requiredAnyPermissions: ['PAYROLL:READ'] },
  'admin/loans': { path: 'admin/loans', requiredAnyPermissions: ['LOANS:VIEW'] },
  'admin/fleet/routes': { path: 'admin/fleet/routes', requiredAnyPermissions: ['VEHICLES:ROUTES_WRITE', 'VEHICLES:READ'] },
  'admin/reports/users': { path: 'admin/reports/users', requiredAnyPermissions: ['MEMBERS:READ'] },
  'admin/reports/financials': { path: 'admin/reports/financials', requiredAnyPermissions: ['FINANCE:VIEW'] },
  'admin/reports/fleet': { path: 'admin/reports/fleet', requiredAnyPermissions: ['VEHICLES:READ'] },
  'admin/staff-profiles': { path: 'admin/staff-profiles', requiredAnyPermissions: ['ADMIN:RBAC'] },

  // Legacy staff routes
  'staff/dashboard': { path: 'staff/dashboard', requiredAnyPermissions: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW'] },
  'staff/update': { path: 'staff/update', requiredAnyPermissions: ['MEMBERS:READ_SELF', 'STAFF:READ'] },
  'staff/salary': { path: 'staff/salary', requiredAnyPermissions: ['PAYROLL:READ'] },
  'staff/treasurer': { path: 'staff/treasurer', requiredAnyPermissions: ['FINANCE:COLLECT', 'FINANCE:VIEW'] },
  'staff/loanmanagement': { path: 'staff/loanmanagement', requiredAnyPermissions: ['LOANS:VIEW', 'LOANS:APPLY'] },
  'staff/expensetracking': { path: 'staff/expensetracking', requiredAnyPermissions: ['EXPENSES:READ'] },
  'staff/matatumanagement': { path: 'staff/matatumanagement', requiredAnyPermissions: ['VEHICLES:READ'] },
  'staff/reports': { path: 'staff/reports', requiredAnyPermissions: ['FINANCE:VIEW'] }
};

export class RouteProtectionService {
  static isAuthorized(user: User | null, routePath: string): {
    authorized: boolean;
    reason?: string;
    redirectTo?: string;
  } {
    const routeConfig = routeConfigs[routePath];

    if (!routeConfig) {
      return {
        authorized: false,
        reason: 'Route not found',
        redirectTo: 'not-found'
      };
    }

    if (routeConfig.isPublic) {
      return { authorized: true };
    }

    if (!user) {
      return {
        authorized: false,
        reason: 'Authentication required',
        redirectTo: 'login'
      };
    }

    if (routeConfig.requiresCapitalPayment && !user.hasCompletedCapitalPayment) {
      return {
        authorized: false,
        reason: 'Capital payment required',
        redirectTo: 'users/welcome'
      };
    }

    const userPermissions = this.getUserPermissions(user);
    const hasAny = anyOf(userPermissions, routeConfig.requiredAnyPermissions);
    const hasAll = allOf(userPermissions, routeConfig.requiredAllPermissions);

    if (!hasAny || !hasAll) {
      return {
        authorized: false,
        reason: 'Insufficient permissions.',
        redirectTo: this.getDefaultRouteForRole(user.role ?? '')
      };
    }

    return { authorized: true };
  }

  private static getUserPermissions(user: User): string[] {
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }
    return [];
  }

  static getDefaultRouteForRole(role: string): string {
    if (!role) return 'home';
    return 'app/vehicles';
  }

  static getAccessibleRoutes(user: User | null): string[] {
    return Object.keys(routeConfigs).filter(routePath =>
      this.isAuthorized(user, routePath).authorized
    );
  }

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

  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;

    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission);
  }

  static hasRole(user: User | null, roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role ?? '');
  }

  static getNavigationItems(user: User | null): Array<{
    label: string;
    route: string;
    icon?: string;
    children?: Array<{ label: string; route: string; }>;
  }> {
    if (!user) return [];
    const permissions = this.getUserPermissions(user);

    return menuRegistry
      .map((section) => {
        const children = section.items
          .filter((item) => canAccessMenuItem(item, permissions))
          .map((item) => ({ label: item.label, route: item.path }));

        if (children.length === 0) {
          return null;
        }

        return {
          label: section.label ?? '',
          route: '',
          children
        };
      })
      .filter(Boolean) as Array<{
        label: string;
        route: string;
        icon?: string;
        children?: Array<{ label: string; route: string; }>;
      }>;
  }
}
