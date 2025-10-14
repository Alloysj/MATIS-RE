import { API_BASE, authHeaders } from './api';

export async function applyLoan(params: { vehicleId?: string; type: 'NORMAL' | 'EMERGENCY'; amount: number; purpose: string; savingsAtApplication?: number; guarantorIds?: string[] }) {
  const res = await fetch(`${API_BASE}/api/finance/applyLoan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Apply loan failed (${res.status})`);
  }
  return res.json();
}

export type ProcessPaymentPayload = { phone: string; amount: number; vehicleId?: string };
export type ProcessPaymentResponse = {
  checkoutRequestId: string;
  merchantRequestId?: string;
  status: 'pending' | 'completed';
  message?: string;
  paymentId?: string;
};

export async function processPayment(payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> {
  const res = await fetch(`${API_BASE}/api/finance/processPayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Process payment failed (${res.status})`);
  }
  return res.json();
}

export type PaymentStatusResponse = {
  status: 'pending' | 'completed' | 'failed' | 'canceled';
  mpesaReceiptNumber?: string | null;
  message?: string | null;
};

export async function checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResponse> {
  const res = await fetch(`${API_BASE}/api/finance/paymentStatus/${checkoutRequestId}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Check payment status failed (${res.status})`);
  }
  return res.json();
}


const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export interface SavingsTrendPoint {
  month: string;
  amount: number;
}

export async function getSavingsTrend(userId: string, options?: { months?: number }): Promise<SavingsTrendPoint[]> {
  const params = new URLSearchParams();
  if (options?.months) {
    params.set('months', String(options.months));
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/finance/dashboard/${userId}/savings-trend${query ? `?${query}` : ''}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load savings trend (${res.status})`);
  }
  const data = await res.json();
  const months = Array.isArray(data?.months) ? data.months : [];
  return months.map((item: any) => ({
    month: String(item?.month ?? ''),
    amount: toNumber(item?.amount)
  }));
}

export interface LoanTrendPoint {
  month: string;
  amount: number;
}

export async function getLoanTrend(userId: string, options?: { months?: number }): Promise<LoanTrendPoint[]> {
  const params = new URLSearchParams();
  if (options?.months) { params.set('months', String(options.months)); }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/finance/dashboard/${userId}/loan-trend${query ? `?${query}` : ''}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load loan trend (${res.status})`);
  }
  const data = await res.json();
  const months = Array.isArray(data?.months) ? data.months : [];
  return months.map((item: any) => ({
    month: String(item?.month ?? ''),
    amount: toNumber(item?.amount)
  }));
}

export interface AllocationBreakdown {
  payment: {
    id: string;
    date: string;
    totalAmount: number;
    status: string;
  } | null;
  allocations: Array<{
    category: string;
    label: string;
    value: number;
  }>;
}

export async function getLatestAllocation(userId: string): Promise<AllocationBreakdown | null> {
  const res = await fetch(`${API_BASE}/api/finance/dashboard/${userId}/allocation-latest`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load allocation breakdown (${res.status})`);
  }
  const data = await res.json();
  const payment = data?.payment
    ? {
        id: String(data.payment.id),
        date: String(data.payment.date),
        totalAmount: toNumber(data.payment.totalAmount),
        status: String(data.payment.status)
      }
    : null;
  const allocations = Array.isArray(data?.allocations)
    ? data.allocations.map((item: any) => ({
        category: String(item?.category ?? ''),
        label: String(item?.label ?? String(item?.category ?? 'Unknown')),
        value: toNumber(item?.value)
      }))
    : [];
  if (!payment && allocations.length === 0) {
    return null;
  }
  return { payment, allocations };
}

export interface RecentTransaction {
  id: string;
  date: string;
  type: string;
  label: string;
  amount: number;
  balanceAfter: number | null;
  vehiclePlate: string | null;
  paymentId: string | null;
}

export async function getRecentTransactions(userId: string, options?: { limit?: number }): Promise<RecentTransaction[]> {
  const params = new URLSearchParams();
  if (options?.limit) { params.set('limit', String(options.limit)); }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/finance/dashboard/${userId}/recent-transactions${query ? `?${query}` : ''}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load recent transactions (${res.status})`);
  }
  const data = await res.json();
  const list = Array.isArray(data?.transactions) ? data.transactions : [];
  return list.map((item: any) => ({
    id: String(item?.id ?? generateId()),
    date: String(item?.date ?? ''),
    type: String(item?.type ?? ''),
    label: String(item?.label ?? item?.type ?? ''),
    amount: toNumber(item?.amount),
    balanceAfter: item?.balanceAfter === null || item?.balanceAfter === undefined
      ? null
      : toNumber(item?.balanceAfter),
    vehiclePlate: item?.vehiclePlate ? String(item.vehiclePlate) : null,
    paymentId: item?.paymentId ? String(item.paymentId) : null
  }));
}

export async function getSavingsTotal(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/finance/savings/total`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load savings total (${res.status})`);
  }
  const data = await res.json();
  return toNumber(data?.total);
}

export async function getLoansTotal(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/finance/loans/total`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load loan total (${res.status})`);
  }
  const data = await res.json();
  return toNumber(data?.total);
}
