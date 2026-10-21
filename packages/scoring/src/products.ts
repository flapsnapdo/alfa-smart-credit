import { ProductParams } from './types';

const RUB = 100; // копеек в рубле

export const DEFAULT_PRODUCTS: ProductParams[] = [
  { code: 'OVERDRAFT', name: 'Овердрафт',
    minAmount: 100_000 * RUB, maxAmount: 3_000_000 * RUB, minTerm: 1, maxTerm: 12,
    baseRate: 19, revenueMultiplier: 0.5, minBusinessAgeMonths: 6,
    autoDecisionLimit: 1_000_000 * RUB, annuity: false },
  { code: 'WORKING_CAPITAL', name: 'Оборотный кредит',
    minAmount: 300_000 * RUB, maxAmount: 10_000_000 * RUB, minTerm: 6, maxTerm: 36,
    baseRate: 18, revenueMultiplier: 4, minBusinessAgeMonths: 12,
    autoDecisionLimit: 3_000_000 * RUB, annuity: true },
  { code: 'EQUIPMENT', name: 'Кредит на оборудование',
    minAmount: 500_000 * RUB, maxAmount: 20_000_000 * RUB, minTerm: 12, maxTerm: 60,
    baseRate: 16, revenueMultiplier: 6, minBusinessAgeMonths: 12,
    autoDecisionLimit: 5_000_000 * RUB, annuity: true },
];

/** Отраслевой риск по первым двум цифрам ОКВЭД */
export function industryRiskByOkved(okved: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const p = okved.slice(0, 2);
  if (['46', '47', '62', '69', '70'].includes(p)) return 'LOW';   // торговля, IT, услуги
  if (['41', '42', '43', '55', '79'].includes(p)) return 'HIGH';  // стройка, гостиницы, туризм
  return 'MEDIUM';
}