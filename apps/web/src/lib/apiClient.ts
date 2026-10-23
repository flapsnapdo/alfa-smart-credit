// const API_BASE = 'http://localhost:3000/api/v1';
const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

function clearToken() {
  localStorage.removeItem('auth_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: any,
  requireAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getToken();
    if (!token) throw new Error('Не авторизован');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `Ошибка ${res.status}`);
  }

  return res.json();
}

export const apiClient = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('POST', '/auth/login', { email, password }),
  },
  me: () => request<any>('GET', '/me', undefined, true),
  products: {
    list: () => request<any[]>('GET', '/products'),
    recommend: (data: any) =>
      request<any>('POST', '/products/recommend', data, true),
  },
  registry: {
    lookup: (inn: string) =>
      request<any>('GET', `/registry/lookup?inn=${inn}`, undefined, true),
  },
  companies: {
    create: (data: any) =>
      request<any>('POST', '/companies', data, true),
    updateFinancials: (companyId: string, data: any) =>
      request<any>('PUT', `/companies/${companyId}/financials`, data, true),
  },
  applications: {
    list: () => request<any[]>('GET', '/applications', undefined, true),
    create: (data: any) =>
      request<any>('POST', '/applications', data, true),
    get: (id: string) =>
      request<any>('GET', `/applications/${id}`, undefined, true),
    update: (id: string, data: any) =>
      request<any>('PATCH', `/applications/${id}`, data, true),
    submit: (id: string, bkiConsent: boolean) =>
      request<any>('POST', `/applications/${id}/submit`, { bkiConsent }, true),
    timeline: (id: string) =>
      request<any[]>('GET', `/applications/${id}/timeline`, undefined, true),
  },
};

export { getToken, setToken, clearToken };