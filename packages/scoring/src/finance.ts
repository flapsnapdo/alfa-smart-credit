/** Аннуитетный платёж: P = S · i(1+i)^n / ((1+i)^n − 1)
 *  amount — сумма в копейках, annualRate — % годовых, termMonths — срок в месяцах */
export function annuityPayment(amount: number, annualRate: number, termMonths: number): number {
  const i = annualRate / 12 / 100;          // месячная ставка: 18% годовых → 0.015
  if (i === 0) return Math.round(amount / termMonths);
  const k = Math.pow(1 + i, termMonths);    // (1+i)^n
  return Math.round((amount * i * k) / (k - 1));
}
/** Максимальная сумма, при которой платёж не превышает maxPayment (обратная формула аннуитета) */
export function maxAnnuityAmount(maxPayment: number, annualRate: number, termMonths: number): number {
  if (maxPayment <= 0) return 0;
  const i = annualRate / 12 / 100;
  if (i === 0) return maxPayment * termMonths;
  return Math.floor((maxPayment * (1 - Math.pow(1 + i, -termMonths))) / i);
}

/** Овердрафт: платёж = проценты за месяц при полном использовании лимита */
export function overdraftMonthlyInterest(amount: number, annualRate: number): number {
  return Math.round((amount * annualRate) / 12 / 100);
}

export function monthlyPayment(amount: number, rate: number, term: number, annuity: boolean): number {
  return annuity ? annuityPayment(amount, rate, term) : overdraftMonthlyInterest(amount, rate);
}

/** Округление вниз до 10 000 ₽ — банк не предлагает «823 417 ₽» */
export function floorTo10k(amountKop: number): number {
  const step = 10_000 * 100;
  return Math.floor(amountKop / step) * step;
}

export function formatRub(amountKop: number): string {
  return `${Math.round(amountKop / 100).toLocaleString('ru-RU')} ₽`;
}