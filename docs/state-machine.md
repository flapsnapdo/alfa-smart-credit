# Машина состояний заявки

```mermaid
stateDiagram-v2
    [*] --> DRAFT: CLIENT создает
    DRAFT --> SUBMITTED: CLIENT отправляет
    SUBMITTED --> VALIDATION: SYSTEM проверка
    VALIDATION --> ENRICHMENT: SYSTEM данные собраны
    VALIDATION --> INFO_REQUESTED: SYSTEM нужны доки
    INFO_REQUESTED --> VALIDATION: CLIENT загрузил файл
    ENRICHMENT --> SCORING: SYSTEM enrichment готов
    SCORING --> MANUAL_REVIEW: SYSTEM нужен человек
    SCORING --> APPROVED: SYSTEM авто-одобрение
    SCORING --> REJECTED: SYSTEM авто-отказ
    MANUAL_REVIEW --> APPROVED: ANALYST решил
    MANUAL_REVIEW --> COUNTER_OFFER: ANALYST предложил иное
    MANUAL_REVIEW --> REJECTED: ANALYST отказал
    APPROVED --> SIGNING: CLIENT согласен
    SIGNING --> ISSUED: SYSTEM выдача
    ISSUED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
```

## Тексты для клиента (client-view.ts)
| Статус | Что видит клиент |
|--------|------------------|
| DRAFT | Черновик сохранен. Проверьте данные и отправьте. |
| SUBMITTED | Заявка отправлена. Идет первичная проверка... |
| VALIDATION | Проверяем данные в реестрах... |
| INFO_REQUESTED | Требуется дополнительный документ. Загрузите его в личном кабинете. |
| MANUAL_REVIEW | Заявка на ручном рассмотрении у аналитика. |
| APPROVED | Поздравляем! Кредит одобрен. Перейдите к подписанию. |
| REJECTED | К сожалению, в кредите отказано. Смотрите причины в деталях. |