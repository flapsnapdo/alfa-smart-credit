import { floorTo10k, formatRub, maxAnnuityAmount, monthlyPayment } from './finance';
import { CreditDecision, Grade, Offer, ProductParams, ScoringResult } from './types';

/** Все платежи по кредитам — не больше 25% выручки */
export const MAX_DTI = 0.25;

/** Поправка к ставке за рейтинг. D — не кредитуем */
const GRADE_RATE_ADJ: Record<Grade, number | null> = { A: -1, B: 0, C: 2, D: null };

export interface DecisionInput {
  scoring: ScoringResult;
  product: ProductParams;
  requestedAmount: number;
  requestedTerm: number;
  avgMonthlyRevenue: number;
  currentMonthlyPayments: number;
}

export function decide(input: DecisionInput): CreditDecision {
  const { scoring, product, requestedAmount, requestedTerm, avgMonthlyRevenue, currentMonthlyPayments } = input;
  const base: CreditDecision = { type: 'REJECT', rate: null, maxAvailableAmount: 0, offer: null, alternatives: [], reasons: [] };

  // Правило 1. Стоп-фактор → отказ
  if (scoring.stopFactors.length > 0) {
    return { ...base, reasons: scoring.stopFactors.map((s) => s.clientText) };
  }

  // Правило 2. Рейтинг D → отказ с тремя главными причинами
  const adj = GRADE_RATE_ADJ[scoring.grade];
  if (adj === null) {
    const worst = [...scoring.factors].filter((f) => f.points < 0).sort((a, b) => a.points - b.points).slice(0, 3);
    return { ...base, reasons: worst.map((f) => f.clientText) };
  }

  // Сколько клиент может платить в месяц, чтобы нагрузка была ≤ 25%
  const rate = product.baseRate + adj;
  const maxPayment = Math.floor(avgMonthlyRevenue * MAX_DTI) - currentMonthlyPayments;
  const offerOf = (amount: number, term: number): Offer => ({
    productCode: product.code, amount, term, rate,
    monthlyPayment: monthlyPayment(amount, rate, term, product.annuity),
  });

  // Доступная сумма = минимум из трёх лимитов
  const limitByProduct = product.maxAmount;
  const limitByRevenue = Math.floor(avgMonthlyRevenue * product.revenueMultiplier);
  const limitByDti = product.annuity
    ? maxAnnuityAmount(maxPayment, rate, requestedTerm)
    : Math.floor((Math.max(0, maxPayment) * 12 * 100) / rate);
  const maxAvailableAmount = floorTo10k(Math.max(0, Math.min(limitByProduct, limitByRevenue, limitByDti)));
  const withLimit = { ...base, rate, maxAvailableAmount };

  // Правило 3. Рейтинг C → к аналитику
  if (scoring.grade === 'C') {
    return { ...withLimit, type: 'MANUAL_REVIEW', reasons: ['Заявку нужно дополнительно изучить специалисту'] };
  }

  // Правило 4. Просят больше, чем можем дать → контрпредложение
  if (requestedAmount > maxAvailableAmount) {
    const options: Offer[] = [];

    // Вариант А: та же сумма, но на больший срок (ищем ближайший срок, кратный 6 мес)
    if (product.annuity && requestedAmount <= Math.min(limitByProduct, limitByRevenue)) {
      for (let t = Math.ceil((requestedTerm + 1) / 6) * 6; t <= product.maxTerm; t += 6) {
        if (monthlyPayment(requestedAmount, rate, t, true) <= maxPayment) {
          options.push(offerOf(requestedAmount, t));
          break;
        }
      }
    }
    // Вариант Б: меньшая сумма на тот же срок
    if (maxAvailableAmount >= product.minAmount) {
      options.push(offerOf(maxAvailableAmount, requestedTerm));
    }

    if (options.length === 0) {
      return { ...withLimit, reasons: ['Запрошенная сумма слишком велика для текущей выручки и нагрузки'] };
    }
    const loadPct = Math.round((currentMonthlyPayments / avgMonthlyRevenue) * 100);
    return {
      ...withLimit, type: 'COUNTER_OFFER', offer: options[0], alternatives: options.slice(1),
      reasons: [`Не можем одобрить ${formatRub(requestedAmount)} на ${requestedTerm} мес: платежи по другим кредитам уже занимают ${loadPct}% выручки`],
    };
  }

  // Правило 5. Сумма выше лимита авто-решения → к аналитику
  if (requestedAmount > product.autoDecisionLimit) {
    return {
      ...withLimit, type: 'MANUAL_REVIEW', offer: offerOf(requestedAmount, requestedTerm),
      reasons: ['Сумма выше лимита автоматического решения, заявку посмотрит специалист'],
    };
  }

  // Правило 6. Всё хорошо → одобрение
  return { ...withLimit, type: 'APPROVE', offer: offerOf(requestedAmount, requestedTerm) };
}
