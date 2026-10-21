/** Все суммы — в копейках (целые числа). Ставки — в % годовых. */

export type ProductCode = 'OVERDRAFT' | 'WORKING_CAPITAL' | 'EQUIPMENT';
export type CompanyStatus = 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'BANKRUPT';
export type IndustryRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type Grade = 'A' | 'B' | 'C' | 'D';

export interface ProductParams {
  code: ProductCode;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  baseRate: number;
  revenueMultiplier: number;     // сумма ≤ средняя выручка × multiplier
  minBusinessAgeMonths: number;
  autoDecisionLimit: number;     // выше — только через аналитика
  annuity: boolean;              // false — овердрафт
}

/** Всё, что нужно знать о компании для оценки */
export interface ScoringInput {
  businessAgeMonths: number;
  companyStatus: CompanyStatus;
  avgMonthlyRevenue: number;
  revenueLast6m: number;
  revenuePrev6m: number;
  currentMonthlyPayments: number;
  maxDelinquencyDays12m: number;
  currentDelinquencyDays: number;
  hasClosedLoans: boolean;
  inquiries30d: number;
  industryRisk: IndustryRisk;
  hasTaxDebt: boolean;
}

/** Один фактор скоринга с объяснением */
export interface Factor {
  code: string;
  value: string;
  points: number;
  analystText: string;   // правило — для аналитика
  clientText: string;    // простыми словами — для клиента
}

export interface StopFactor {
  code: string;
  clientText: string;
}

export interface ScoringResult {
  score: number;
  grade: Grade;
  factors: Factor[];
  stopFactors: StopFactor[];
  rulesVersion: string;
}
export interface Offer {
  productCode: ProductCode;
  amount: number;
  term: number;
  rate: number;
  monthlyPayment: number;
}

export type DecisionType = 'APPROVE' | 'COUNTER_OFFER' | 'MANUAL_REVIEW' | 'REJECT';

export interface CreditDecision {
  type: DecisionType;
  rate: number | null;
  maxAvailableAmount: number;
  offer: Offer | null;          // основное предложение
  alternatives: Offer[];        // другие варианты контрпредложения
  reasons: string[];            // причины простыми словами
}