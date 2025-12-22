export type ModuleActionPermission = {
  key: string;
  label: string;
  permission: string;
};

export type ModulePermissionDefinition = {
  key: string;
  label: string;
  visibilityPermissions: string[];
  actions: ModuleActionPermission[];
};

export const MODULE_PERMISSIONS: ModulePermissionDefinition[] = [
  {
    key: 'members',
    label: 'Members',
    visibilityPermissions: ['MEMBERS:READ', 'MEMBERS:READ_SELF'],
    actions: [
      { key: 'members-create', label: 'Create members', permission: 'MEMBERS:CREATE' },
      { key: 'members-approve', label: 'Approve members', permission: 'MEMBERS:APPROVE' },
      { key: 'members-update', label: 'Update members', permission: 'MEMBERS:UPDATE' },
      { key: 'members-delete', label: 'Delete members', permission: 'MEMBERS:DELETE' },
      { key: 'members-reset', label: 'Reset passwords', permission: 'MEMBERS:RESET_PASSWORD' }
    ]
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    visibilityPermissions: ['VEHICLES:READ', 'VEHICLES:READ_SELF'],
    actions: [
      { key: 'vehicles-write', label: 'Create or update vehicles', permission: 'VEHICLES:WRITE' },
      { key: 'vehicles-approve', label: 'Approve vehicles', permission: 'VEHICLES:APPROVE' },
      { key: 'vehicles-assign', label: 'Assign driver', permission: 'VEHICLES:ASSIGN_DRIVER' },
      { key: 'vehicles-routes', label: 'Manage routes', permission: 'VEHICLES:ROUTES_WRITE' }
    ]
  },
  {
    key: 'remittances',
    label: 'Remittances',
    visibilityPermissions: ['FINANCE:COLLECT', 'FINANCE:VIEW'],
    actions: [
      { key: 'finance-collect', label: 'Collect remittances', permission: 'FINANCE:COLLECT' },
      { key: 'finance-view', label: 'View remittances', permission: 'FINANCE:VIEW' }
    ]
  },
  {
    key: 'insurance',
    label: 'Insurance',
    visibilityPermissions: ['INSURANCE:VIEW', 'INSURANCE:WRITE'],
    actions: [
      { key: 'insurance-view', label: 'View insurance', permission: 'INSURANCE:VIEW' },
      { key: 'insurance-write', label: 'Record insurance payments', permission: 'INSURANCE:WRITE' }
    ]
  },
  {
    key: 'loans',
    label: 'Loans',
    visibilityPermissions: ['LOANS:VIEW', 'LOANS:APPLY'],
    actions: [
      { key: 'loans-apply', label: 'Apply for loans', permission: 'LOANS:APPLY' },
      { key: 'loans-view', label: 'View loans', permission: 'LOANS:VIEW' },
      { key: 'loans-approve', label: 'Approve loans', permission: 'LOANS:APPROVE' }
    ]
  },
  {
    key: 'support',
    label: 'Support',
    visibilityPermissions: ['SUPPORT:TICKET_CREATE'],
    actions: [
      { key: 'support-ticket', label: 'Create support tickets', permission: 'SUPPORT:TICKET_CREATE' }
    ]
  }
];
