import { ReactNode } from 'react';
import { useAccess } from '../../context/AccessContext';

type CanProps = {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ permission, anyOf, children, fallback = null }: CanProps) {
  const { hasPermission, hasAnyPermission } = useAccess();
  const allowed = permission
    ? hasPermission(permission)
    : anyOf
      ? hasAnyPermission(anyOf)
      : false;

  return <>{allowed ? children : fallback}</>;
}
