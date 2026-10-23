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
];