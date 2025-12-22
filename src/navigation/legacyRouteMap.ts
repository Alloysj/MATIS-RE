export type LegacyRouteMapping = {
  legacyPath: string;
  appPath: string;
  module: string;
  requiredPermissions: string[];
  component: string;
};

export const legacyRouteMap: LegacyRouteMapping[] = [
  {
    legacyPath: 'admin/dashboard',
    appPath: 'app/admin/dashboard',
    module: 'Admin',
    requiredPermissions: ['MEMBERS:READ', 'VEHICLES:READ', 'FINANCE:VIEW'],
    component: 'AdminDashboard'
  },
  {
    legacyPath: 'admin/users',
    appPath: 'app/members',
    module: 'Members',
    requiredPermissions: ['MEMBERS:READ'],
    component: 'UsersManagement'
  },
  {
    legacyPath: 'admin/users/approve',
    appPath: 'app/members/approve',
    module: 'Members',
    requiredPermissions: ['MEMBERS:APPROVE'],
    component: 'ApproveUsers'
  },
  {
    legacyPath: 'admin/users/roles',
    appPath: 'app/members/roles',
    module: 'Members',
    requiredPermissions: ['ADMIN:RBAC'],
    component: 'UserRoles'
  },
  {
    legacyPath: 'admin/users/create',
    appPath: 'app/members/create',
    module: 'Members',
    requiredPermissions: ['MEMBERS:CREATE'],
    component: 'CreateUser'
  },
  {
    legacyPath: 'admin/users/profiles',
    appPath: 'app/members/profiles',
    module: 'Members',
    requiredPermissions: ['MEMBERS:READ'],
    component: 'UserProfiles'
  },
  {
    legacyPath: 'admin/users/user_profile/:userId',
    appPath: 'app/members/profiles/:userId',
    module: 'Members',
    requiredPermissions: ['MEMBERS:READ'],
    component: 'UserProfiles'
  },
  {
    legacyPath: 'admin/fleet',
    appPath: 'app/vehicles',
    module: 'Vehicles',
    requiredPermissions: ['VEHICLES:READ'],
    component: 'FleetManagement'
  },
  {
    legacyPath: 'admin/fleet/:vehicleId',
    appPath: 'app/vehicles/:vehicleId',
    module: 'Vehicles',
    requiredPermissions: ['VEHICLES:READ'],
    component: 'ViewVehicle'
  },
  {
    legacyPath: 'admin/fleet/routes',
    appPath: 'app/vehicles/routes',
    module: 'Vehicles',
    requiredPermissions: ['VEHICLES:ROUTES_WRITE', 'VEHICLES:READ'],
    component: 'RouteManagement'
  },
  {
    legacyPath: 'admin/financials',
    appPath: 'app/insurance',
    module: 'Insurance',
    requiredPermissions: ['FINANCE:VIEW'],
    component: 'FinancialOverview'
  },
  {
    legacyPath: 'admin/wages',
    appPath: 'app/payroll/admin',
    module: 'Payroll',
    requiredPermissions: ['PAYROLL:READ'],
    component: 'WageManagement'
  },
  {
    legacyPath: 'admin/loans',
    appPath: 'app/loans',
    module: 'Loans',
    requiredPermissions: ['LOANS:VIEW'],
    component: 'LoanApplications'
  },
  {
    legacyPath: 'admin/reports/users',
    appPath: 'app/reports/users',
    module: 'Reports',
    requiredPermissions: ['MEMBERS:READ'],
    component: 'UserReports'
  },
  {
    legacyPath: 'admin/reports/financials',
    appPath: 'app/reports/financials',
    module: 'Reports',
    requiredPermissions: ['FINANCE:VIEW'],
    component: 'FinancialReports'
  },
  {
    legacyPath: 'admin/reports/fleet',
    appPath: 'app/reports/fleet',
    module: 'Reports',
    requiredPermissions: ['VEHICLES:READ'],
    component: 'FleetReports'
  },
  {
    legacyPath: 'admin/staff-profiles',
    appPath: 'app/admin/staff-profiles',
    module: 'Admin',
    requiredPermissions: ['ADMIN:RBAC'],
    component: 'StaffProfiles'
  },
  {
    legacyPath: 'staff/dashboard',
    appPath: 'app/dashboard',
    module: 'Dashboard',
    requiredPermissions: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW'],
    component: 'StaffDashboard'
  },
  {
    legacyPath: 'staff/update',
    appPath: 'app/staff/profile',
    module: 'Profile',
    requiredPermissions: ['STAFF:READ', 'MEMBERS:READ_SELF'],
    component: 'UpdateDetails'
  },
  {
    legacyPath: 'staff/salary',
    appPath: 'app/payroll',
    module: 'Payroll',
    requiredPermissions: ['PAYROLL:READ'],
    component: 'SalaryManagement'
  },
  {
    legacyPath: 'staff/treasurer',
    appPath: 'app/remittances',
    module: 'Remittances',
    requiredPermissions: ['FINANCE:COLLECT', 'FINANCE:VIEW'],
    component: 'TreasurerDashboard'
  },
  {
    legacyPath: 'staff/loanmanagement',
    appPath: 'app/loans/manage',
    module: 'Loans',
    requiredPermissions: ['LOANS:VIEW', 'LOANS:APPLY'],
    component: 'LoanManagement'
  },
  {
    legacyPath: 'staff/expensetracking',
    appPath: 'app/expenses',
    module: 'Expenses',
    requiredPermissions: ['EXPENSES:READ'],
    component: 'ExpenseTracking'
  },
  {
    legacyPath: 'staff/matatumanagement',
    appPath: 'app/vehicles/matatus',
    module: 'Vehicles',
    requiredPermissions: ['VEHICLES:READ'],
    component: 'MatatuManagement'
  },
  {
    legacyPath: 'staff/reports',
    appPath: 'app/reports',
    module: 'Reports',
    requiredPermissions: ['FINANCE:VIEW'],
    component: 'Reports'
  }
];
