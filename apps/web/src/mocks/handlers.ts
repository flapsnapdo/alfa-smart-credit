import { http, HttpResponse } from 'msw';

const MOCK_REGISTRY_DB: Record<string, any> = {
  '7707083893': {
    inn: '7707083893',
    ogrn: '1027700132195',
    type: 'LLC',
    name: 'ПАО "Сбербанк"',
    status: 'ACTIVE',
    registeredAt: '1991-06-20',
    okved: '64.19 — Денежное посредничество прочее',
    address: 'г. Москва, ул. Вавилова, д. 19',
    directorName: 'Греф Герман Оскарович',
  },
  '7707083894': {
    inn: '7707083894',
    ogrn: '1027700132196',
    type: 'LLC',
    name: 'ООО "Северный склад"',
    status: 'ACTIVE',
    registeredAt: '2018-03-15',
    okved: '46.90 — Торговля оптовая неспециализированная',
    address: 'г. Москва, ул. Вавилова, д. 19',
    directorName: 'Иванов Иван Иванович',
  },
  '7707083895': {
    inn: '7707083895',
    ogrn: '1027700132197',
    type: 'LLC',
    name: 'ООО "ТехноПром"',
    status: 'ACTIVE',
    registeredAt: '2015-07-10',
    okved: '28.99 — Производство машин и оборудования',
    address: 'г. Санкт-Петербург, пр. Обуховской Обороны, д. 120',
    directorName: 'Петров Сергей Владимирович',
  },
};

export const handlers = [
  // Auth login
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({
      token: 'demo-token-client',
      user: { id: 'user-1', email: 'igor@demo.ru', role: 'CLIENT', name: 'Иван Иванов' },
    });
  }),

  // Me
  http.get('*/api/v1/me', () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'igor@demo.ru',
      role: 'CLIENT',
      name: 'Иван Иванов',
    });
  }),

  // Products
  http.get('*/api/v1/products', () => {
    return HttpResponse.json([
      { code: 'working-capital', name: 'Пополнение оборотных средств', rate: 18 },
      { code: 'equipment', name: 'Покупка оборудования', rate: 15 },
      { code: 'expansion', name: 'Расширение бизнеса', rate: 16 },
    ]);
  }),

  // Registry lookup
// Registry lookup
http.get('*/api/v1/registry/lookup', ({ request }) => {
  const url = new URL(request.url);
  const inn = url.searchParams.get('inn');

  if (inn === '0000000000') {
    return new HttpResponse(
      JSON.stringify({ code: 'REGISTRY_UNAVAILABLE', message: 'Сервис временно недоступен' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (inn && MOCK_REGISTRY_DB[inn]) {
    return HttpResponse.json(MOCK_REGISTRY_DB[inn]);
  }

  return new HttpResponse(
    JSON.stringify({ code: 'NOT_FOUND', message: 'Компания не найдена в реестре' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}),
  // Companies
http.post('*/api/v1/companies', ({ request }) => {
  return request.json().then((body: any) => {
    const companyName = body?.inn === '7707083893' 
      ? 'ПАО "Сбербанк"' 
      : body?.inn === '7707083894' 
        ? 'ООО "Северный склад"' 
        : 'ООО "ТехноПром"';
    
    return HttpResponse.json({
      id: 'company-1',
      ...body,
      name: companyName,
    });
  });
}),
  http.put('*/api/v1/companies/:id/financials', ({ params }) => {
    return HttpResponse.json({ id: params.id, status: 'updated' });
  }),

  // Applications
  http.get('*/api/v1/applications', () => {
    return HttpResponse.json([]);
  }),

  http.post('*/api/v1/applications', () => {
    return HttpResponse.json({
      id: 'app-1',
      number: 'ЗК-2026-000123',
      status: 'SUBMITTED',
    });
  }),

  http.get('*/api/v1/applications/:id', ({ params }) => {
    const elapsed = Date.now() % 30000;
    let status = 'SUBMITTED';
    if (elapsed > 10000) status = 'UNDER_REVIEW';
    if (elapsed > 20000) status = 'APPROVED';

    return HttpResponse.json({
      id: params.id,
      number: 'ЗК-2026-000123',
      status,
      amount: 5000000,
      term: 12,
      rate: 18,
      monthlyPayment: 458333,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post('*/api/v1/applications/:id/submit', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      number: 'ЗК-2026-000123',
      status: 'SUBMITTED',
    });
  }),

    // ============ АНАЛИТИК ============
  
  // Список заявок для аналитика
  http.get('*/api/v1/analyst/applications', () => {
    return HttpResponse.json([
      {
        id: 'app-1',
        number: 'ЗК-2026-000123',
        companyName: 'ПАО "Сбербанк"',
        inn: '7707083893',
        amount: 5000000,
        term: 12,
        purpose: 'working-capital',
        status: 'SUBMITTED',
        createdAt: '2026-10-20T10:00:00Z',
        score: 78,
      },
      {
        id: 'app-2',
        number: 'ЗК-2026-000124',
        companyName: 'ООО "Северный склад"',
        inn: '7707083894',
        amount: 12000000,
        term: 24,
        purpose: 'equipment',
        status: 'UNDER_REVIEW',
        createdAt: '2026-10-21T14:30:00Z',
        score: 65,
      },
      {
        id: 'app-3',
        number: 'ЗК-2026-000125',
        companyName: 'ООО "ТехноПром"',
        inn: '7707083895',
        amount: 3000000,
        term: 6,
        purpose: 'inventory',
        status: 'SUBMITTED',
        createdAt: '2026-10-22T09:15:00Z',
        score: 82,
      },
      {
        id: 'app-4',
        number: 'ЗК-2026-000126',
        companyName: 'ООО "СтройМастер"',
        inn: '7707083896',
        amount: 25000000,
        term: 36,
        purpose: 'expansion',
        status: 'SUBMITTED',
        createdAt: '2026-10-23T11:00:00Z',
        score: 55,
      },
    ]);
  }),

  // Карточка заявки для аналитика
  http.get('*/api/v1/analyst/applications/:id', ({ params }) => {
    const id = params.id as string;
    const applications: Record<string, any> = {
      'app-1': {
        id: 'app-1',
        number: 'ЗК-2026-000123',
        companyName: 'ПАО "Сбербанк"',
        inn: '7707083893',
        ogrn: '1027700132195',
        amount: 5000000,
        term: 12,
        rate: 18,
        purpose: 'working-capital',
        status: 'SUBMITTED',
        createdAt: '2026-10-20T10:00:00Z',
        score: 78,
        directorName: 'Греф Герман Оскарович',
        revenue: 150000000,
        profit: 25000000,
        debt: 10000000,
        employees: 120,
        address: 'г. Москва, ул. Вавилова, д. 19',
      },
      'app-2': {
        id: 'app-2',
        number: 'ЗК-2026-000124',
        companyName: 'ООО "Северный склад"',
        inn: '7707083894',
        ogrn: '1027700132196',
        amount: 12000000,
        term: 24,
        rate: 18,
        purpose: 'equipment',
        status: 'UNDER_REVIEW',
        createdAt: '2026-10-21T14:30:00Z',
        score: 65,
        directorName: 'Иванов Иван Иванович',
        revenue: 45000000,
        profit: 5000000,
        debt: 20000000,
        employees: 35,
        address: 'г. Москва, ул. Вавилова, д. 19',
      },
      'app-3': {
        id: 'app-3',
        number: 'ЗК-2026-000125',
        companyName: 'ООО "ТехноПром"',
        inn: '7707083895',
        ogrn: '1027700132197',
        amount: 3000000,
        term: 6,
        rate: 18,
        purpose: 'inventory',
        status: 'SUBMITTED',
        createdAt: '2026-10-22T09:15:00Z',
        score: 82,
        directorName: 'Петров Сергей Владимирович',
        revenue: 80000000,
        profit: 12000000,
        debt: 5000000,
        employees: 60,
        address: 'г. Санкт-Петербург, пр. Обуховской Обороны, д. 120',
      },
      'app-4': {
        id: 'app-4',
        number: 'ЗК-2026-000126',
        companyName: 'ООО "СтройМастер"',
        inn: '7707083896',
        ogrn: '1027700132198',
        amount: 25000000,
        term: 36,
        rate: 18,
        purpose: 'expansion',
        status: 'SUBMITTED',
        createdAt: '2026-10-23T11:00:00Z',
        score: 55,
        directorName: 'Сидоров Алексей Петрович',
        revenue: 200000000,
        profit: 15000000,
        debt: 80000000,
        employees: 200,
        address: 'г. Москва, ул. Ленина, д. 5',
      },
    };

    return HttpResponse.json(applications[id] || applications['app-1']);
  }),

  // Решение аналитика
  http.patch('*/api/v1/analyst/applications/:id/decision', async ({ request }) => {
    const body: any = await request.json();
    return HttpResponse.json({
      id: 'app-1',
      decision: body.decision,
      message: 'Решение принято',
    });
  }),
];