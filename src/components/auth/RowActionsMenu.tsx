import { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAccess } from '../../context/AccessContext';
import { MenuRule, canAccessRule } from '../../navigation/permissionRules';

type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  requiredPermissions?: MenuRule;
  disabled?: boolean;
};

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const access = useAccess();
  const visibleActions = actions.filter((action) => canAccessRule(action.requiredPermissions, access.permissions));

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleActions.map((action) => (
          <DropdownMenuItem key={action.key} onClick={action.onClick} disabled={action.disabled}>
            {action.icon ? <span className="mr-2">{action.icon}</span> : null}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
