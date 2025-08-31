export interface User {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  role: 'Vehicle Owner' | 'Admin' | 'Staff' | 'Chairperson' | 'Treasurer';
  status: 'Active' | 'Pending' | 'Suspended' | 'Inactive';
  registrationDate: string;
  lastLogin: string;
  profileCategory: 'Individual' | 'Corporate' | 'Cooperative';
  
  // Financial Information
  shareCapital: number;
  savingsBalance: number;
  loanBalance: number;
  totalDeposits: number;
  
  // Personal Details
  address: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  occupation: string;
  dateOfBirth: string;
  
  // Vehicle Information (for Vehicle Owners)
  vehicles?: {
    id: string;
    plateNumber: string;
    model: string;
    year: number;
    route: string;
    status: 'Active' | 'Maintenance' | 'Inactive';
  }[];
  
  // System Information
  permissions: string[];
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  modifiedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'User Management' | 'Fleet Management' | 'Financial' | 'Reports' | 'System';
}

// Mock data
export const mockUsers: User[] = [
  {
    id: '1',
    memberNumber: 'MATIS001',
    name: 'John Kamau',
    phone: '+254712345678',
    email: 'john.kamau@example.com',
    idNumber: '12345678',
    role: 'Vehicle Owner',
    status: 'Active',
    registrationDate: '2023-01-15',
    lastLogin: '2024-08-30',
    profileCategory: 'Individual',
    shareCapital: 50000,
    savingsBalance: 120000,
    loanBalance: 80000,
    totalDeposits: 450000,
    address: 'Nairobi, Westlands',
    nextOfKin: 'Mary Kamau',
    nextOfKinPhone: '+254712345679',
    occupation: 'Matatu Owner',
    dateOfBirth: '1985-03-20',
    vehicles: [
      {
        id: 'v1',
        plateNumber: 'KCA 123A',
        model: 'Toyota Hiace',
        year: 2019,
        route: 'Nairobi-Thika',
        status: 'Active'
      }
    ],
    permissions: ['view_own_profile', 'manage_own_vehicles', 'apply_loans'],
    createdBy: 'admin',
    modifiedBy: 'admin',
    createdAt: '2023-01-15',
    modifiedAt: '2023-01-15'
  },
  {
    id: '2',
    memberNumber: 'MATIS002',
    name: 'Grace Wanjiku',
    phone: '+254723456789',
    email: 'grace.wanjiku@example.com',
    idNumber: '23456789',
    role: 'Vehicle Owner',
    status: 'Pending',
    registrationDate: '2024-08-25',
    lastLogin: 'Never',
    profileCategory: 'Individual',
    shareCapital: 0,
    savingsBalance: 0,
    loanBalance: 0,
    totalDeposits: 0,
    address: 'Kiambu, Ruiru',
    nextOfKin: 'Peter Wanjiku',
    nextOfKinPhone: '+254723456790',
    occupation: 'Transport Operator',
    dateOfBirth: '1990-07-12',
    vehicles: [
      {
        id: 'v2',
        plateNumber: 'KCB 456B',
        model: 'Nissan Matatu',
        year: 2020,
        route: 'Nairobi-Kiambu',
        status: 'Inactive'
      }
    ],
    permissions: [],
    createdBy: 'system',
    modifiedBy: 'system',
    createdAt: '2024-08-25',
    modifiedAt: '2024-08-25'
  },
  {
    id: '3',
    memberNumber: 'MATIS003',
    name: 'Samuel Ochieng',
    phone: '+254734567890',
    email: 'samuel.ochieng@matis.co.ke',
    idNumber: '34567890',
    role: 'Staff',
    status: 'Active',
    registrationDate: '2022-06-10',
    lastLogin: '2024-08-31',
    profileCategory: 'Individual',
    shareCapital: 25000,
    savingsBalance: 85000,
    loanBalance: 0,
    totalDeposits: 250000,
    address: 'Nairobi, Kasarani',
    nextOfKin: 'Jane Ochieng',
    nextOfKinPhone: '+254734567891',
    occupation: 'SACCO Officer',
    dateOfBirth: '1988-11-05',
    permissions: ['manage_loans', 'view_reports', 'manage_members', 'manage_fleet'],
    createdBy: 'admin',
    modifiedBy: 'admin',
    createdAt: '2022-06-10',
    modifiedAt: '2024-01-15'
  },
  {
    id: '4',
    memberNumber: 'MATIS004',
    name: 'Alice Muthoni',
    phone: '+254745678901',
    email: 'alice.muthoni@matis.co.ke',
    idNumber: '45678901',
    role: 'Admin',
    status: 'Active',
    registrationDate: '2021-03-01',
    lastLogin: '2024-08-31',
    profileCategory: 'Individual',
    shareCapital: 100000,
    savingsBalance: 200000,
    loanBalance: 0,
    totalDeposits: 800000,
    address: 'Nairobi, Karen',
    nextOfKin: 'David Muthoni',
    nextOfKinPhone: '+254745678902',
    occupation: 'System Administrator',
    dateOfBirth: '1982-09-18',
    permissions: ['full_access'],
    createdBy: 'system',
    modifiedBy: 'admin',
    createdAt: '2021-03-01',
    modifiedAt: '2024-01-10'
  },
  {
    id: '5',
    memberNumber: 'MATIS005',
    name: 'Robert Kiprop',
    phone: '+254756789012',
    email: 'robert.kiprop@example.com',
    idNumber: '56789012',
    role: 'Vehicle Owner',
    status: 'Suspended',
    registrationDate: '2023-08-20',
    lastLogin: '2024-07-15',
    profileCategory: 'Individual',
    shareCapital: 40000,
    savingsBalance: 15000,
    loanBalance: 150000,
    totalDeposits: 200000,
    address: 'Eldoret, Langas',
    nextOfKin: 'Susan Kiprop',
    nextOfKinPhone: '+254756789013',
    occupation: 'Matatu Operator',
    dateOfBirth: '1987-12-03',
    vehicles: [
      {
        id: 'v3',
        plateNumber: 'KCC 789C',
        model: 'Isuzu Forward',
        year: 2018,
        route: 'Eldoret-Kitale',
        status: 'Maintenance'
      }
    ],
    permissions: ['view_own_profile'],
    createdBy: 'admin',
    modifiedBy: 'admin',
    createdAt: '2023-08-20',
    modifiedAt: '2024-07-15'
  }
];

export const mockRoles: UserRole[] = [
  {
    id: '1',
    name: 'Vehicle Owner',
    description: 'SACCO members who own vehicles registered with the SACCO',
    permissions: ['view_own_profile', 'manage_own_vehicles', 'apply_loans', 'view_own_financials'],
    userCount: 250,
    createdAt: '2021-01-01'
  },
  {
    id: '2',
    name: 'Admin',
    description: 'System administrators with full access to all SACCO operations',
    permissions: ['full_access'],
    userCount: 3,
    createdAt: '2021-01-01'
  },
  {
    id: '3',
    name: 'Staff',
    description: 'SACCO employees who manage day-to-day operations',
    permissions: ['manage_loans', 'view_reports', 'manage_members', 'manage_fleet', 'manage_expenses'],
    userCount: 12,
    createdAt: '2021-01-01'
  },
  {
    id: '4',
    name: 'Chairperson',
    description: 'SACCO board chairperson with oversight responsibilities',
    permissions: ['view_all_reports', 'approve_major_decisions', 'manage_board_matters'],
    userCount: 1,
    createdAt: '2021-01-01'
  },
  {
    id: '5',
    name: 'Treasurer',
    description: 'SACCO treasurer responsible for financial oversight',
    permissions: ['manage_financials', 'approve_transactions', 'view_all_reports'],
    userCount: 1,
    createdAt: '2021-01-01'
  }
];

export const mockPermissions: Permission[] = [
  // User Management
  { id: '1', name: 'view_own_profile', description: 'View own profile information', category: 'User Management' },
  { id: '2', name: 'manage_members', description: 'Create, edit, and manage member accounts', category: 'User Management' },
  { id: '3', name: 'approve_members', description: 'Approve new member registrations', category: 'User Management' },
  { id: '4', name: 'manage_roles', description: 'Create and manage user roles and permissions', category: 'User Management' },
  
  // Fleet Management
  { id: '5', name: 'manage_own_vehicles', description: 'Manage own registered vehicles', category: 'Fleet Management' },
  { id: '6', name: 'manage_fleet', description: 'Manage all SACCO vehicles and assignments', category: 'Fleet Management' },
  { id: '7', name: 'manage_routes', description: 'Manage vehicle routes and schedules', category: 'Fleet Management' },
  
  // Financial
  { id: '8', name: 'view_own_financials', description: 'View own financial information', category: 'Financial' },
  { id: '9', name: 'manage_financials', description: 'Manage SACCO finances and accounts', category: 'Financial' },
  { id: '10', name: 'apply_loans', description: 'Apply for loans and advances', category: 'Financial' },
  { id: '11', name: 'manage_loans', description: 'Process and manage loan applications', category: 'Financial' },
  { id: '12', name: 'approve_transactions', description: 'Approve financial transactions', category: 'Financial' },
  { id: '13', name: 'manage_expenses', description: 'Track and manage SACCO expenses', category: 'Financial' },
  
  // Reports
  { id: '14', name: 'view_reports', description: 'View standard operational reports', category: 'Reports' },
  { id: '15', name: 'view_all_reports', description: 'View all system reports including sensitive data', category: 'Reports' },
  
  // System
  { id: '16', name: 'full_access', description: 'Complete system access with all permissions', category: 'System' },
  { id: '17', name: 'manage_board_matters', description: 'Manage board meetings and decisions', category: 'System' },
  { id: '18', name: 'approve_major_decisions', description: 'Approve major SACCO decisions', category: 'System' }
];

// Data management functions
export class UserDataService {
  private static users: User[] = [...mockUsers];
  private static roles: UserRole[] = [...mockRoles];
  private static permissions: Permission[] = [...mockPermissions];

  // Users
  static getAllUsers(): User[] {
    return this.users;
  }

  static getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  static createUser(userData: Omit<User, 'id' | 'memberNumber' | 'createdAt' | 'modifiedAt'>): User {
    const newUser: User = {
      ...userData,
      id: (this.users.length + 1).toString(),
      memberNumber: `MATIS${String(this.users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      modifiedAt: new Date().toISOString().split('T')[0]
    };
    this.users.push(newUser);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      modifiedAt: new Date().toISOString().split('T')[0]
    };
    return this.users[userIndex];
  }

  static deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    return true;
  }

  static getUsersByStatus(status: User['status']): User[] {
    return this.users.filter(user => user.status === status);
  }

  static getUsersByRole(role: User['role']): User[] {
    return this.users.filter(user => user.role === role);
  }

  static approveUser(id: string): User | null {
    return this.updateUser(id, { status: 'Active' });
  }

  static suspendUser(id: string): User | null {
    return this.updateUser(id, { status: 'Suspended' });
  }

  // Roles
  static getAllRoles(): UserRole[] {
    return this.roles;
  }

  static getRoleById(id: string): UserRole | undefined {
    return this.roles.find(role => role.id === id);
  }

  static createRole(roleData: Omit<UserRole, 'id' | 'userCount' | 'createdAt'>): UserRole {
    const newRole: UserRole = {
      ...roleData,
      id: (this.roles.length + 1).toString(),
      userCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.roles.push(newRole);
    return newRole;
  }

  static updateRole(id: string, updates: Partial<UserRole>): UserRole | null {
    const roleIndex = this.roles.findIndex(role => role.id === id);
    if (roleIndex === -1) return null;
    
    this.roles[roleIndex] = { ...this.roles[roleIndex], ...updates };
    return this.roles[roleIndex];
  }

  static deleteRole(id: string): boolean {
    const roleIndex = this.roles.findIndex(role => role.id === id);
    if (roleIndex === -1) return false;
    
    this.roles.splice(roleIndex, 1);
    return true;
  }

  // Permissions
  static getAllPermissions(): Permission[] {
    return this.permissions;
  }

  static getPermissionsByCategory(category: Permission['category']): Permission[] {
    return this.permissions.filter(permission => permission.category === category);
  }
}