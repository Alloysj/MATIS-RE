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
  status: 'pending';
  message?: string;
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
