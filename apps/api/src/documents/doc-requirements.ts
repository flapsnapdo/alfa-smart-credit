import { DocType } from '../db/schema';

/** Как документ называется для клиента */
export const DOC_TITLES: Record<DocType, string> = {
  FINANCIAL_STATEMENTS: 'Бухгалтерская отчётность за последний год',
  EQUIPMENT_INVOICE: 'Счёт или спецификация на оборудование',
  OTHER: 'Дополнительный документ',
};

/** Какие файлы принимаем */
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;   // 10 МБ

/** Требования продукта к документам: тип и сумма (в копейках), начиная с которой он нужен */
export type ProductDocRule = { docType: string; fromAmount: number };

/**
 * Каких документов не хватает заявке. Чистая функция — без базы, поэтому её легко проверить тестом.
 * Нужны: обязательные для продукта при такой сумме + всё, что запросил банк и что ещё не загружено.
 */
export function missingDocTypes(
  productRules: ProductDocRule[],
  amount: number,
  uploaded: DocType[],
  openRequests: DocType[],
): DocType[] {
  const requiredByProduct = productRules
    .filter((rule) => amount >= rule.fromAmount)
    .map((rule) => rule.docType as DocType)
    .filter((type) => !uploaded.includes(type));
  return [...new Set([...requiredByProduct, ...openRequests])];
}
