import { ApplicationStatus } from '../db/schema';

/** Что показать клиенту на каждом статусе: заголовок, пояснение и следующее действие */
export const CLIENT_VIEW: Record<ApplicationStatus, { title: string; text: string; nextAction: string }> = {
  DRAFT: { title: 'Черновик', text: 'Заполните заявку и отправьте её на рассмотрение', nextAction: 'FILL_DRAFT' },
  SUBMITTED: { title: 'Заявка отправлена', text: 'Мы получили заявку и начинаем проверку', nextAction: 'WAIT' },
  VALIDATION: { title: 'Проверяем данные', text: 'Проверяем, что все данные заполнены верно', nextAction: 'WAIT' },
  INFO_REQUESTED: { title: 'Нужны документы', text: 'Загрузите запрошенный документ — заявка продолжится автоматически', nextAction: 'UPLOAD_DOCUMENT' },
  ENRICHMENT: { title: 'Проверяем компанию', text: 'Запрашиваем данные из реестра и кредитную историю', nextAction: 'WAIT' },
  SCORING: { title: 'Оцениваем заявку', text: 'Рассчитываем условия по вашей заявке', nextAction: 'WAIT' },
  MANUAL_REVIEW: { title: 'Заявку рассматривает специалист', text: 'Обычно это занимает до 1 рабочего дня', nextAction: 'WAIT' },
  APPROVED: { title: 'Одобрено', text: 'Подтвердите условия, чтобы перейти к подписанию', nextAction: 'ACCEPT_OFFER' },
  COUNTER_OFFER: { title: 'Предлагаем другие условия', text: 'Не можем одобрить всю сумму, но можем предложить другие условия', nextAction: 'ACCEPT_OR_DECLINE_OFFER' },
  SIGNING: { title: 'Подписание договора', text: 'Проверьте договор и подтвердите его кодом', nextAction: 'SIGN' },
  ISSUED: { title: 'Средства выданы', text: 'Деньги зачислены на ваш счёт', nextAction: 'NONE' },
  REJECTED: { title: 'Отказ', text: 'К сожалению, сейчас мы не можем выдать кредит', nextAction: 'NONE' },
  CANCELLED: { title: 'Заявка отозвана', text: 'Заявка закрыта по вашему решению', nextAction: 'NONE' },
  EXPIRED: { title: 'Срок истёк', text: 'Мы не получили ответ вовремя, заявка закрыта', nextAction: 'NONE' },
};