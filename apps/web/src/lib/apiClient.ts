import type { Schemas } from '../types/api';

const API_BASE = '/api/v1';

// Типы для запросов/ответов
type LoginRequest = { email: string; password: string };
type LoginResponse = { token: string; user: Schemas['User'] };

export const apiClient = {
  // Аутентификация
  auth: {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Ошибка входа');
      return response.json();
    },

    getMe: async (): Promise<{ user: Schemas['User']; companies: Schemas['Company'][] }> => {
      const response = await fetch(`${API_BASE}/me`);
      if (!response.ok) throw new Error('Ошибка получения профиля');
      return response.json();
    },
  },

  // Реестр компаний
  registry: {
    lookup: async (inn: string): Promise<Schemas['RegistryRecord']> => {
      const response = await fetch(`${API_BASE}/registry/lookup?inn=${inn}`);
      if (response.status === 404) throw new Error('Компания не найдена в реестре');
      if (response.status === 503) throw new Error('Сервис реестра временно недоступен');
      if (!response.ok) throw new Error('Ошибка при поиске компании');
      return response.json();
    },
  },

  // Компании
  companies: {
    create: async (data: Schemas['CompanyInput']): Promise<Schemas['Company']> => {
      const response = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Ошибка создания компании');
      return response.json();
    },

    updateFinancials: async (
      companyId: string,
      financials: Schemas['Financials']
    ): Promise<Schemas['Financials']> => {
      const response = await fetch(`${API_BASE}/companies/${companyId}/financials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(financials),
      });
      if (!response.ok) throw new Error('Ошибка обновления финансовых данных');
      return response.json();
    },
  },

  // Продукты
  products: {
    getList: async (): Promise<Schemas['Product'][]> => {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Ошибка получения продуктов');
      return response.json();
    },

    recommend: async (data: {
      purpose: Schemas['Purpose'];
      amount: number;
      term: number;
    }): Promise<{
      recommended: Schemas['Product'];
      alternative?: Schemas['Product'];
      rate: number;
      monthlyPayment: number;
    }> => {
      const response = await fetch(`${API_BASE}/products/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Ошибка подбора продукта');
      return response.json();
    },
  },

  // Заявки
  applications: {
    getList: async (): Promise<Schemas['Application'][]> => {
      const response = await fetch(`${API_BASE}/applications`);
      if (!response.ok) throw new Error('Ошибка получения заявок');
      return response.json();
    },

    create: async (data: Schemas['ApplicationInput']): Promise<Schemas['Application']> => {
      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Ошибка создания заявки');
      return response.json();
    },

    getById: async (id: string): Promise<Schemas['Application']> => {
      const response = await fetch(`${API_BASE}/applications/${id}`);
      if (!response.ok) throw new Error('Ошибка получения заявки');
      return response.json();
    },

    update: async (id: string, data: Schemas['ApplicationInput']): Promise<Schemas['Application']> => {
      const response = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Ошибка обновления заявки');
      return response.json();
    },

    submit: async (id: string, bkiConsent: boolean): Promise<Schemas['Application']> => {
      const response = await fetch(`${API_BASE}/applications/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bkiConsent }),
      });
      if (!response.ok) throw new Error('Ошибка отправки заявки');
      return response.json();
    },

    getTimeline: async (id: string): Promise<Schemas['StatusChange'][]> => {
      const response = await fetch(`${API_BASE}/applications/${id}/timeline`);
      if (!response.ok) throw new Error('Ошибка получения таймлайна');
      return response.json();
    },
  },
};