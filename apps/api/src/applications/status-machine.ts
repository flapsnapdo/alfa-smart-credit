import { ActorType, ApplicationStatus } from '../db/schema';

/** Куда можно перейти из статуса и кто имеет право это сделать */
type Transition = { to: ApplicationStatus; by: ActorType[] };

const CLIENT: ActorType[] = ['CLIENT'];
const SYSTEM: ActorType[] = ['SYSTEM'];
const ANALYST: ActorType[] = ['ANALYST'];

/**
 * Таблица разрешённых переходов (раздел «Статусная модель» в аналитике).
 * Всё, чего здесь нет, — запрещено.
 */
export const TRANSITIONS: Record<ApplicationStatus, Transition[]> = {
  DRAFT: [
    { to: 'SUBMITTED', by: CLIENT },
    { to: 'CANCELLED', by: CLIENT },
  ],
  SUBMITTED: [
    { to: 'VALIDATION', by: SYSTEM },
    { to: 'CANCELLED', by: CLIENT },
  ],
  VALIDATION: [
    { to: 'ENRICHMENT', by: SYSTEM },
    { to: 'INFO_REQUESTED', by: SYSTEM },
    { to: 'CANCELLED', by: CLIENT },
  ],
  INFO_REQUESTED: [
    { to: 'VALIDATION', by: ['CLIENT', 'SYSTEM'] },  // клиент загрузил документ
    { to: 'CANCELLED', by: CLIENT },
    { to: 'EXPIRED', by: SYSTEM },
  ],
  ENRICHMENT: [
    { to: 'SCORING', by: SYSTEM },
    { to: 'REJECTED', by: SYSTEM },                  // стоп-фактор из реестра
    { to: 'CANCELLED', by: CLIENT },
  ],
  SCORING: [
    { to: 'APPROVED', by: SYSTEM },
    { to: 'COUNTER_OFFER', by: SYSTEM },
    { to: 'MANUAL_REVIEW', by: SYSTEM },
    { to: 'REJECTED', by: SYSTEM },
    { to: 'CANCELLED', by: CLIENT },
  ],
  MANUAL_REVIEW: [
    { to: 'APPROVED', by: ANALYST },
    { to: 'COUNTER_OFFER', by: ANALYST },
    { to: 'REJECTED', by: ANALYST },
    { to: 'INFO_REQUESTED', by: ANALYST },
    { to: 'CANCELLED', by: CLIENT },
  ],
  APPROVED: [
    { to: 'SIGNING', by: CLIENT },
    { to: 'CANCELLED', by: CLIENT },
    { to: 'EXPIRED', by: SYSTEM },
  ],
  COUNTER_OFFER: [
    { to: 'SIGNING', by: CLIENT },
    { to: 'CANCELLED', by: CLIENT },
    { to: 'EXPIRED', by: SYSTEM },
  ],
  SIGNING: [
    { to: 'ISSUED', by: ['CLIENT', 'SYSTEM'] },      // клиент ввёл код → система выдала деньги
  ],
  ISSUED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export const FINAL_STATUSES: ApplicationStatus[] = ['ISSUED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

export function canTransition(from: ApplicationStatus, to: ApplicationStatus, actor: ActorType): boolean {
  return TRANSITIONS[from].some((t) => t.to === to && t.by.includes(actor));
}

/** Ошибка «так переходить нельзя» — API превратит её в ответ 409 */
export class InvalidTransitionError extends Error {
  constructor(public from: ApplicationStatus, public to: ApplicationStatus, public actor: ActorType) {
    super(`Переход ${from} → ${to} недоступен для ${actor}`);
  }
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus, actor: ActorType): void {
  if (!canTransition(from, to, actor)) throw new InvalidTransitionError(from, to, actor);
}