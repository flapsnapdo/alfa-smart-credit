import { Inject, Injectable } from '@nestjs/common';
import { monthlyPayment } from '@alfa/scoring';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import { products } from '../db/schema';
import { Purpose } from './recommend.dto';

/** Цель клиента → рекомендуемый продукт и альтернатива (таблица из аналитики) */
const PURPOSE_TO_PRODUCT: Record<Purpose, { recommended: string; alternative: string | null }> = {
  CASH_GAP: { recommended: 'OVERDRAFT', alternative: 'WORKING_CAPITAL' },
  WORKING_CAPITAL: { recommended: 'WORKING_CAPITAL', alternative: 'OVERDRAFT' },
  EQUIPMENT: { recommended: 'EQUIPMENT', alternative: 'WORKING_CAPITAL' },
  OTHER: { recommended: 'WORKING_CAPITAL', alternative: null },
};

@Injectable()
export class ProductsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  list() {
    return this.db.select().from(products).orderBy(products.baseRate);
  }

  async recommend(purpose: Purpose, amount: number, term: number) {
    const all = await this.db.select().from(products);
    const byCode = new Map(all.map((p) => [p.code as string, p]));
    const rule = PURPOSE_TO_PRODUCT[purpose];

    const recommended = byCode.get(rule.recommended)!;
    const alternative = rule.alternative ? byCode.get(rule.alternative) ?? null : null;

    // Сумму и срок подгоняем под границы продукта, чтобы расчёт был честным
    const fitAmount = Math.min(Math.max(amount, recommended.minAmount), recommended.maxAmount);
    const fitTerm = Math.min(Math.max(term, recommended.minTerm), recommended.maxTerm);

    return {
      recommended,
      alternative,
      amount: fitAmount,
      term: fitTerm,
      rate: recommended.baseRate,
      monthlyPayment: monthlyPayment(fitAmount, recommended.baseRate, fitTerm, recommended.annuity),
      note: 'Платёж примерный, точные условия — после оценки заявки',
    };
  }
}