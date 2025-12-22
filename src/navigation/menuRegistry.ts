import { LucideIcon, Users, Car, DollarSign, Shield, CreditCard } from 'lucide-react';

export type MenuRule = {
  anyOf: string[];
  allOf?: string[];
};

export type MenuItem = {
  key: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  requiredPermissions: MenuRule;
};

export type MenuSection = {
  key: string;
  label?: string;
  items: MenuItem[];
};

export const canAccessMenuItem = (item: MenuItem, permissions: string[]): boolean => {
  const anyOf = item.requiredPermissions?.anyOf ?? [];
  const allOf = item.requiredPermissions?.allOf ?? [];
  const hasAny = anyOf.length === 0 || anyOf.some((permission) => permissions.includes(permission));
  const hasAll = allOf.length === 0 || allOf.every((permission) => permissions.includes(permission));
  return hasAny && hasAll;
};

export const getVisibleMenuSections = (permissions: string[]): MenuSection[] =>
  menuRegistry
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessMenuItem(item, permissions))
    }))
    .filter((section) => section.items.length > 0);

export const getFirstAccessiblePath = (permissions: string[]): string | null => {
  for (const section of menuRegistry) {
    for (const item of section.items) {
      if (canAccessMenuItem(item, permissions)) {
        return item.path;
      }
    }
  }
  return null;
};

export const menuRegistry: MenuSection[] = [
  {
    key: 'modules',
    label: 'Modules',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: 'app/dashboard',
        icon: Users,
        requiredPermissions: {
          anyOf: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW']
        }
      },
      {
        key: 'members',
        label: 'Members',
        path: 'app/members',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:READ', 'MEMBERS:READ_SELF', 'MEMBERS:CREATE', 'MEMBERS:APPROVE']
        }
      },
      {
        key: 'vehicles',
        label: 'Vehicles',
        path: 'app/vehicles',
        icon: Car,
        requiredPermissions: {
          anyOf: ['VEHICLES:READ', 'VEHICLES:READ_SELF']
        }
      },
      {
        key: 'remittances',
        label: 'Remittances',
        path: 'app/remittances',
        icon: DollarSign,
        requiredPermissions: {
          anyOf: ['FINANCE:COLLECT', 'FINANCE:VIEW']
        }
      },
      {
        key: 'insurance',
        label: 'Insurance',
        path: 'app/insurance',
        icon: Shield,
        requiredPermissions: {
          anyOf: ['INSURANCE:VIEW', 'INSURANCE:WRITE']
        }
      },
      {
        key: 'loans',
        label: 'Loans',
        path: 'app/loans',
        icon: CreditCard,
        requiredPermissions: {
          anyOf: ['LOANS:VIEW', 'LOANS:APPLY', 'LOANS:APPROVE']
        }
      }
    ]
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      {
        key: 'payroll',
        label: 'Payroll',
        path: 'app/payroll',
        icon: DollarSign,
        requiredPermissions: {
          anyOf: ['PAYROLL:READ']
        }
      },
      {
        key: 'expenses',
        label: 'Expenses',
        path: 'app/expenses',
        icon: Shield,
        requiredPermissions: {
          anyOf: ['EXPENSES:READ']
        }
      },
      {
        key: 'reports',
        label: 'Reports',
        path: 'app/reports',
        icon: Shield,
        requiredPermissions: {
          anyOf: ['FINANCE:VIEW', 'MEMBERS:READ', 'VEHICLES:READ']
        }
      }
    ]
  },
  {
    key: 'account',
    label: 'Account',
    items: [
      {
        key: 'staff-profile',
        label: 'My Profile',
        path: 'app/staff/profile',
        icon: Users,
        requiredPermissions: {
          anyOf: ['STAFF:READ', 'MEMBERS:READ_SELF']
        }
      }
    ]
  },
  {
    key: 'admin-tools',
    label: 'Admin',
    items: [
      {
        key: 'admin-dashboard',
        label: 'Admin Dashboard',
        path: 'app/admin/dashboard',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:READ', 'VEHICLES:READ', 'FINANCE:VIEW']
        }
      },
      {
        key: 'member-approvals',
        label: 'Member Approvals',
        path: 'app/members/approve',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:APPROVE']
        }
      },
      {
        key: 'role-management',
        label: 'Role Management',
        path: 'app/members/roles',
        icon: Shield,
        requiredPermissions: {
          anyOf: ['ADMIN:RBAC']
        }
      },
      {
        key: 'member-create',
        label: 'Create Member',
        path: 'app/members/create',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:CREATE']
        }
      },
      {
        key: 'member-profiles',
        label: 'Member Profiles',
        path: 'app/members/profiles',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:READ']
        }
      },
      {
        key: 'route-management',
        label: 'Route Management',
        path: 'app/vehicles/routes',
        icon: Car,
        requiredPermissions: {
          anyOf: ['VEHICLES:ROUTES_WRITE', 'VEHICLES:READ']
        }
      },
      {
        key: 'payroll-admin',
        label: 'Payroll Admin',
        path: 'app/payroll/admin',
        icon: DollarSign,
        requiredPermissions: {
          anyOf: ['PAYROLL:READ']
        }
      },
      {
        key: 'reports-users',
        label: 'User Reports',
        path: 'app/reports/users',
        icon: Users,
        requiredPermissions: {
          anyOf: ['MEMBERS:READ']
        }
      },
      {
        key: 'reports-financials',
        label: 'Financial Reports',
        path: 'app/reports/financials',
        icon: DollarSign,
        requiredPermissions: {
          anyOf: ['FINANCE:VIEW']
        }
      },
      {
        key: 'reports-fleet',
        label: 'Fleet Reports',
        path: 'app/reports/fleet',
        icon: Car,
        requiredPermissions: {
          anyOf: ['VEHICLES:READ']
        }
      },
      {
        key: 'staff-profiles',
        label: 'Staff Profiles',
        path: 'app/admin/staff-profiles',
        icon: Users,
        requiredPermissions: {
          anyOf: ['ADMIN:RBAC']
        }
      }
    ]
  }
];
