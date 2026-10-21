import { describe, expect, it } from 'vitest';
import { DEFAULT_PRODUCTS } from '../src/products';
import { score } from '../src/scoring';

const M = 1_000_000_00; // 1 млн ₽ в копейках
const K = 1_000_00;     // 1 тыс ₽ в копейках
const product = (code: string) => DEFAULT_PRODUCTS.find((p) => p.code === code)!;

describe('score', () => {
  it('«Северный склад» — 840 баллов, рейтинг A', () => {
    const r = score({
      businessAgeMonths: 72, companyStatus: 'ACTIVE',
      avgMonthlyRevenue: 4 * M, revenueLast6m: 25.2 * M, revenuePrev6m: 22.5 * M,
      currentMonthlyPayments: 100 * K, maxDelinquencyDays12m: 0, currentDelinquencyDays: 0,
      hasClosedLoans: true, inquiries30d: 1, industryRisk: 'LOW', hasTaxDebt: false,
    }, product('WORKING_CAPITAL'));
    expect(r.score).toBe(840);
    expect(r.grade).toBe('A');
    expect(r.stopFactors).toHaveLength(0);
  });

  it('ИП Козлов — 270 баллов, рейтинг D', () => {
    const r = score({
      businessAgeMonths: 8, companyStatus: 'ACTIVE',
      avgMonthlyRevenue: 400 * K, revenueLast6m: 2 * M, revenuePrev6m: 2.7 * M,
      currentMonthlyPayments: 0, maxDelinquencyDays12m: 60, currentDelinquencyDays: 0,
      hasClosedLoans: false, inquiries30d: 5, industryRisk: 'LOW', hasTaxDebt: true,
    }, product('OVERDRAFT'));
    expect(r.score).toBe(270);
    expect(r.grade).toBe('D');
  });

  it('«Ромашка» — стоп-фактор: компания ликвидирована', () => {
    const r = score({
      businessAgeMonths: 40, companyStatus: 'LIQUIDATED',
      avgMonthlyRevenue: 1 * M, revenueLast6m: 6 * M, revenuePrev6m: 6 * M,
      currentMonthlyPayments: 0, maxDelinquencyDays12m: 0, currentDelinquencyDays: 0,
      hasClosedLoans: false, inquiries30d: 0, industryRisk: 'LOW', hasTaxDebt: false,
    }, product('WORKING_CAPITAL'));
    expect(r.stopFactors[0].code).toBe('SF_COMPANY_INACTIVE');
  });
});