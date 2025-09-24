import { API_BASE, authHeaders } from './api';

export type RouteItem = {
  id: string;
  name: string;
  startPoint?: string;
  endPoint?: string;
};

export async function getRoutes(): Promise<RouteItem[]> {
  const res = await fetch(`${API_BASE}/api/matatus/routes`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch routes (${res.status})`);
  }
  return res.json();
}

export type VehicleCard = {
  id: string;
  plate: string;
  route: string;
  driver: string;
  savings: number;
  loan: number;
  insurance: string;
  lastPayment: string | null;
  paymentAmount: number;
  model: string;
  year: number | null;
};

export async function getDashboardCards(): Promise<VehicleCard[]> {
  const res = await fetch(`${API_BASE}/api/matatus/dashboard-cards`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch dashboard data (${res.status})`);
  }
  return res.json();
}

export type AvailableDriver = { id: string; name: string; phone: string; experience?: string };

export async function getAvailableDrivers(): Promise<AvailableDriver[]> {
  const res = await fetch(`${API_BASE}/api/matatus/availableDrivers`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch drivers (${res.status})`);
  }
  return res.json();
}

export async function assignDriver(vehicleId: string, driverId: string) {
  const res = await fetch(`${API_BASE}/api/matatus/${vehicleId}/assignDriver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ driverId })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to assign driver (${res.status})`);
  }
  return res.json();
}

export type VehicleSummary = { id: string; plate: string; savings: number };

export async function getUserVehicleSummaries(): Promise<VehicleSummary[]> {
  const res = await fetch(`${API_BASE}/api/matatus/userVehicles/summary`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch vehicle summaries (${res.status})`);
  }
  return res.json();
}
