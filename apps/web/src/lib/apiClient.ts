import type {
  AnalystCard, Application, ApplicationListItem, ApplicationStatus, Company, Contract, DocType,
  DocumentMeta, DocumentsInfo, Explanation, Product, Purpose, QueueItem, Recommendation,
  RegistryRecord, StatusHistoryEntry, User,
} from './types';

// В dev-режиме Vite проксирует /api в API, в Docker — nginx
const API_BASE = '/api/v1';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Ошибка API в едином формате { code, message, details } */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string[];

  constructor(status: number, code: string, message: string, details?: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;   // Content-Type с границей поставит браузер
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Нет связи с сервером. Проверьте, что API запущен');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Токен истёк или недействителен — на страницу входа
    if (res.status === 401 && path !== '/auth/login') {
      clearSession();
      window.location.assign('/login');
    }
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? `Ошибка ${res.status}`, err.details);
  }
  return (await res.json()) as T;
}

/** Файл с авторизацией: открываем через blob, обычная ссылка не передаст токен */
async function openFile(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new ApiError(res.status, 'ERROR', 'Не удалось открыть файл');
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/login', { email, password }),
  me: () => request<{ user: User; companies: Company[] }>('GET', '/me'),

  products: () => request<Product[]>('GET', '/products'),
  recommend: (purpose: Purpose, amount: number, term: number) =>
    request<Recommendation>('POST', '/products/recommend', { purpose, amount, term }),
  registryLookup: (inn: string) =>
    request<RegistryRecord>('GET', `/registry/lookup?inn=${encodeURIComponent(inn)}`),

  applications: () => request<ApplicationListItem[]>('GET', '/applications'),
  createApplication: (data: { companyId: string; productCode: string; purpose: Purpose; amount: number; term: number }) =>
    request<Application>('POST', '/applications', data),
  application: (id: string) => request<Application>('GET', `/applications/${id}`),
  timeline: (id: string) => request<StatusHistoryEntry[]>('GET', `/applications/${id}/timeline`),
  explanation: (id: string) => request<Explanation>('GET', `/applications/${id}/explanation`),
  submit: (id: string) => request<Application>('POST', `/applications/${id}/submit`, { bkiConsent: true }),
  cancel: (id: string) => request<Application>('POST', `/applications/${id}/cancel`),

  documents: (id: string) => request<DocumentsInfo>('GET', `/applications/${id}/documents`),
  uploadDocument: (id: string, docType: DocType, file: File) => {
    const form = new FormData();
    form.append('docType', docType);
    form.append('file', file);
    return request<{ document: DocumentMeta; missing: DocumentsInfo['missing'] }>('POST', `/applications/${id}/documents`, form);
  },
  openDocument: (id: string, docId: string) => openFile(`/applications/${id}/documents/${docId}`),

  accept: (id: string, offerIndex: number) => request<Contract>('POST', `/applications/${id}/accept`, { offerIndex }),
  contract: (id: string) => request<Contract>('GET', `/applications/${id}/contract`),
  sign: (id: string, code: string) => request<Contract>('POST', `/applications/${id}/sign`, { code }),

  analystQueue: (status: ApplicationStatus) =>
    request<QueueItem[]>('GET', `/analyst/applications?status=${status}`),
  analystCard: (id: string) => request<AnalystCard>('GET', `/analyst/applications/${id}`),
  analystDecision: (id: string, body: { type: 'APPROVE' | 'COUNTER_OFFER' | 'REJECT'; comment: string; amount?: number; term?: number; rate?: number }) =>
    request<Application>('POST', `/analyst/applications/${id}/decision`, body),
  analystRequestInfo: (id: string, docType: DocType, comment: string) =>
    request<Application>('POST', `/analyst/applications/${id}/request-info`, { docType, comment }),
};
