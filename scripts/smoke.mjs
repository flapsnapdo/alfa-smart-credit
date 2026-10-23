// Сквозная проверка: от каждой демо-компании подаём заявку и ждём решения конвейера.
// Запуск: node scripts/smoke.mjs   (API и mock-external должны быть запущены)

const API = process.env.API_URL ?? 'http://127.0.0.1:3000/api/v1';
const PASSWORD = 'Demo2026!';
const FINAL = ['APPROVED', 'COUNTER_OFFER', 'MANUAL_REVIEW', 'REJECTED'];

// Суммы — в рублях, в API отправляем копейки
const SCENARIOS = [
  { user: 'igor@demo.ru', company: 'Северный склад', product: 'WORKING_CAPITAL', purpose: 'WORKING_CAPITAL', amount: 1_500_000, term: 24, expect: 'APPROVED' },
  { user: 'anna@demo.ru', company: 'Смирнова', product: 'EQUIPMENT', purpose: 'EQUIPMENT', amount: 1_000_000, term: 36, expect: 'APPROVED' },
  { user: 'olga@demo.ru', company: 'Хлебный дом', product: 'EQUIPMENT', purpose: 'EQUIPMENT', amount: 900_000, term: 24, expect: 'COUNTER_OFFER' },
  { user: 'olga@demo.ru', company: 'СтройМастер', product: 'WORKING_CAPITAL', purpose: 'WORKING_CAPITAL', amount: 2_000_000, term: 24, expect: 'MANUAL_REVIEW' },
  { user: 'olga@demo.ru', company: 'Агротех', product: 'EQUIPMENT', purpose: 'EQUIPMENT', amount: 8_000_000, term: 60, expect: 'MANUAL_REVIEW' },
  { user: 'kozlov@demo.ru', company: 'Козлов', product: 'OVERDRAFT', purpose: 'CASH_GAP', amount: 300_000, term: 12, expect: 'REJECTED' },
  { user: 'kozlov@demo.ru', company: 'Ромашка', product: 'OVERDRAFT', purpose: 'CASH_GAP', amount: 500_000, term: 6, expect: 'REJECTED' },
];

async function api(path, { token, body } = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error(`API не отвечает (${API}) — сервер запущен?`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(data.message ?? data)}`);
  return data;
}

const rub = (kop) => `${Math.round(kop / 100).toLocaleString('ru-RU')} ₽`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runScenario(s) {
  try {
    return await check(s);
  } catch (e) {
    console.log(`❌ ${s.company}: ${e.message}`);
    return false;
  }
}

async function check(s) {
  const { token } = await api('/auth/login', { body: { email: s.user, password: PASSWORD } });
  const me = await api('/me', { token });
  const company = me.companies.find((c) => c.name.includes(s.company));

  let app = await api('/applications', {
    token,
    body: { companyId: company.id, productCode: s.product, purpose: s.purpose, amount: s.amount * 100, term: s.term },
  });
  app = await api(`/applications/${app.id}/submit`, { token, body: { bkiConsent: true } });

  // Опрашиваем статус раз в секунду, как будет делать фронтенд
  for (let i = 0; i < 30 && !FINAL.includes(app.status); i++) {
    await sleep(1000);
    app = await api(`/applications/${app.id}`, { token });
  }

  const d = app.decision;
  const offer = d?.offer ? `${rub(d.offer.amount)} на ${d.offer.term} мес под ${d.offer.rate}%` : '';
  const alt = d?.alternatives?.length ? ` или ${rub(d.alternatives[0].amount)} на ${d.alternatives[0].term} мес` : '';
  const reasons = d?.reasons?.length ? ` · ${d.reasons.join('; ')}` : '';
  let ok = app.status === s.expect;

  // Одобрено или контрпредложение — доводим до выдачи: принять → подписать кодом из кабинета
  let issued = '';
  if (ok && ['APPROVED', 'COUNTER_OFFER'].includes(app.status)) {
    const contract = await api(`/applications/${app.id}/accept`, { token, body: { offerIndex: 0 } });
    const signed = await api(`/applications/${app.id}/sign`, { token, body: { code: contract.demoSignCode } });
    ok = signed.status === 'ISSUED';
    issued = ` → ${signed.status} (${signed.number})`;
  }

  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${company.name}: ${app.status} (ждали ${s.expect}) ${offer}${alt}${reasons}${issued}`);
  return ok;
}

const results = await Promise.all(SCENARIOS.map(runScenario));
const passed = results.filter(Boolean).length;
console.log(`\nСовпало ${passed} из ${SCENARIOS.length}`);
process.exit(passed === SCENARIOS.length ? 0 : 1);