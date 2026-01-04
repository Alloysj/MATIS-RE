import {
  LucideIcon,
  Users,
  Car,
  DollarSign,
  Shield,
  CreditCard,
  FileText,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { MODULE_PERMISSIONS } from './modulePermissions';
import { MenuRule, canAccessRule } from './permissionRules';

export type MenuNode = {
  key: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  requiredPermissions?: MenuRule;
  children?: MenuNode[];
};

export type MenuSection = {
  key: string;
  label?: string;
  nodes: MenuNode[];
};

const moduleRule = (key: string): MenuRule => {
  const module = MODULE_PERMISSIONS.find((entry) => entry.key === key);
  return { anyOf: module?.visibilityPermissions ?? [] };
};

const filterNode = (node: MenuNode, permissions: string[]): MenuNode | null => {
  if (node.children && node.children.length > 0) {
    const filteredChildren = node.children
      .map((child) => filterNode(child, permissions))
      .filter(Boolean) as MenuNode[];
    const passesRule = canAccessRule(node.requiredPermissions, permissions);
    if (!passesRule || filteredChildren.length === 0) {
      return null;
    }
    return { ...node, children: filteredChildren };
  }

  if (!node.path) {
    return null;
  }

  return canAccessRule(node.requiredPermissions, permissions) ? node : null;
};

export const getVisibleMenuSections = (permissions: string[]): MenuSection[] =>
  menuRegistry
    .map((section) => ({
      ...section,
      nodes: section.nodes
        .map((node) => filterNode(node, permissions))
        .filter(Boolean) as MenuNode[]
    }))
    .filter((section) => section.nodes.length > 0);

export const getFirstAccessiblePath = (permissions: string[]): string | null => {
  const sections = getVisibleMenuSections(permissions);
  for (const section of sections) {
    for (const node of section.nodes) {
      const stack: MenuNode[] = [node];
      while (stack.length > 0) {
        const current = stack.shift();
        if (!current) break;
        if (current.path) {
          return current.path;
        }
        if (current.children?.length) {
          stack.unshift(...current.children);
        }
      }
    }
  }
  return null;
};

export const flattenMenuNodes = (nodes: MenuNode[]): MenuNode[] => {
  const result: MenuNode[] = [];
  nodes.forEach((node) => {
    if (node.path) {
      result.push(node);
      return;
    }
    if (node.children?.length) {
      result.push(...flattenMenuNodes(node.children));
    }
  });
  return result;
};

export const menuRegistry: MenuSection[] = [
  {
    key: 'modules',
    label: 'Modules',
    nodes: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/app/dashboard',
        icon: LayoutDashboard,
        requiredPermissions: {
          anyOf: [
            'FINANCE:VIEW',
            'VEHICLES:READ',
            'LOANS:VIEW',
            'MEMBERS:READ'
          ]
        }
      },
      {
        key: 'members-group',
        label: 'Members',
        icon: Users,
        requiredPermissions: moduleRule('members'),
        children: [
          {
            key: 'members',
            label: 'Members List',
            path: '/app/members',
            icon: Users,
            requiredPermissions: moduleRule('members')
          },
          {
            key: 'member-approvals',
            label: 'Approvals',
            path: '/app/members/approve',
            icon: Users,
            requiredPermissions: { anyOf: ['MEMBERS:APPROVE'] }
          },
          {
            key: 'member-create',
            label: 'Create Member',
            path: '/app/members/create',
            icon: Users,
            requiredPermissions: { anyOf: ['MEMBERS:CREATE'] }
          },
          {
            key: 'member-profiles',
            label: 'Profiles',
            path: '/app/members/profiles',
            icon: Users,
            requiredPermissions: { anyOf: ['MEMBERS:READ'] }
          },
        ]
      },
      {
        key: 'fleet-group',
        label: 'Fleet',
        icon: Car,
        requiredPermissions: moduleRule('vehicles'),
        children: [
          {
            key: 'vehicles',
            label: 'Vehicles',
            path: '/app/vehicles',
            icon: Car,
            requiredPermissions: moduleRule('vehicles')
          },
          {
            key: 'routes',
            label: 'Route Management',
            path: '/app/vehicles/routes',
            icon: Car,
            requiredPermissions: { anyOf: ['VEHICLES:ROUTES_WRITE'] }
          },
          {
            key: 'matatus',
            label: 'Matatu Management',
            path: '/app/vehicles/matatus',
            icon: Car,
            requiredPermissions: { anyOf: ['VEHICLES:READ'] }
          }
        ]
      },
      {
        key: 'finance-group',
        label: 'Finance',
        icon: DollarSign,
        requiredPermissions: { anyOf: ['FINANCE:COLLECT', 'FINANCE:VIEW', 'INSURANCE:VIEW', 'INSURANCE:WRITE', 'PAYROLL:READ', 'EXPENSES:READ'] },
        children: [
          {
            key: 'remittances',
            label: 'Remittances',
            path: '/app/remittances',
            icon: DollarSign,
            requiredPermissions: moduleRule('remittances')
          },
          {
            key: 'insurance',
            label: 'Insurance',
            path: '/app/insurance',
            icon: Shield,
            requiredPermissions: moduleRule('insurance')
          },
          {
            key: 'payroll',
            label: 'Payroll',
            path: '/app/payroll',
            icon: DollarSign,
            requiredPermissions: { anyOf: ['PAYROLL:READ'] }
          },
          {
            key: 'payroll-admin',
            label: 'Payroll Admin',
            path: '/app/payroll/admin',
            icon: DollarSign,
            requiredPermissions: { anyOf: ['PAYROLL:READ'] }
          },
          {
            key: 'expenses',
            label: 'Expenses',
            path: '/app/expenses',
            icon: Shield,
            requiredPermissions: { anyOf: ['EXPENSES:READ'] }
          }
        ]
      },
      {
        key: 'loans-group',
        label: 'Loans',
        icon: CreditCard,
        requiredPermissions: moduleRule('loans'),
        children: [
          {
            key: 'loans',
            label: 'Loans',
            path: '/app/loans',
            icon: CreditCard,
            requiredPermissions: moduleRule('loans')
          },
          {
            key: 'loans-manage',
            label: 'Loan Management',
            path: '/app/loans/manage',
            icon: CreditCard,
            requiredPermissions: { anyOf: ['LOANS:VIEW', 'LOANS:APPLY', 'LOANS:APPROVE'] }
          }
        ]
      }
    ]
  },
  {
    key: 'reports',
    label: 'Reports',
    nodes: [
      {
        key: 'reports-group',
        label: 'Reports',
        icon: FileText,
        requiredPermissions: { anyOf: ['FINANCE:VIEW', 'MEMBERS:READ', 'VEHICLES:READ'] },
        children: [
          {
            key: 'reports',
            label: 'Overview',
            path: '/app/reports',
            icon: FileText,
            requiredPermissions: { anyOf: ['FINANCE:VIEW'] }
          },
          {
            key: 'reports-users',
            label: 'User Reports',
            path: '/app/reports/users',
            icon: Users,
            requiredPermissions: { anyOf: ['MEMBERS:READ'] }
          },
          {
            key: 'reports-financials',
            label: 'Financial Reports',
            path: '/app/reports/financials',
            icon: DollarSign,
            requiredPermissions: { anyOf: ['FINANCE:VIEW'] }
          },
          {
            key: 'reports-fleet',
            label: 'Fleet Reports',
            path: '/app/reports/fleet',
            icon: Car,
            requiredPermissions: { anyOf: ['VEHICLES:READ'] }
          }
        ]
      }
    ]
  },
  {
    key: 'account',
    label: 'Account',
    nodes: [
      {
        key: 'staff-profile',
        label: 'My Profile',
        path: '/app/staff/profile',
        icon: Users,
        requiredPermissions: { anyOf: ['STAFF:READ', 'MEMBERS:READ_SELF'] }
      }
    ]
  },
  {
    key: 'admin-tools',
    label: 'Admin',
    nodes: [
      {
        key: 'admin-dashboard',
        label: 'Admin Dashboard',
        path: '/app/admin/dashboard',
        icon: Users,
        requiredPermissions: { anyOf: ['MEMBERS:READ', 'VEHICLES:READ', 'FINANCE:VIEW'] }
      },
      {
        key: 'staff-profiles',
        label: 'Staff Profiles',
        path: '/app/admin/staff-profiles',
        icon: Settings,
        requiredPermissions: { anyOf: ['ADMIN:RBAC'] }
      },
      {
        key: 'role-management',
        label: 'Role Management',
        path: '/app/members/roles',
        icon: Settings,
        requiredPermissions: { anyOf: ['ADMIN:RBAC'] }
      }
    ]
  }
];
