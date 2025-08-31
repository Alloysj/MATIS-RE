import { useState, useEffect } from 'react';
import { RouteProtectionService, User } from '../services/routeProtection';

/**
 * Custom hook for authentication and authorization
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on hook initialization
    const savedUser = localStorage.getItem('matisUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('matisUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Save user to localStorage when user state changes
    if (user) {
      localStorage.setItem('matisUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('matisUser');
    }
  }, [user]);

  const login = (userData: { name: string; role: string; phone: string }) => {
    const newUser: User = { 
      ...userData, 
      role: userData.role as User['role'],
      hasCompletedCapitalPayment: false 
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('matisUser');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      return updatedUser;
    }
    return null;
  };

  const completeCapitalPayment = () => {
    return updateUser({ hasCompletedCapitalPayment: true });
  };

  // Authorization helpers
  const hasPermission = (permission: string): boolean => {
    return RouteProtectionService.hasPermission(user, permission);
  };

  const hasRole = (roles: string | string[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return RouteProtectionService.hasRole(user, roleArray);
  };

  const canAccess = (routePath: string): boolean => {
    return RouteProtectionService.isAuthorized(user, routePath).authorized;
  };

  const getAccessibleRoutes = (): string[] => {
    return RouteProtectionService.getAccessibleRoutes(user);
  };

  const getNavigationItems = () => {
    return RouteProtectionService.getNavigationItems(user);
  };

  const isAuthenticated = (): boolean => {
    return user !== null;
  };

  const isVehicleOwner = (): boolean => {
    return user?.role === 'Vehicle Owner';
  };

  const isAdmin = (): boolean => {
    return user?.role === 'Admin';
  };

  const isStaff = (): boolean => {
    return ['Staff', 'Chairperson', 'Treasurer'].includes(user?.role || '');
  };

  const requiresCapitalPayment = (): boolean => {
    return isVehicleOwner() && !user?.hasCompletedCapitalPayment;
  };

  return {
    // State
    user,
    loading,
    
    // Authentication actions
    login,
    logout,
    updateUser,
    completeCapitalPayment,
    
    // Authorization checks
    hasPermission,
    hasRole,
    canAccess,
    getAccessibleRoutes,
    getNavigationItems,
    
    // Convenience checks
    isAuthenticated,
    isVehicleOwner,
    isAdmin,
    isStaff,
    requiresCapitalPayment,
  };
}

/**
 * Hook for protecting components based on permissions
 */
export function usePermission(permission: string) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook for protecting components based on roles
 */
export function useRole(roles: string | string[]) {
  const { hasRole } = useAuth();
  return hasRole(roles);
}

/**
 * Hook for checking route access
 */
export function useRouteAccess(routePath: string) {
  const { canAccess, user } = useAuth();
  const authResult = RouteProtectionService.isAuthorized(user, routePath);
  
  return {
    canAccess: authResult.authorized,
    reason: authResult.reason,
    redirectTo: authResult.redirectTo
  };
}