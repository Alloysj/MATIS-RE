import { API_BASE, authHeaders } from './api';

const STAFF_BASE = `${API_BASE}/api/staff`;
const FINANCE_BASE = `${API_BASE}/api/finance`;
const ADMIN_FLEET_BASE = `${API_BASE}/api/admin/fleet`;

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

const buildQueryString = (params?: QueryParams) => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.append(key, String(value));
  });
  const result = search.toString();
  return result ? `?${result}` : '';
};

async function staffRequest<T>(
  path: string,
  { skipJson = false, headers: extraHeaders, ...init }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(extraHeaders as Record<string, string> | undefined),
  };

  const response = await fetch(`${STAFF_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Staff API request failed (${response.status})`);
  }

  if (skipJson || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function authedRequest<T>(url: string, { skipJson = false, ...init }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${url} failed (${response.status})`);
  }

  if (skipJson || response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface StaffDetails {
  name: string | null;
  position: string | null;
}

export const getStaffDetails = () => staffRequest<StaffDetails>('/details');

export interface UpdateStaffDetailsPayload {
  bankName?: string;
  accountNumber?: string;
  kra?: string;
  nhif?: string;
  passportPhoto?: string;
}

export const updateStaffDetails = (data: UpdateStaffDetailsPayload) =>
  staffRequest<any>('/details/modify', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getStaffProfile = () => staffRequest<any>('/details/user');

export const getStaffPosition = () => staffRequest<{ position: string | null }>('/position');

export interface AdvancePayload {
  amount: number;
  reason: string;
}

export const applyAdvance = (data: AdvancePayload) =>
  staffRequest<any>('/apply-advance', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const checkPendingAdvance = () => staffRequest<{ hasPending: boolean }>('/checkSalaryAdvance');

export const getSalaries = () => staffRequest<any>('/salary');

export interface PaySalaryPayload {
  staffId: string;
  basicSalary: number;
  netSalary: number;
  [key: string]: unknown;
}

export const paySalary = (data: PaySalaryPayload) =>
  staffRequest<any>('/pay-salary', {
    method: 'POST',
    body: JSON.stringify(data),
  });

const updateAdvanceStatus = (advanceId: string, status: 'APPROVED' | 'REJECTED') =>
  staffRequest<any>('/advance/approve', {
    method: 'POST',
    body: JSON.stringify({ advanceId, status }),
  });

export const approveAdvance = (id: string) => updateAdvanceStatus(id, 'APPROVED');

export const rejectAdvance = (id: string) => updateAdvanceStatus(id, 'REJECTED');

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}

export const getExpenses = (filters: ExpenseFilters = {}) =>
  staffRequest<any>('/expenses', {
    method: 'POST',
    body: JSON.stringify(filters),
  });

export interface AddExpensePayload {
  category?: string;
  description: string;
  amount: number;
  vendor?: string;
}

export const addExpenses = (data: AddExpensePayload) =>
  staffRequest<any>('/office-expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getReports = () => staffRequest<any>('/reports/financial');

export const getSalaryAdvanceApplications = () => staffRequest<any>('/salary-advance-applications');

export const getAllExpenses = () => staffRequest<any>('/all-expenses');

export const getAdvanceStatus = (requestId: string) =>
  staffRequest<{ status: string | null }>(`/advance/status?requestId=${encodeURIComponent(requestId)}`);

export const getPayslips = (staffId: string) => staffRequest<any>(`/payslips/${staffId}`);

export const assignStaffPosition = (userId: string, position: string) =>
  staffRequest<any>('/assign-position', {
    method: 'POST',
    body: JSON.stringify({ userId, position }),
  });

export const recordWagePayment = (data: { description: string; amount: number; userId: string }) =>
  staffRequest<any>('/wages/pay', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const recordExpense = (data: AddExpensePayload) => addExpenses(data);

export const getNhifStatus = () => staffRequest<{ deducted: boolean }>('/nhif-status');

export interface LoanPayload {
  amount?: number;
  purpose?: string;
  type?: 'NORMAL' | 'EMERGENCY';
  vehicleId?: string | null;
  guarantorIds?: string[];
  savingsAtApplication?: number;
  creditScore?: number;
  monthlyIncome?: number;
  existingLoans?: number;
  urgency?: string;
  expectedRepaymentDate?: string;
}

export const getLoans = () => authedRequest<any[]>(`${FINANCE_BASE}/loans`);

export const getPendingLoans = () => authedRequest<any[]>(`${FINANCE_BASE}/pendingLoans`);

export const applyLoan = (payload: LoanPayload) =>
  authedRequest(`${FINANCE_BASE}/applyLoan`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getLoanTotals = () => authedRequest<{ total: number }>(`${FINANCE_BASE}/loans/total`);

export const getFleetVehicles = () => authedRequest<any[]>(`${ADMIN_FLEET_BASE}/vehicles`);

export const assignDriverToVehicle = (vehicleId: string, driverId: string) =>
  authedRequest(`${ADMIN_FLEET_BASE}/vehicles/${vehicleId}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify({ driverId }),
  });

export interface FinanceSummaryTotals {
  operations: number;
  insurance: number;
  loanRepayments: number;
  savings: number;
  expenditures: number;
  netFlow: number;
}

export interface FinanceTrendPoint {
  date: string;
  collections: number;
  expenditures: number;
}

export interface FinanceSummaryExpectations {
  expectedTrips: number;
  actualTrips: number;
  expectedOps: number;
  expectedInsurance: number;
}

export interface FinanceRouteStat {
  route: string;
  amount: number;
  trips?: number;
  vehicles?: number;
}

export interface FinanceDailySummaryResponse {
  date: string;
  totals: FinanceSummaryTotals;
  trend?: FinanceTrendPoint[];
  expectations?: FinanceSummaryExpectations;
  topRoutes?: FinanceRouteStat[];
  routeSummary?: FinanceRouteStat[];
  recentRemittances?: FinanceRecentRemittance[];
  allocationSummary?: Record<string, number>;
}

export interface FinanceMemberSuggestion {
  id: string;
  name: string;
  phone: string;
  memberNumber?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  route?: string;
}

export interface FinanceRecentRemittance {
  id: string;
  member: string;
  memberNumber?: string;
  vehiclePlate?: string;
  vehicleId?: string;
  route?: string;
  amount: number;
  method?: string;
  time?: string;
  status?: string;
}

export interface FinanceMemberSearchResponse {
  members?: FinanceMemberSuggestion[];
  payments?: Array<{
    id: string;
    user?: { id: string; name: string; phone?: string };
    vehicle?: { plateNumber?: string; route?: string };
    memberNumber?: string;
  }>;
}

export interface FinanceTransactionsQuery {
  date?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  method?: string;
  status?: string;
  range?: string;
  limit?: number;
}

export interface FinanceTransactionRecord {
  id: string;
  date: string;
  time?: string;
  member?: string;
  memberNumber?: string;
  vehicle?: string;
  vehicleId?: string;
  route?: string;
  category?: string;
  method?: string;
  amount: number;
  status?: string;
  mpesaRef?: string;
  allocation?: {
    operations?: number;
    insurance?: number;
    loan?: number;
    savings?: number;
  };
}

export interface FinanceTransactionsResponse {
  transactions?: FinanceTransactionRecord[];
  items?: FinanceTransactionRecord[];
  total?: number;
}

export interface FinanceAuditLogEntry {
  id: string;
  action: string;
  amount: number;
  member: string;
  time: string;
  by: string;
}

export interface FinancePaymentPayload {
  mode: 'stk' | 'offline';
  userId: string;
  vehicleId?: string;
  amount: number;
  category: string;
  receiptNumber?: string;
  paymentMethod?: string;
}

export interface FinancePaymentResponse {
  paymentId?: string;
  status?: string;
  checkoutRequestId?: string;
  message?: string;
}

export const fetchFinanceDailySummary = (params?: { date?: string }) =>
  authedRequest<FinanceDailySummaryResponse>(`${FINANCE_BASE}/summary/daily${buildQueryString(params)}`);

export const searchFinanceMembers = (params?: { search?: string; limit?: number }) =>
  authedRequest<FinanceMemberSearchResponse>(`${FINANCE_BASE}/payments${buildQueryString(params)}`);

export const fetchFinanceTransactions = (params?: FinanceTransactionsQuery) =>
  authedRequest<FinanceTransactionsResponse>(`${FINANCE_BASE}/transactions${buildQueryString(params)}`);

export const fetchFinanceAuditLog = (params?: { date?: string; limit?: number }) =>
  authedRequest<FinanceAuditLogEntry[]>(`${FINANCE_BASE}/payments/audit${buildQueryString(params)}`);

export const submitFinancePayment = (payload: FinancePaymentPayload) =>
  authedRequest<FinancePaymentResponse>(`${FINANCE_BASE}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
