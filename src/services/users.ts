import { API_BASE, authHeaders } from './api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  memberNumber: string;
  status: string;
  registrationDate: string | null;
  shareCapital: number | null;
  savingsBalance: number | null;
  loanBalance: number | null;
  totalDeposits: number | null;
  nextOfKin: string | null;
  nextOfKinPhone: string | null;
  occupation: string | null;
  address: string | null;
  county: string | null;
  town: string | null;
  profileCategory?: string | null;
  membershipType?: string | null;
  role?: { id: string; name: string } | null;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/userDetails`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load profile (${res.status})`);
  }
  const data = await res.json();
  return {
    id: String(data?.id ?? ''),
    firstName: String(data?.firstName ?? ''),
    lastName: String(data?.lastName ?? ''),
    email: String(data?.email ?? ''),
    phone: data?.phone ?? null,
    memberNumber: data?.memberNumber != null ? String(data.memberNumber) : '',
    status: String(data?.status ?? ''),
    registrationDate: data?.registrationDate ?? data?.createdAt ?? null,
    shareCapital: toNumber(data?.shareCapital),
    savingsBalance: toNumber(data?.savingsBalance),
    loanBalance: toNumber(data?.loanBalance),
    totalDeposits: toNumber(data?.totalDeposits),
    nextOfKin: data?.nextOfKin ?? null,
    nextOfKinPhone: data?.nextOfKinPhone ?? null,
    occupation: data?.occupation ?? null,
    address: data?.address ?? null,
    county: data?.county ?? null,
    town: data?.town ?? null,
    profileCategory: data?.profileCategory ?? null,
    membershipType: data?.membershipType ?? null,
    role: data?.role ? { id: String(data.role.id), name: String(data.role.name) } : null
  };
}

export type UserProfileUpdate = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  county: string | null;
  town: string | null;
  occupation: string | null;
  nextOfKin: string | null;
  nextOfKinPhone: string | null;
}>;

export async function updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to update profile (${res.status})`);
  }
  // Re-fetch profile for normalized shape
  return fetchUserProfile();
}
