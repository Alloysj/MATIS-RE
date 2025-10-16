export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';

const AUTH_TOKEN_KEY = 'authToken';
const UNAUTHORIZED_EVENT = 'matis:unauthorized';

let unauthorizedNotified = false;

const removeStoredToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const hasAuthHeader = (input: RequestInfo | URL, init?: RequestInit): boolean => {
  if (input instanceof Request && input.headers.get('Authorization')) {
    return true;
  }

  if (init?.headers) {
    const headers = new Headers(init.headers as HeadersInit);
    const value = headers.get('Authorization');
    return Boolean(value);
  }

  return false;
};

const dispatchUnauthorizedEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
};

export function notifyUnauthorized() {
  if (unauthorizedNotified) return;
  unauthorizedNotified = true;
  removeStoredToken();
  dispatchUnauthorizedEvent();
}

export function subscribeToUnauthorized(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(UNAUTHORIZED_EVENT, handler);

  return () => {
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  };
}

export function initApiClient() {
  if (typeof window === 'undefined') return;
  const globalWindow = window as typeof window & { __matisFetchPatched?: boolean };

  if (globalWindow.__matisFetchPatched) return;

  const originalFetch = globalWindow.fetch.bind(globalWindow);

  globalWindow.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    if (response.status === 401 && hasAuthHeader(input, init)) {
      notifyUnauthorized();
    }

    return response;
  };

  globalWindow.__matisFetchPatched = true;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  unauthorizedNotified = false;
}

export function clearAuthToken() {
  removeStoredToken();
  unauthorizedNotified = false;
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
