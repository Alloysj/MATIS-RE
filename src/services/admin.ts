import { API_BASE, authHeaders } from './api';

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const ADMIN_BASE = '/api/admin';

function mergeHeaders(method: FetchMethod, initHeaders?: HeadersInit) {
  const headers: Record<string, string> = { ...authHeaders() };
  const input = initHeaders ? new Headers(initHeaders) : undefined;

  if (input) {
    input.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (method !== 'GET' && method !== 'DELETE' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase() as FetchMethod;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers: mergeHeaders(method, init.headers),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type AdminUserStatusCode = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';

export interface AdminUserVehicle {
  id: string;
  plateNumber: string;
  model: string | null;
  vehicleType: string | null;
  year: number | null;
  statusCode: string;
  status: string;
  routeId: string | null;
  routeName: string | null;
  route: {
    id: string;
    name: string;
    startPoint: string | null;
    endPoint: string | null;
  } | null;
}

export interface AdminUserSummary {
  id: string;
  memberNumber: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  idNumber: string | null;
  statusCode: AdminUserStatusCode;
  status: string;
  registrationDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastLogin: string | null;
  membershipType: string | null;
  profileCategory: string | null;
  shareCapital: number | null;
  savingsBalance: number | null;
  loanBalance: number | null;
  totalDeposits: number | null;
  metrics: {
    shareCapital: number | null;
    savingsBalance: number | null;
    loanBalance: number | null;
    totalDeposits: number | null;
  };
  vehicles: AdminUserVehicle[];
  vehiclesOwned: {
    count: number;
    items: AdminUserVehicle[];
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  roleId: string | null;
  permissions: string[];
  profileCategoryLabel: string | null;
  membershipTypeLabel: string | null;
}

export interface DashboardUsersResponse {
  items: AdminUserSummary[];
  totals: {
    total: number;
    byStatus: Record<AdminUserStatusCode, number>;
  };
}

export type VehicleStatusCode = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
export type RegistrationStatusCode = 'VALID' | 'EXPIRED' | 'PENDING';

export interface AdminVehicleSummary {
  id: string;
  plateNumber: string;
  model: string | null;
  vehicleType: string | null;
  yearOfManufacture: number | null;
  statusCode: VehicleStatusCode;
  status: string;
  registrationStatusCode: RegistrationStatusCode;
  registrationStatus: string;
  insuranceStatusCode: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  insuranceStatus: string;
  owner: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  driver: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  route: {
    id: string;
    name: string;
    startPoint: string | null;
    endPoint: string | null;
  } | null;
  metrics: {
    savingsBalance: number;
    outstandingLoanAmount: number;
    activeLoanCount: number;
  };
  lastPayment: {
    id: string;
    date: string;
    amount: number | null;
  } | null;
}

export interface DashboardVehiclesResponse {
  items: AdminVehicleSummary[];
  totals: {
    total: number;
    byStatus: Record<VehicleStatusCode, number>;
    byRegistrationStatus: Record<RegistrationStatusCode, number>;
    metrics: {
      savingsBalance: number;
      outstandingLoanAmount: number;
      activeLoanCount: number;
    };
  };
}

export type LoanStatusCode =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'REPAID'
  | 'DEFAULTED';

export interface AdminLoanSummary {
  id: string;
  applicantId: string;
  vehicleId: string | null;
  amount: number | null;
  statusCode: LoanStatusCode;
  status: string;
  typeCode: string;
  type: string;
  applicationDate: string;
  approvedAt: string | null;
  applicant: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
  } | null;
}

export interface DashboardLoansResponse {
  items: AdminLoanSummary[];
  totals: {
    total: number;
    byStatus: Record<LoanStatusCode, number>;
    sum: number;
    outstanding: number;
  };
}

export type InsuranceStatusCode = 'ACTIVE' | 'EXPIRED' | 'PENDING';

export interface AdminInsuranceSummary {
  id: string;
  vehicleId: string;
  statusCode: InsuranceStatusCode;
  status: string;
  premiumAmount: number | null;
  policyType: string | null;
  provider: string | null;
  startDate: string | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  vehicle: {
    id: string;
    plateNumber: string;
    owner: {
      id: string;
      name: string;
      phone: string | null;
    } | null;
  } | null;
}

export interface DashboardInsuranceResponse {
  items: AdminInsuranceSummary[];
  totals: {
    total: number;
    byStatus: Record<InsuranceStatusCode, number>;
    expiringSoon: number;
  };
}

export interface AdminUserListParams {
  status?: AdminUserStatusCode;
  search?: string;
  roleId?: string;
}

export async function fetchDashboardUsers(): Promise<DashboardUsersResponse> {
  return request(`${ADMIN_BASE}/dashboard/users`);
}

export async function fetchDashboardVehicles(): Promise<DashboardVehiclesResponse> {
  return request(`${ADMIN_BASE}/dashboard/vehicles`);
}

export async function fetchDashboardLoans(): Promise<DashboardLoansResponse> {
  return request(`${ADMIN_BASE}/dashboard/loans`);
}

export async function fetchDashboardInsurance(): Promise<DashboardInsuranceResponse> {
  return request(`${ADMIN_BASE}/dashboard/insurance`);
}

export async function fetchAdminUsers(params: AdminUserListParams = {}): Promise<{
  items: AdminUserSummary[];
  total: number;
  appliedFilters: {
    status: AdminUserStatusCode | null;
    roleId: string | null;
    search: string | null;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.roleId) searchParams.append('roleId', params.roleId);
  if (params.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';
  return request(`${ADMIN_BASE}/users${suffix}`);
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserSummary> {
  return request(`${ADMIN_BASE}/users/${userId}`);
}

export interface CreateAdminUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  status?: AdminUserStatusCode;
  membershipType?: string | null;
  profileCategory?: string | null;
  address?: string | null;
  county?: string | null;
  town?: string | null;
  occupation?: string | null;
  nextOfKin?: string | null;
  nextOfKinPhone?: string | null;
  dateOfBirth?: string | null;
  shareCapital?: number | null;
  savingsBalance?: number | null;
  loanBalance?: number | null;
  totalDeposits?: number | null;
  roleId?: string | null;
  password?: string;
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  return request<{ user: AdminUserSummary; temporaryPassword?: string }>(`${ADMIN_BASE}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  userId: string,
  payload: Partial<CreateAdminUserPayload>,
): Promise<AdminUserSummary> {
  return request(`${ADMIN_BASE}/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function approveAdminUser(userId: string, roleId: string): Promise<AdminUserSummary> {
  return request(`${ADMIN_BASE}/users/${userId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ roleId }),
  });
}

export async function setAdminUserStatus(
  userId: string,
  status: AdminUserStatusCode,
): Promise<AdminUserSummary> {
  return request(`${ADMIN_BASE}/users/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

export interface RolePermissionRecord {
  id: string;
  roleId: string;
  permissionId: string;
}

export async function fetchRoles(): Promise<AdminRole[]> {
  return request('/api/roles');
}

export async function createRole(payload: { name: string; description?: string | null }): Promise<AdminRole> {
  return request('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRole(
  roleId: string,
  payload: { name?: string; description?: string | null },
): Promise<AdminRole> {
  return request(`/api/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRole(roleId: string): Promise<void> {
  await request(`/api/roles/${roleId}`, { method: 'DELETE' });
}

export async function fetchPermissions(): Promise<AdminPermission[]> {
  return request('/api/permissions');
}

export async function fetchRolePermissions(): Promise<RolePermissionRecord[]> {
  return request('/api/rolePermissions');
}

export async function addRolePermission(
  roleId: string,
  permissionId: string,
): Promise<RolePermissionRecord> {
  return request('/api/rolePermissions', {
    method: 'POST',
    body: JSON.stringify({ roleId, permissionId }),
  });
}

export async function removeRolePermission(rolePermissionId: string): Promise<void> {
  await request(`/api/rolePermissions/${rolePermissionId}`, { method: 'DELETE' });
}
