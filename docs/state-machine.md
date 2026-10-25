
```markdown
# Машина состояний заявки

```mermaid
stateDiagram-v2
    [*] --> DRAFT: CLIENT создает
    DRAFT --> SUBMITTED: CLIENT отправляет
    DRAFT --> CANCELLED: CLIENT отменяет
    
    SUBMITTED --> VALIDATION: SYSTEM проверка
    SUBMITTED --> CANCELLED: CLIENT отменяет
    
    VALIDATION --> ENRICHMENT: SYSTEM данные собраны
    VALIDATION --> INFO_REQUESTED: SYSTEM нужны доки
    VALIDATION --> CANCELLED: CLIENT отменяет
    
    INFO_REQUESTED --> VALIDATION: CLIENT загрузил файл
    INFO_REQUESTED --> CANCELLED: CLIENT отменяет
    INFO_REQUESTED --> EXPIRED: SYSTEM таймаут
    
    ENRICHMENT --> SCORING: SYSTEM enrichment готов
    ENRICHMENT --> REJECTED: SYSTEM стоп-фактор
    ENRICHMENT --> MANUAL_REVIEW: SYSTEM нужна проверка
    ENRICHMENT --> CANCELLED: CLIENT отменяет
    
    SCORING --> APPROVED: SYSTEM авто-одобрение
    SCORING --> COUNTER_OFFER: SYSTEM контрпредложение
    SCORING --> MANUAL_REVIEW: SYSTEM ручной обзор
    SCORING --> REJECTED: SYSTEM авто-отказ
    SCORING --> CANCELLED: CLIENT отменяет
    
    MANUAL_REVIEW --> APPROVED: ANALYST одобрил
    MANUAL_REVIEW --> COUNTER_OFFER: ANALYST предложил иное
    MANUAL_REVIEW --> REJECTED: ANALYST отказал
    MANUAL_REVIEW --> INFO_REQUESTED: ANALYST запросил доки
    MANUAL_REVIEW --> CANCELLED: CLIENT отменяет
    
    APPROVED --> SIGNING: CLIENT согласен
    APPROVED --> CANCELLED: CLIENT отменяет
    APPROVED --> EXPIRED: SYSTEM таймаут
    
    COUNTER_OFFER --> SIGNING: CLIENT принял условия
    COUNTER_OFFER --> CANCELLED: CLIENT отменяет
    COUNTER_OFFER --> EXPIRED: SYSTEM таймаут
    
    SIGNING --> ISSUED: SYSTEM выдача
    ISSUED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]

## Тексты для клиента (из client-view.ts)

| Статус | Заголовок (title) | Текст (text) |
| :--- | :--- | :--- |
| DRAFT | Черновик сохранен | Проверьте данные и отправьте заявку на рассмотрение. |
| SUBMITTED | Заявка отправлена | Идет первичная проверка документов... |
| VALIDATION | Проверка данных | Запрашиваем информацию в реестрах и БКИ. |
| INFO_REQUESTED | Требуются документы | Пожалуйста, загрузите запрошенные документы в личном кабинете. |
| ENRICHMENT | Обогащение данных | Анализируем финансовую устойчивость компании. |
| SCORING | Скоринг | Рассчитываем кредитный рейтинг и доступный лимит. |
| MANUAL_REVIEW | Ручное рассмотрение | Заявка передана аналитику для принятия решения. |
| APPROVED | Кредит одобрен! | Поздравляем! Перейдите к подписанию договора. |
| COUNTER_OFFER | Индивидуальное предложение | Мы подготовили специальные условия. Ознакомьтесь и примите решение. |
| SIGNING | Подписание договора | Введите код подтверждения для завершения сделки. |
| ISSUED | Средства зачислены | Кредит успешно выдан на ваш расчетный счет. |
| REJECTED | Отказ в кредите | К сожалению, мы не можем одобрить заявку. Смотрите причины в деталях. |
| CANCELLED | Заявка отменена | Вы отозвали заявку на получение кредита. |
| EXPIRED | Срок действия истек | Время на принятие решения или подписание истекло. |