# Кабинет клиента и аналитика (`apps/web`)

React 18 + Mantine 7 + React Router, состояние черновика заявки — в Zustand. Все данные приходят из API: `src/lib/apiClient.ts`, типы ответов — `src/lib/types.ts` (по [docs/openapi.yaml](../../docs/openapi.yaml)).

## Запуск для разработки

```bash
docker compose up --build postgres mock-external api   # API на :3000
pnpm --filter web dev                                    # кабинет на http://localhost:5173
```

Vite проксирует `/api` в `http://127.0.0.1:3000`. Другой адрес API: `API_URL=http://host:3000 pnpm --filter web dev`.

В Docker кабинет собирается и раздаётся nginx на :8080, он же проксирует `/api` в контейнер API (`nginx.conf`).

## Экраны

| Путь | Экран |
|---|---|
| `/login` | вход, быстрые кнопки демо-пользователей |
| `/client/dashboard` | мои заявки |
| `/client/product-select` | для чего деньги: подбор продукта и платёж (`POST /products/recommend`) |
| `/client/company` | выбор компании и сверка с реестром |
| `/client/review` | сводка, документы, согласие на БКИ, отправка |
| `/client/applications/:id` | статус в реальном времени, решение, объяснение, история |
| `/client/applications/:id/documents` | что просит банк, загрузка файлов |
| `/client/applications/:id/offer` | условия или варианты контрпредложения |
| `/client/applications/:id/signing` | договор, код подписи, «Средства выданы» |
| `/analyst/dashboard` | очередь заявок по статусу |
| `/analyst/application/:id` | карточка: финансы, скоринг по факторам, внешние проверки, документы, история |
| `/analyst/application/:id/decision` | решение с комментарием или запрос документа |

Суммы в API — в копейках, на экранах — в рублях (`rub()` в `src/lib/format.ts`).
