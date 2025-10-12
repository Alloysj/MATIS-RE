import { API_BASE, authHeaders } from './api';

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const ADMIN_BASE = '/api/admin';
const ADMIN_FLEET_BASE = `${ADMIN_BASE}/fleet`;
const ROUTES_BASE = '/api/routes';

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

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

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

export interface AdminVehicleFilters {
  status?: VehicleStatusCode;
  registrationStatus?: RegistrationStatusCode;
  insuranceStatus?: InsuranceStatusCode;
  ownerId?: string;
  driverId?: string;
  routeId?: string;
  search?: string;
}

export interface AdminVehicleListResponse {
  items: AdminVehicleSummary[];
  total: number;
  appliedFilters: {
    status: VehicleStatusCode | null;
    registrationStatus: RegistrationStatusCode | null;
    insuranceStatus: InsuranceStatusCode | null;
    ownerId: string | null;
    driverId: string | null;
    routeId: string | null;
    search: string | null;
  };
}

export interface AdminVehicleCreatePayload {
  ownerId: string;
  plateNumber: string;
  model?: string | null;
  vehicleType?: string | null;
  yearOfManufacture?: number | null;
  routeId?: string | null;
  driverId?: string | null;
  status?: VehicleStatusCode;
  registrationStatus?: RegistrationStatusCode;
  insuranceStatus?: InsuranceStatusCode;
  insuranceProvider?: string | null;
  policyType?: string | null;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
  premium?: number | null;
}

export type AdminVehicleUpdatePayload = Partial<AdminVehicleCreatePayload>;

export interface AdminAssignDriverPayload {
  driverId: string;
  assignedAt?: string | null;
}

export interface AdminDriverAssignmentResponse {
  vehicle: AdminVehicleSummary;
  assignment: {
    id: string;
    vehicleId: string;
    driverId: string;
    assignedAt: string;
  };
}

export interface AdminInsurancePaymentRequest {
  amount: number;
  paymentDate?: string | null;
  startDate?: string | null;
  expiryDate?: string | null;
  provider?: string | null;
  policyType?: string | null;
  mpesaReference?: string | null;
}

export interface AdminInsurancePaymentResponse {
  vehicle: AdminVehicleSummary;
  payment: {
    id: string;
    paymentDate: string;
    totalAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    mpesaReference: string | null;
  };
  policy: {
    id: string;
    provider: string | null;
    policyType: string | null;
    premiumAmount: number | null;
    startDate: string | null;
    expiryDate: string | null;
    status: InsuranceStatusCode;
  };
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

export type LoanTypeCode = 'NORMAL' | 'EMERGENCY';

export interface AdminLoanGuarantor {
  id: string;
  name: string;
  phone: string | null;
}

export interface AdminLoanSummary {
  id: string;
  applicantId: string;
  vehicleId: string | null;
  amount: number | null;
  purpose: string | null;
  savingsAtApplication: number | null;
  creditScore: number | null;
  monthlyIncome: number | null;
  existingLoans: number | null;
  urgency: string | null;
  expectedRepaymentDate: string | null;
  statusCode: LoanStatusCode;
  status: string;
  typeCode: LoanTypeCode;
  type: string;
  applicationDate: string;
  approvedAt: string | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  applicant: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
  } | null;
  guarantors: AdminLoanGuarantor[];
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

export interface AdminLoanListResponse {
  items: AdminLoanSummary[];
  totals: {
    total: number;
    byStatus: Record<LoanStatusCode, number>;
    byType: Record<LoanTypeCode, number>;
  };
}

export interface AdminLoanFilters {
  status?: LoanStatusCode;
  type?: LoanTypeCode;
  search?: string;
}

export interface AdminLoanUpdatePayload {
  status?: LoanStatusCode;
  creditScore?: number | null;
  monthlyIncome?: number | null;
  existingLoans?: number | null;
  urgency?: string | null;
  expectedRepaymentDate?: string | null;
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

export interface AdminSavingsSummary {
  id: string;
  userId: string;
  vehicleId: string | null;
  accountType: string | null;
  balance: number | null;
  monthlyTarget: number | null;
  lastDeposit: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
  } | null;
}

export interface DashboardSavingsResponse {
  items: AdminSavingsSummary[];
  totals: {
    total: number;
    sum: number;
    monthlyTarget: number;
    activeRecently: number;
    byType: Record<
      string,
      {
        count: number;
        balance: number;
      }
    >;
  };
}

export interface AdminRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distanceKm: number | null;
  estimatedTime?: string | null;
  vehiclesAssigned: number | null;
  fare: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  dateCreated: string;
}

export interface AdminRoutePayload {
  name: string;
  startPoint: string;
  endPoint: string;
  distanceKm?: number | null;
  estimatedTime?: string | null;
  fare?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
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

export async function fetchDashboardSavings(): Promise<DashboardSavingsResponse> {
  return request(`${ADMIN_BASE}/dashboard/savings`);
}

export async function fetchAdminLoans(filters: AdminLoanFilters = {}): Promise<AdminLoanListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.search) params.append('search', filters.search);
  const query = params.toString();
  return request(`${ADMIN_BASE}/loans${query ? `?${query}` : ''}`);
}

export async function fetchAdminLoan(loanId: string): Promise<AdminLoanSummary> {
  return request(`${ADMIN_BASE}/loans/${loanId}`);
}

export async function updateAdminLoan(
  loanId: string,
  payload: AdminLoanUpdatePayload
): Promise<AdminLoanSummary> {
  return request(`${ADMIN_BASE}/loans/${loanId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function fetchAdminFleetVehicles(filters: AdminVehicleFilters = {}): Promise<AdminVehicleListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.registrationStatus) params.append('registrationStatus', filters.registrationStatus);
  if (filters.insuranceStatus) params.append('insuranceStatus', filters.insuranceStatus);
  if (filters.ownerId) params.append('ownerId', filters.ownerId);
  if (filters.driverId) params.append('driverId', filters.driverId);
  if (filters.routeId) params.append('routeId', filters.routeId);
  if (filters.search) params.append('search', filters.search);

  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return request(`${ADMIN_FLEET_BASE}/vehicles${suffix}`);
}

export async function fetchAdminFleetVehicle(vehicleId: string): Promise<AdminVehicleSummary> {
  return request(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}`);
}

export async function createAdminFleetVehicle(payload: AdminVehicleCreatePayload): Promise<AdminVehicleSummary> {
  return request(`${ADMIN_FLEET_BASE}/vehicles`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminFleetVehicle(
  vehicleId: string,
  payload: AdminVehicleUpdatePayload,
): Promise<AdminVehicleSummary> {
  return request(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminFleetVehicle(vehicleId: string): Promise<void> {
  await request(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}`, { method: 'DELETE' });
}

export async function assignDriverToVehicle(
  vehicleId: string,
  payload: AdminAssignDriverPayload,
): Promise<AdminDriverAssignmentResponse> {
  return request(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordVehicleInsurancePayment(
  vehicleId: string,
  payload: AdminInsurancePaymentRequest,
): Promise<AdminInsurancePaymentResponse> {
  return request(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}/insurance/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

const mapRouteRecord = (route: any): AdminRoute => {
  const normalizeDate = (value: any): string => {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string') return value;
    try {
      return new Date(value).toISOString();
    } catch {
      return String(value);
    }
  };

  const estimatedTime =
    route?.estimatedTime == null
      ? null
      : typeof route.estimatedTime === 'string'
        ? route.estimatedTime
        : String(route.estimatedTime);

  const vehiclesAssignedRaw = route?.vehiclesAssigned;
  const vehiclesAssignedNumber =
    typeof vehiclesAssignedRaw === 'number'
      ? vehiclesAssignedRaw
      : toNumberOrNull(vehiclesAssignedRaw);

  return {
    id: route.id,
    name: route.name,
    startPoint: route.startPoint,
    endPoint: route.endPoint,
    distanceKm: toNumberOrNull(route.distanceKm),
    estimatedTime: estimatedTime ?? undefined,
    vehiclesAssigned: vehiclesAssignedNumber,
    fare: toNumberOrNull(route.fare),
    status: (route.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    dateCreated: normalizeDate(route.dateCreated),
  };
};

export async function fetchAdminRoutes(): Promise<AdminRoute[]> {
  const routes = await request<any[]>(ROUTES_BASE);
  return routes.map(mapRouteRecord);
}

export async function fetchAdminRoute(routeId: string): Promise<AdminRoute> {
  const route = await request<any>(`${ROUTES_BASE}/${routeId}`);
  return mapRouteRecord(route);
}

export async function createAdminRoute(payload: AdminRoutePayload): Promise<AdminRoute> {
  const route = await request<any>(ROUTES_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapRouteRecord(route);
}

export async function updateAdminRoute(
  routeId: string,
  payload: Partial<AdminRoutePayload>,
): Promise<AdminRoute> {
  const route = await request<any>(`${ROUTES_BASE}/${routeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapRouteRecord(route);
}

export async function deleteAdminRoute(routeId: string): Promise<void> {
  await request(`${ROUTES_BASE}/${routeId}`, { method: 'DELETE' });
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
