import { describe, expect, it } from 'vitest';
import { missingDocTypes } from '../src/documents/doc-requirements';

const EQUIPMENT = [{ docType: 'EQUIPMENT_INVOICE', fromAmount: 0 }];
const WORKING_CAPITAL = [{ docType: 'FINANCIAL_STATEMENTS', fromAmount: 3_000_000_00 + 1 }];

describe('комплектность документов', () => {
  it('для оборудования нужен счёт при любой сумме', () => {
    expect(missingDocTypes(EQUIPMENT, 900_000_00, [], [])).toEqual(['EQUIPMENT_INVOICE']);
  });

  it('загруженный документ больше не нужен', () => {
    expect(missingDocTypes(EQUIPMENT, 900_000_00, ['EQUIPMENT_INVOICE'], [])).toEqual([]);
  });

  it('оборотный кредит до 3 млн — без отчётности, больше 3 млн — с отчётностью', () => {
    expect(missingDocTypes(WORKING_CAPITAL, 3_000_000_00, [], [])).toEqual([]);
    expect(missingDocTypes(WORKING_CAPITAL, 3_500_000_00, [], [])).toEqual(['FINANCIAL_STATEMENTS']);
  });

  it('открытый запрос аналитика нужен, даже если документ такого типа был раньше', () => {
    expect(missingDocTypes([], 1_000_000_00, ['OTHER'], ['OTHER'])).toEqual(['OTHER']);
  });

  it('тип не повторяется, если его требует и продукт, и запрос', () => {
    expect(missingDocTypes(EQUIPMENT, 1_000_000_00, [], ['EQUIPMENT_INVOICE'])).toEqual(['EQUIPMENT_INVOICE']);
  });
});
