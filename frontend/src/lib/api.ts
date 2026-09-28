const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tg_export_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tg_export_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tg_export_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export const api = {
  // Auth endpoints
  startAuth: (phone_number: string) =>
    request<{ phone_number: string; phone_code_hash: string; message: string }>('/auth/telegram/start', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    }),

  verifyAuth: (phone_number: string, phone_code_hash: string, code: string) =>
    request<any>('/auth/telegram/verify', {
      method: 'POST',
      body: JSON.stringify({ phone_number, phone_code_hash, code }),
    }),

  verify2FA: (phone_number: string, password: string) =>
    request<any>('/auth/telegram/2fa', {
      method: 'POST',
      body: JSON.stringify({ phone_number, password }),
    }),

  getAuthStatus: () => request<any>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // Group endpoints
  getGroups: () => request<{ groups: any[] }>('/groups'),

  getGroupMembers: (groupId: string, limit: number = 100, offset: number = 0) =>
    request<any>(`/groups/${encodeURIComponent(groupId)}/members?limit=${limit}&offset=${offset}`),

  getExportUrl: (groupId: string) => `${API_BASE}/groups/${encodeURIComponent(groupId)}/export`,
};
