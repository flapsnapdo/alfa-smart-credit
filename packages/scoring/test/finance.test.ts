import { describe, expect, it } from 'vitest';
import { annuityPayment } from '../src/finance';

describe('annuityPayment', () => {
  it('1 500 000 ₽ на 24 мес под 17% ≈ 74 163 ₽ в месяц', () => {
    const payment = annuityPayment(1_500_000_00, 17, 24);
    expect(Math.round(payment / 100)).toBe(74_163);
  });

  it('при нулевой ставке — просто делим сумму на срок', () => {
    expect(annuityPayment(1_200_00, 0, 12)).toBe(100_00);
  });
});