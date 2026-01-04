import { ReactNode } from 'react';
import { Button, ButtonProps } from '../ui/button';
import { useAccess } from '../../context/AccessContext';
import { MenuRule, canAccessRule } from '../../navigation/permissionRules';

type PermissionButtonProps = ButtonProps & {
  rule?: MenuRule;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionButton({ rule, children, fallback = null, ...buttonProps }: PermissionButtonProps) {
  const access = useAccess();
  const allowed = canAccessRule(rule, access.permissions);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <Button {...buttonProps}>{children}</Button>;
}
