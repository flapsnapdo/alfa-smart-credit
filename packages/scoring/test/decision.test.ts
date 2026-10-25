import { describe, expect, it } from 'vitest';
import { decide, DEFAULT_PRODUCTS, score, ScoringInput } from '../src';

const M = 1_000_000_00;
const K = 1_000_00;
const ok = { companyStatus: 'ACTIVE' as const, currentDelinquencyDays: 0 };

function run(input: ScoringInput, code: string, amount: number, term: number) {
  const product = DEFAULT_PRODUCTS.find((p) => p.code === code)!;
  const scoring = score(input, product);
  return decide({
    scoring, product, requestedAmount: amount, requestedTerm: term,
    avgMonthlyRevenue: input.avgMonthlyRevenue, currentMonthlyPayments: input.currentMonthlyPayments,
  });
}

describe('кредитные правила', () => {
  it('«Северный склад» — одобрение под 17%', () => {
    const d = run({ ...ok, businessAgeMonths: 72, avgMonthlyRevenue: 4 * M, revenueLast6m: 25.2 * M, revenuePrev6m: 22.5 * M,
      currentMonthlyPayments: 100 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 1,
      industryRisk: 'LOW', hasTaxDebt: false }, 'WORKING_CAPITAL', 1.5 * M, 24);
    expect(d.type).toBe('APPROVE');
    expect(d.offer?.rate).toBe(17);
  });

  it('«Хлебный дом» — контрпредложение: 900 000 ₽ на 30 мес или 820 000 ₽ на 24 мес', () => {
    const d = run({ ...ok, businessAgeMonths: 60, avgMonthlyRevenue: 800 * K, revenueLast6m: 5.1 * M, revenuePrev6m: 4.4 * M,
      currentMonthlyPayments: 160 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 1,
      industryRisk: 'MEDIUM', hasTaxDebt: false }, 'EQUIPMENT', 900 * K, 24);
    expect(d.type).toBe('COUNTER_OFFER');
    expect(d.offer).toMatchObject({ amount: 900 * K, term: 30 });
    expect(d.alternatives[0]).toMatchObject({ amount: 820 * K, term: 24 });
  });

  it('«СтройМастер» — рейтинг C, к аналитику', () => {
    const d = run({ ...ok, businessAgeMonths: 24, avgMonthlyRevenue: 2 * M, revenueLast6m: 11 * M, revenuePrev6m: 13 * M,
      currentMonthlyPayments: 50 * K, maxDelinquencyDays12m: 20, hasClosedLoans: false, inquiries30d: 2,
      industryRisk: 'HIGH', hasTaxDebt: false }, 'WORKING_CAPITAL', 2 * M, 24);
    expect(d.type).toBe('MANUAL_REVIEW');
  });

  it('«Агротех» — 8 млн выше лимита авто-решения, к аналитику', () => {
    const d = run({ ...ok, businessAgeMonths: 120, avgMonthlyRevenue: 3 * M, revenueLast6m: 19 * M, revenuePrev6m: 17 * M,
      currentMonthlyPayments: 200 * K, maxDelinquencyDays12m: 0, hasClosedLoans: true, inquiries30d: 0,
      industryRisk: 'MEDIUM', hasTaxDebt: false }, 'EQUIPMENT', 8 * M, 60);
    expect(d.type).toBe('MANUAL_REVIEW');
  });

  it('ИП Козлов — отказ с тремя причинами', () => {
    const d = run({ ...ok, businessAgeMonths: 8, avgMonthlyRevenue: 400 * K, revenueLast6m: 2 * M, revenuePrev6m: 2.7 * M,
      currentMonthlyPayments: 0, maxDelinquencyDays12m: 60, hasClosedLoans: false, inquiries30d: 5,
      industryRisk: 'LOW', hasTaxDebt: true }, 'OVERDRAFT', 300 * K, 12);
    expect(d.type).toBe('REJECT');
    expect(d.reasons).toHaveLength(3);
  });
});