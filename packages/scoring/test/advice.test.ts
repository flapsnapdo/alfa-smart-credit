import { describe, expect, it } from 'vitest';
import { advise, DEFAULT_PRODUCTS, ScoringInput } from '../src';

const M = 1_000_000_00;
const K = 1_000_00;
const ok = { companyStatus: 'ACTIVE' as const, currentDelinquencyDays: 0 };

function run(input: ScoringInput, code: string, amount: number, term: number) {
  const product = DEFAULT_PRODUCTS.find((p) => p.code === code)!;
  return advise({ input, product, requestedAmount: amount, requestedTerm: term, products: DEFAULT_PRODUCTS });
}
const codes = (a: ReturnType<typeof run>) => a.hints.map((h) => h.code);

describe('что можно улучшить', () => {
  it('«Хлебный дом» — сколько снизить платежи, чтобы одобрили всю сумму', () => {
    const a = run({ ...ok, businessAgeMonths: 60, avgMonthlyRevenue: 800 * K, revenueLast6m: 5.1 * M, revenuePrev6m: 4.4 * M,
      currentMonthlyPayments: 160 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 1,
      industryRisk: 'MEDIUM', hasTaxDebt: false }, 'EQUIPMENT', 900 * K, 24);
    const hint = a.hints.find((h) => h.code === 'REDUCE_PAYMENTS_FOR_FULL_AMOUNT');
    expect(hint?.text.replace(/\s/g, ' ')).toContain('3 700 ₽');   // toLocaleString ставит неразрывный пробел
    expect(hint?.offer).toMatchObject({ amount: 900 * K, term: 24 });
  });

  it('ИП Козлов — сначала то, что даёт больше всего баллов', () => {
    const a = run({ ...ok, businessAgeMonths: 8, avgMonthlyRevenue: 400 * K, revenueLast6m: 2 * M, revenuePrev6m: 2.7 * M,
      currentMonthlyPayments: 0, maxDelinquencyDays12m: 60, hasClosedLoans: false, inquiries30d: 5,
      industryRisk: 'LOW', hasTaxDebt: true }, 'OVERDRAFT', 300 * K, 12);
    expect(a.grade).toBe('D');
    expect(codes(a)).toEqual(['NO_NEW_DELINQUENCY', 'PAY_TAX_DEBT', 'WAIT_BUSINESS_AGE', 'FEWER_INQUIRIES']);
    expect(a.hints[0].points).toBe(210);
    expect(a.outlook).not.toBe('REJECT');
  });

  it('«СтройМастер» — без новых просрочек решение станет автоматическим одобрением', () => {
    const a = run({ ...ok, businessAgeMonths: 24, avgMonthlyRevenue: 2 * M, revenueLast6m: 11 * M, revenuePrev6m: 13 * M,
      currentMonthlyPayments: 50 * K, maxDelinquencyDays12m: 20, hasClosedLoans: false, inquiries30d: 2,
      industryRisk: 'HIGH', hasTaxDebt: false }, 'WORKING_CAPITAL', 2 * M, 24);
    expect(codes(a)).toEqual(['NO_NEW_DELINQUENCY']);
    expect(a.outlook).toBe('APPROVE');
  });

  it('«Агротех» — сколько одобрим без ожидания специалиста', () => {
    const a = run({ ...ok, businessAgeMonths: 120, avgMonthlyRevenue: 3 * M, revenueLast6m: 19 * M, revenuePrev6m: 17 * M,
      currentMonthlyPayments: 200 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 0,
      industryRisk: 'MEDIUM', hasTaxDebt: false }, 'EQUIPMENT', 8 * M, 60);
    expect(a.hints.find((h) => h.code === 'AUTO_DECISION_AMOUNT')?.offer?.amount).toBe(5 * M);
  });

  it('«Северный склад» — одобрено, показываем запас', () => {
    const a = run({ ...ok, businessAgeMonths: 72, avgMonthlyRevenue: 4 * M, revenueLast6m: 25.2 * M, revenuePrev6m: 22.5 * M,
      currentMonthlyPayments: 100 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 1,
      industryRisk: 'LOW', hasTaxDebt: false }, 'WORKING_CAPITAL', 1.5 * M, 24);
    expect(a.weaknesses).toHaveLength(0);
    expect(a.hints.find((h) => h.code === 'MORE_AVAILABLE')?.offer?.amount).toBe(3 * M);
  });

  it('«Ромашка» — стоп-фактор, который клиент изменить не может: без подсказок', () => {
    const a = run({ ...ok, companyStatus: 'LIQUIDATED', businessAgeMonths: 40, avgMonthlyRevenue: 1 * M, revenueLast6m: 6 * M,
      revenuePrev6m: 6 * M, currentMonthlyPayments: 0, maxDelinquencyDays12m: 0, hasClosedLoans: false, inquiries30d: 0,
      industryRisk: 'LOW', hasTaxDebt: false }, 'OVERDRAFT', 500 * K, 6);
    expect(a.weaknesses).toEqual(['Компания не ведёт деятельность по данным реестра']);
    expect(a.hints).toHaveLength(0);
  });

  it('молодой бизнес — когда подавать снова и какой продукт доступен уже сейчас', () => {
    const a = run({ ...ok, businessAgeMonths: 8, avgMonthlyRevenue: 1 * M, revenueLast6m: 6 * M, revenuePrev6m: 5 * M,
      currentMonthlyPayments: 0, maxDelinquencyDays12m: 0, hasClosedLoans: false, inquiries30d: 0,
      industryRisk: 'LOW', hasTaxDebt: false }, 'WORKING_CAPITAL', 1 * M, 12);
    expect(codes(a)).toEqual(['WAIT_BUSINESS_AGE', 'OTHER_PRODUCT']);
    expect(a.hints[1].text).toContain('Овердрафт');
  });
});
