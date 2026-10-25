import type { ApplicationStatus, DocType, Grade, Purpose } from './types';

/** Копейки → «1 500 000 ₽» */
export function rub(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function date(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU');
}

export function months(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} месяца`;
  return `${n} месяцев`;
}

export const PURPOSES: { value: Purpose; title: string; description: string }[] = [
  { value: 'CASH_GAP', title: 'Не хватает денег до поступления оплаты', description: 'Кассовый разрыв, платежи поставщикам и налоги' },
  { value: 'WORKING_CAPITAL', title: 'Закупить товар или подготовиться к сезону', description: 'Оборотные средства, сырьё, зарплаты' },
  { value: 'EQUIPMENT', title: 'Купить оборудование или транспорт', description: 'Станки, техника, автомобили для бизнеса' },
  { value: 'OTHER', title: 'Другое', description: 'Подберём подходящий продукт' },
];

export const PURPOSE_LABELS: Record<Purpose, string> = {
  CASH_GAP: 'Кассовый разрыв',
  WORKING_CAPITAL: 'Оборотные средства',
  EQUIPMENT: 'Оборудование и транспорт',
  OTHER: 'Другое',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлена',
  VALIDATION: 'Проверка данных',
  INFO_REQUESTED: 'Нужны документы',
  ENRICHMENT: 'Проверка компании',
  SCORING: 'Оценка',
  MANUAL_REVIEW: 'У специалиста',
  APPROVED: 'Одобрена',
  COUNTER_OFFER: 'Контрпредложение',
  SIGNING: 'Подписание',
  ISSUED: 'Выдана',
  REJECTED: 'Отказ',
  CANCELLED: 'Отозвана',
  EXPIRED: 'Срок истёк',
};

export function statusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'APPROVED':
    case 'ISSUED':
      return 'green';
    case 'COUNTER_OFFER':
    case 'INFO_REQUESTED':
      return 'orange';
    case 'MANUAL_REVIEW':
    case 'SIGNING':
      return 'blue';
    case 'REJECTED':
      return 'red';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'DRAFT':
      return 'gray';
    default:
      return 'cyan';   // конвейер работает
  }
}

export const GRADE_COLORS: Record<Grade, string> = { A: 'green', B: 'teal', C: 'yellow', D: 'red' };
export const GRADE_RISK: Record<Grade, string> = {
  A: 'Низкий риск', B: 'Умеренный риск', C: 'Пограничный случай', D: 'Высокий риск',
};

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'FINANCIAL_STATEMENTS', label: 'Бухгалтерская отчётность за последний год' },
  { value: 'EQUIPMENT_INVOICE', label: 'Счёт или спецификация на оборудование' },
  { value: 'OTHER', label: 'Дополнительный документ' },
];

/** Статусы, в которых конвейер работает сам — экран опрашивает API */
export const IN_PROGRESS: ApplicationStatus[] = ['SUBMITTED', 'VALIDATION', 'ENRICHMENT', 'SCORING'];

/** До подписания клиент может отозвать заявку */
export const CANCELLABLE: ApplicationStatus[] = [
  'DRAFT', 'SUBMITTED', 'VALIDATION', 'INFO_REQUESTED', 'ENRICHMENT', 'SCORING', 'MANUAL_REVIEW', 'APPROVED', 'COUNTER_OFFER',
];
