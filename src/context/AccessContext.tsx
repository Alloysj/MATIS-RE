import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthToken } from '../services/api';

type AccessState = {
  isAuthenticated: boolean;
  userType: string | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
};

type AccessContextValue = AccessState & {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

const AccessContext = createContext<AccessContextValue | null>(null);

const decodePayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  try {
    const decoded = atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const parseAccess = (token: string | null): Omit<AccessState, 'loading'> => {
  if (!token) {
    return { isAuthenticated: false, userType: null, roles: [], permissions: [] };
  }
  const payload = decodePayload(token);
  if (!payload) {
    return { isAuthenticated: false, userType: null, roles: [], permissions: [] };
  }
  const roles = Array.isArray(payload.roles) ? payload.roles.filter(Boolean).map(String) : [];
  const permissions = Array.isArray(payload.permissions) ? payload.permissions.filter(Boolean).map(String) : [];
  const userType = payload.userType ? String(payload.userType) : null;
  return {
    isAuthenticated: true,
    userType,
    roles,
    permissions
  };
};

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessState>(() => ({
    ...parseAccess(getAuthToken()),
    loading: true
  }));

  const refresh = useCallback(() => {
    const next = parseAccess(getAuthToken());
    setState({ ...next, loading: false });
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('matis:auth', handler);
    return () => window.removeEventListener('matis:auth', handler);
  }, [refresh]);

  const hasPermission = useCallback(
    (permission: string) => state.permissions.includes(permission),
    [state.permissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((permission) => state.permissions.includes(permission)),
    [state.permissions]
  );

  const value = useMemo(
    () => ({
      ...state,
      hasPermission,
      hasAnyPermission
    }),
    [state, hasPermission, hasAnyPermission]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error('useAccess must be used within AccessProvider');
  }
  return ctx;
}

export function usePermission(permission: string) {
  const { hasPermission } = useAccess();
  return hasPermission(permission);
}

export function useAnyPermission(permissions: string[]) {
  const { hasAnyPermission } = useAccess();
  return hasAnyPermission(permissions);
}
