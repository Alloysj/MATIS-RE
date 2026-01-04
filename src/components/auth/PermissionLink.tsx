import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../../context/AccessContext';
import { MenuRule, canAccessRule } from '../../navigation/permissionRules';

type PermissionLinkProps = {
  to: string;
  rule?: MenuRule;
  children: ReactNode;
  className?: string;
  title?: string;
  fallback?: ReactNode;
};

export function PermissionLink({ to, rule, children, className, title, fallback = null }: PermissionLinkProps) {
  const access = useAccess();
  const allowed = canAccessRule(rule, access.permissions);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return (
    <Link to={to} className={className} title={title}>
      {children}
    </Link>
  );
}
