import { decide, MAX_DTI } from './decision';
import { formatRub, monthlyPayment } from './finance';
import { score } from './scoring';
import { DecisionType, Grade, Offer, ProductParams, ScoringInput } from './types';

/** Подсказка клиенту: что можно сделать, чтобы условия стали лучше */
export interface Hint {
  code: string;
  text: string;
  points?: number;   // на сколько баллов вырастет оценка
  offer?: Offer;     // какое предложение станет доступно
}

export interface Advice {
  score: number;
  grade: Grade;
  strengths: string[];            // что говорит в пользу клиента
  weaknesses: string[];           // что снижает оценку
  hints: Hint[];                  // что можно сделать
  outlook: DecisionType | null;   // каким было бы решение, если выполнить подсказки по баллам
}

export interface AdviceInput {
  input: ScoringInput;
  product: ProductParams;
  requestedAmount: number;
  requestedTerm: number;
  products?: ProductParams[];     // все продукты банка — чтобы предложить другой
}

/** Что клиент может изменить сам и как это выглядит во входных данных скоринга */
interface Fix {
  code: string;
  text: string;
  apply: (input: ScoringInput) => ScoringInput;
}

/**
 * «Почему такое решение и что можно улучшить».
 * Идея: прогоняем те же score() и decide() на изменённых данных («что если…»)
 * и подсказываем только то, что реально меняет оценку или решение.
 */
export function advise({ input, product, requestedAmount, requestedTerm, products = [] }: AdviceInput): Advice {
  const run = (inp: ScoringInput, amount = requestedAmount, term = requestedTerm) => {
    const scoring = score(inp, product);
    const decision = decide({
      scoring, product, requestedAmount: amount, requestedTerm: term,
      avgMonthlyRevenue: inp.avgMonthlyRevenue, currentMonthlyPayments: inp.currentMonthlyPayments,
    });
    return { scoring, decision };
  };

  const { scoring, decision } = run(input);
  const result: Advice = {
    score: scoring.score,
    grade: scoring.grade,
    strengths: scoring.factors.filter((f) => f.points > 0).map((f) => f.clientText),
    weaknesses: scoring.factors.filter((f) => f.points < 0).map((f) => f.clientText),
    hints: [],
    outlook: null,
  };

  // ── 1. Стоп-факторы: баллы тут не помогут — показываем причину и подсказываем, что изменить
  if (scoring.stopFactors.length > 0) {
    result.strengths = [];
    result.weaknesses = scoring.stopFactors.map((s) => s.clientText);
    for (const stop of scoring.stopFactors) {
      if (stop.code === 'SF_TOO_YOUNG') {
        const left = product.minBusinessAgeMonths - input.businessAgeMonths;
        result.hints.push({
          code: 'WAIT_BUSINESS_AGE',
          text: `«${product.name}» доступен бизнесу от ${product.minBusinessAgeMonths} мес — подайте заявку через ${left} мес`,
        });
        const other = products.find((p) => p.code !== product.code && p.minBusinessAgeMonths <= input.businessAgeMonths);
        if (other) result.hints.push({ code: 'OTHER_PRODUCT', text: `Уже сейчас можно оформить «${other.name}»` });
      }
      if (stop.code === 'SF_CURRENT_DELINQUENCY') {
        result.hints.push({ code: 'PAY_DELINQUENCY', text: 'Погасите текущую просрочку — после этого заявку можно подать снова' });
      }
      // SF_COMPANY_INACTIVE — клиент не может это изменить, подсказок нет
    }
    return result;
  }

  // ── 2. Баллы: что клиент может исправить сам
  const fixes: Fix[] = [];
  if (input.hasTaxDebt) {
    fixes.push({ code: 'PAY_TAX_DEBT', text: 'Погасите задолженность по налогам', apply: (i) => ({ ...i, hasTaxDebt: false }) });
  }
  if (input.inquiries30d > 3) {
    fixes.push({ code: 'FEWER_INQUIRIES', text: 'Не подавайте другие заявки на кредит в течение месяца', apply: (i) => ({ ...i, inquiries30d: 0 }) });
  }
  if (input.businessAgeMonths < 12) {
    fixes.push({
      code: 'WAIT_BUSINESS_AGE', text: `Через ${12 - input.businessAgeMonths} мес бизнесу исполнится год`,
      apply: (i) => ({ ...i, businessAgeMonths: 12 }),
    });
  }
  const loadLimit = Math.floor(input.avgMonthlyRevenue * 0.2);   // нагрузка до 20% выручки не снижает баллы
  if (input.currentMonthlyPayments > loadLimit) {
    fixes.push({
      code: 'REDUCE_DEBT_LOAD', text: `Снизьте платежи по текущим кредитам до ${formatRub(loadLimit)} в месяц — например, досрочно погасив часть`,
      apply: (i) => ({ ...i, currentMonthlyPayments: loadLimit }),
    });
  }
  if (input.maxDelinquencyDays12m > 0) {
    fixes.push({
      code: 'NO_NEW_DELINQUENCY', text: 'Не допускайте новых просрочек: через 12 месяцев старые перестанут учитываться',
      apply: (i) => ({ ...i, maxDelinquencyDays12m: 0 }),
    });
  }

  const pointHints: Hint[] = [];
  for (const fix of fixes) {
    const points = score(fix.apply(input), product).score - scoring.score;
    if (points > 0) pointHints.push({ code: fix.code, text: fix.text, points });
  }
  pointHints.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));   // сначала то, что даёт больше всего
  result.hints.push(...pointHints);

  if (pointHints.length > 0) {
    const improved = fixes.reduce((inp, fix) => fix.apply(inp), input);
    result.outlook = run(improved).decision.type;
  }

  // ── 3. Сумма и срок
  // Контрпредложение: на сколько снизить платежи по другим кредитам, чтобы одобрить всю сумму
  if (decision.type === 'COUNTER_OFFER' && product.annuity && decision.rate !== null) {
    const newPayment = monthlyPayment(requestedAmount, decision.rate, requestedTerm, true);
    const allowed = Math.floor(input.avgMonthlyRevenue * MAX_DTI) - newPayment;   // сколько можно платить по другим кредитам
    const step = 100 * 100;                                                       // округляем вверх до 100 ₽
    const reduceBy = Math.ceil((input.currentMonthlyPayments - allowed) / step) * step;
    if (allowed >= 0 && reduceBy > 0) {
      const check = run({ ...input, currentMonthlyPayments: input.currentMonthlyPayments - reduceBy });
      if (check.decision.offer?.amount === requestedAmount && check.decision.offer.term === requestedTerm) {
        result.hints.push({
          code: 'REDUCE_PAYMENTS_FOR_FULL_AMOUNT',
          text: `Если снизить платежи по другим кредитам на ${formatRub(reduceBy)} в месяц, одобрим всю сумму ${formatRub(requestedAmount)} на ${requestedTerm} мес`,
          offer: check.decision.offer,
        });
      }
    }
  }

  // Сумма выше лимита автоматического решения: подскажем, сколько одобрим сразу
  if (decision.type === 'MANUAL_REVIEW' && scoring.grade !== 'C' && requestedAmount > product.autoDecisionLimit) {
    const amount = Math.min(product.autoDecisionLimit, decision.maxAvailableAmount);
    const check = run(input, amount);
    if (check.decision.type === 'APPROVE') {
      result.hints.push({
        code: 'AUTO_DECISION_AMOUNT',
        text: `Сумму до ${formatRub(amount)} одобряем автоматически — без ожидания специалиста`,
        offer: check.decision.offer ?? undefined,
      });
    }
  }

  // Одобрено, а можно больше: покажем запас
  if (decision.type === 'APPROVE') {
    const amount = Math.min(decision.maxAvailableAmount, product.autoDecisionLimit);
    const check = run(input, amount);
    if (amount > requestedAmount && check.decision.type === 'APPROVE') {
      result.hints.push({
        code: 'MORE_AVAILABLE',
        text: `На тех же условиях можно взять до ${formatRub(amount)}`,
        offer: check.decision.offer ?? undefined,
      });
    }
  }

  return result;
}
