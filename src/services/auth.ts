import { API_BASE, setAuthToken, authHeaders, clearAuthToken } from './api';

export async function signup(params: { email: string; password: string; firstName: string; lastName: string }) {
  const res = await fetch(`${API_BASE}/api/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Signup failed (${res.status})`);
  }
  return res.json();
}

export async function login(params: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed (${res.status})`);
  }
  const data = await res.json();
  if (data?.token) setAuthToken(data.token);
  return data;
}

export async function getUserDetails() {
  const res = await fetch(`${API_BASE}/api/users/userDetails`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthToken();
    const text = await res.text();
    throw new Error(text || `Failed to load user details (${res.status})`);
  }
  return res.json();
}

