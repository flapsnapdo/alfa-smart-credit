import Fastify from 'fastify';
import { randomInt, randomUUID } from 'node:crypto';
import data from '@alfa/shared/demo-companies.json' with { type: 'json' };

const app = Fastify({ logger: true });

// Словарь «ИНН → компания» для быстрого поиска
const byInn = new Map(data.companies.map((c) => [c.inn, c]));
const FAIL_INN = '0000000000';

// ── Проверка, что сервис жив ─────────────────────────────
app.get('/health', async () => {
  return { status: 'ok' };
});

// ── ЕГРЮЛ / ЕГРИП ────────────────────────────────────────
app.get('/registry/:inn', async (request, reply) => {
  const { inn } = request.params;
  if (inn === FAIL_INN) {
    return reply.code(503).send({ code: 'SERVICE_UNAVAILABLE', message: 'Реестр временно недоступен' });
  }
  const c = byInn.get(inn);
  if (!c) {
    return reply.code(404).send({ code: 'NOT_FOUND', message: `Организация с ИНН ${inn} не найдена` });
  }
  return {
    inn: c.inn, ogrn: c.ogrn, type: c.type, name: c.name, status: c.status,
    registeredAt: c.registeredAt, okved: c.okved, okvedName: c.okvedName,
    address: c.address, directorName: c.directorName,
  };
});

// ── Налоговая (ФНС «Прозрачный бизнес») ──────────────────   ← шаг 3.1
app.get('/tax/:inn', async (request, reply) => {
  const { inn } = request.params;
  if (inn === FAIL_INN) {
    return reply.code(503).send({ code: 'SERVICE_UNAVAILABLE', message: 'Налоговая временно недоступна' });
  }
  const c = byInn.get(inn);
  if (!c) {
    return reply.code(404).send({ code: 'NOT_FOUND', message: `ИНН ${inn} не найден` });
  }
  return { inn: c.inn, ...c.tax };
});

// ── Бюро кредитных историй ───────────────────────────────   ← шаг 3.2
app.post('/bki/report', async (request, reply) => {
  const { inn, consent } = request.body ?? {};
  if (!consent) {
    return reply.code(403).send({ code: 'NO_CONSENT', message: 'Нет согласия на запрос кредитной истории' });
  }
  if (inn === FAIL_INN) {
    return reply.code(503).send({ code: 'SERVICE_UNAVAILABLE', message: 'БКИ временно недоступно' });
  }
  const c = byInn.get(inn);
  if (!c) {
    return reply.code(404).send({ code: 'NOT_FOUND', message: `ИНН ${inn} не найден` });
  }
  const b = c.bki;
  return {
    inn: c.inn,
    activeLoans: b.activeLoans,
    totalMonthlyPayments: b.activeLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0),
    hasClosedLoans: b.closedLoans > 0,
    maxDelinquencyDays12m: b.maxDelinquencyDays12m,
    currentDelinquencyDays: b.currentDelinquencyDays,
    inquiries30d: b.inquiries30d,
  };
});

// ── Подписание ПЭП и выдача ──────────────────────────────   ← шаг 3.3
const signRequests = new Map(); // requestId → код

app.post('/sign/request', async () => {
  const requestId = randomUUID();
  const code = String(randomInt(1000, 10000));
  signRequests.set(requestId, code);
  return { requestId, demoCode: code };
});

app.post('/sign/confirm', async (request, reply) => {
  const { requestId, code } = request.body ?? {};
  if (signRequests.get(requestId) !== String(code)) {
    return reply.code(422).send({ code: 'INVALID_CODE', message: 'Неверный код подтверждения' });
  }
  signRequests.delete(requestId);
  return { signed: true, signedAt: new Date().toISOString() };
});

app.post('/payout', async (request) => {
  return {
    payoutId: randomUUID(),
    amount: request.body?.amount ?? null,
    status: 'CREDITED',
    creditedAt: new Date().toISOString(),
  };
});

// ── Запуск ───────────────────────────────────────────────
const port = Number(process.env.PORT ?? 4001);
app.listen({ port, host: '0.0.0.0' });