/** Аннуитетный платёж: P = S · i(1+i)^n / ((1+i)^n − 1)
 *  amount — сумма в копейках, annualRate — % годовых, termMonths — срок в месяцах */
export function annuityPayment(amount: number, annualRate: number, termMonths: number): number {
  const i = annualRate / 12 / 100;          // месячная ставка: 18% годовых → 0.015
  if (i === 0) return Math.round(amount / termMonths);
  const k = Math.pow(1 + i, termMonths);    // (1+i)^n
  return Math.round((amount * i * k) / (k - 1));
}