import { Factor, Grade, ProductParams, ScoringInput, ScoringResult, StopFactor } from './types';

export const RULES_VERSION = 'v1';
export const BASE_SCORE = 600;

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

/** Стоп-факторы — сразу отказ, баллы уже неважны */
export function checkStopFactors(input: ScoringInput, product: ProductParams): StopFactor[] {
  const stops: StopFactor[] = [];
  if (input.companyStatus !== 'ACTIVE') {
    stops.push({ code: 'SF_COMPANY_INACTIVE', clientText: 'Компания не ведёт деятельность по данным реестра' });
  }
  if (input.currentDelinquencyDays > 90) {
    stops.push({ code: 'SF_CURRENT_DELINQUENCY', clientText: 'Есть непогашенная длительная просрочка' });
  }
  if (input.businessAgeMonths < product.minBusinessAgeMonths) {
    stops.push({ code: 'SF_TOO_YOUNG', clientText: 'Бизнес работает меньше, чем требуется для продукта' });
  }
  return stops;
}

/** 8 факторов, каждый даёт + или − баллы */
export function computeFactors(input: ScoringInput): Factor[] {
  const f: Factor[] = [];

  const age = input.businessAgeMonths;
  f.push({
    code: 'BUSINESS_AGE', value: `${age} мес`,
    points: age < 12 ? -60 : age <= 36 ? 0 : 40,
    analystText: '< 12 мес −60, 12–36 мес 0, > 36 мес +40',
    clientText: age < 12 ? 'Бизнес работает меньше года' : age > 36 ? 'Бизнес работает больше трёх лет' : 'Бизнес работает от года до трёх лет',
  });

  const dyn = input.revenuePrev6m > 0 ? input.revenueLast6m / input.revenuePrev6m - 1 : 0;
  f.push({
    code: 'REVENUE_DYNAMICS', value: pct(dyn),
    points: dyn > 0.1 ? 40 : dyn >= -0.1 ? 0 : dyn >= -0.2 ? -40 : -80,
    analystText: 'Рост > 10% +40, ±10% 0, падение 10–20% −40, > 20% −80',
    clientText: dyn > 0.1 ? 'Выручка растёт' : dyn >= -0.1 ? 'Выручка стабильна' : 'Выручка снизилась за полгода',
  });

  const load = input.avgMonthlyRevenue > 0 ? input.currentMonthlyPayments / input.avgMonthlyRevenue : 1;
  f.push({
    code: 'DEBT_LOAD', value: pct(load),
    points: load < 0.1 ? 60 : load <= 0.2 ? 0 : load <= 0.25 ? -60 : -150,
    analystText: 'Текущие платежи / выручка: < 10% +60, 10–20% 0, 20–25% −60, > 25% −150',
    clientText: load < 0.1 ? 'Низкая долговая нагрузка' : `Платежи по кредитам занимают ${pct(load)} выручки`,
  });

  const d = input.maxDelinquencyDays12m;
  f.push({
    code: 'DELINQUENCY_12M', value: d === 0 ? 'нет' : `до ${d} дн`,
    points: d === 0 ? 60 : d <= 30 ? -50 : -150,
    analystText: 'Нет просрочек +60, до 30 дн −50, 31–90 дн −150',
    clientText: d === 0 ? 'Нет просрочек' : d <= 30 ? 'Были небольшие просрочки' : 'Были серьёзные просрочки',
  });

  f.push({
    code: 'CREDIT_HISTORY', value: input.hasClosedLoans ? 'есть' : 'нет',
    points: input.hasClosedLoans ? 40 : 0,
    analystText: 'Закрытые кредиты без просрочек +40',
    clientText: input.hasClosedLoans ? 'Есть положительная кредитная история' : 'Кредитной истории пока нет',
  });

  f.push({
    code: 'BKI_INQUIRIES_30D', value: `${input.inquiries30d}`,
    points: input.inquiries30d > 3 ? -40 : 0,
    analystText: 'Запросов в БКИ за 30 дней > 3: −40',
    clientText: input.inquiries30d > 3 ? 'Много обращений за кредитами за месяц' : 'Обычная частота обращений',
  });

  const ind = input.industryRisk;
  f.push({
    code: 'INDUSTRY_RISK', value: ind,
    points: ind === 'LOW' ? 0 : ind === 'MEDIUM' ? -20 : -40,
    analystText: 'Риск отрасли: низкий 0, средний −20, высокий −40',
    clientText: ind === 'HIGH' ? 'Отрасль с повышенным риском' : ind === 'MEDIUM' ? 'Отрасль со средним уровнем риска' : 'Отрасль с низким риском',
  });

  f.push({
    code: 'TAX_DEBT', value: input.hasTaxDebt ? 'есть' : 'нет',
    points: input.hasTaxDebt ? -60 : 0,
    analystText: 'Налоговая задолженность −60',
    clientText: input.hasTaxDebt ? 'Есть задолженность по налогам' : 'Нет задолженности по налогам',
  });

  return f;
}

export function gradeOf(score: number): Grade {
  if (score >= 700) return 'A';
  if (score >= 600) return 'B';
  if (score >= 500) return 'C';
  return 'D';
}

/** Главная функция: стоп-факторы + сумма баллов + рейтинг */
export function score(input: ScoringInput, product: ProductParams): ScoringResult {
  const stopFactors = checkStopFactors(input, product);
  const factors = computeFactors(input);
  const raw = BASE_SCORE + factors.reduce((sum, x) => sum + x.points, 0);
  const value = Math.max(0, Math.min(1000, raw));   // держим в диапазоне 0–1000
  return { score: value, grade: gradeOf(value), factors, stopFactors, rulesVersion: RULES_VERSION };
}
