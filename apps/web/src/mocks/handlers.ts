// @ts-nocheck
import { http, HttpResponse } from 'msw';

const MOCK_USER: any = {
  id: 'user-1',
  email: 'client@test.ru',
  fullName: 'Иван Иванов',
  role: 'CLIENT',
};

const MOCK_COMPANY: any = {
  id: 'company-1',
  inn: '7707083893',
  ogrn: '1027700132195',
  type: 'LLC',
  name: 'ООО "Северный склад"',
  okved: '46.90 — Торговля оптовая неспециализированная',
  address: 'г. Москва, ул. Вавилова, д. 19',
  directorName: 'Иванов Иван Иванович',
  position: 'CEO',
  status: 'ACTIVE',
  registeredAt: '2018-03-15',
};

const MOCK_REGISTRY: any = {
  inn: '7707083893',
  ogrn: '1027700132195',
  type: 'LLC',
  name: 'ООО "Северный склад"',
  status: 'ACTIVE',
  registeredAt: '2018-03-15',
  okved: '46.90 — Торговля оптовая неспециализированная',
  address: 'г. Москва, ул. Вавилова, д. 19',
  directorName: 'Иванов Иван Иванович',
};

const MOCK_PRODUCTS: any = [
  {
    id: 'prod-1',
    code: 'WORKING_CAPITAL',
    name: 'Кредит на пополнение оборотных средств',
    minAmount: 10000000,
    maxAmount: 1000000000,
    minTerm: 3,
    maxTerm: 24,
    baseRate: 18,
    requiredDocs: ['FINANCIAL_STATEMENTS'],
  },
  {
    id: 'prod-2',
    code: 'EQUIPMENT',
    name: 'Кредит на покупку оборудования',
    minAmount: 50000000,
    maxAmount: 5000000000,
    minTerm: 12,
    maxTerm: 60,
    baseRate: 15,
    requiredDocs: ['EQUIPMENT_INVOICE', 'FINANCIAL_STATEMENTS'],
  },
];

const MOCK_APPLICATIONS: any = [
  {
    id: 'app-1',
    number: 'ЗК-2026-000123',
    company: MOCK_COMPANY,
    product: MOCK_PRODUCTS[0],
    purpose: 'WORKING_CAPITAL',
    requested: { amount: 500000000, term: 12 },
    status: 'DRAFT',
    clientView: {
      title: 'Черновик заявки',
      text: 'Вы можете продолжить заполнение или отправить заявку',
      nextAction: 'FILL_DRAFT',
    },
    offer: null,
    reasons: [],
    openInfoRequest: null,
    version: 1,
    submittedAt: null,
    updatedAt: '2026-10-22T10:00:00Z',
  },
];

export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({ token: 'mock-jwt-token', user: MOCK_USER });
  }),

  http.get('/api/v1/me', () => {
    return HttpResponse.json({ user: MOCK_USER, companies: [MOCK_COMPANY] });
  }),

  http.get('/api/v1/registry/lookup', ({ request }) => {
    const url = new URL(request.url);
    const inn = url.searchParams.get('inn');
    if (inn === '0000000000') {
      return new HttpResponse(
        JSON.stringify({ code: 'REGISTRY_UNAVAILABLE', message: 'Сервис временно недоступен' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (inn && inn.length >= 10) {
      return HttpResponse.json(MOCK_REGISTRY);
    }
    return new HttpResponse(
      JSON.stringify({ code: 'NOT_FOUND', message: 'Компания не найдена' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.post('/api/v1/companies', async ({ request }) => {
    const body = await request.json();
    return new HttpResponse(JSON.stringify({ ...MOCK_COMPANY, ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.put('/api/v1/companies/:companyId/financials', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  http.get('/api/v1/products', () => {
    return HttpResponse.json(MOCK_PRODUCTS);
  }),

  http.post('/api/v1/products/recommend', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      recommended: MOCK_PRODUCTS[0],
      rate: 18,
      monthlyPayment: Math.round(body.amount * 0.09),
    });
  }),

  http.get('/api/v1/applications', () => {
    return HttpResponse.json(MOCK_APPLICATIONS);
  }),

  http.post('/api/v1/applications', async ({ request }) => {
    const body = await request.json();
    return new HttpResponse(
      JSON.stringify({ ...MOCK_APPLICATIONS[0], ...body, id: `app-${Date.now()}` }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.patch('/api/v1/applications/:id', async ({ request, params }) => {
    const body = await request.json();
    return new HttpResponse(
      JSON.stringify({ ...MOCK_APPLICATIONS[0], ...body, id: params.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.post('/api/v1/applications/:id/submit', ({ params }) => {
    return HttpResponse.json({
      ...MOCK_APPLICATIONS[0],
      id: params.id,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    });
  }),

  http.get('/api/v1/applications/:id', ({ params }) => {
    return HttpResponse.json({ ...MOCK_APPLICATIONS[0], id: params.id });
  }),

  http.get('/api/v1/applications/:id/timeline', () => {
    return HttpResponse.json([
      {
        fromStatus: null,
        toStatus: 'DRAFT',
        actorType: 'CLIENT',
        reason: 'Создание черновика',
        createdAt: '2026-10-22T10:00:00Z',
      },
    ]);
  }),
];