# Архитектура

Монорепозиторий на pnpm workspaces. Всё поднимается через Docker Compose: фронтенд, API, база и сервис-заглушка внешних систем.

```mermaid
flowchart LR
    Browser["Браузер: кабинет клиента и аналитика"] --> Web

    subgraph web["web — :8080"]
        Web["React + Mantine + Zustand<br/>nginx: статика и прокси /api"]
    end

    Web -->|"HTTP /api/v1, JWT"| API

    subgraph api["api — NestJS :3000"]
        API["Глобально: AuthGuard (JWT и роли),<br/>ValidationPipe, ApiExceptionFilter"]
        Auth["auth<br/>вход, /me"]
        Products["products<br/>продукты, подбор"]
        Registry["registry<br/>поиск по ИНН"]
        Apps["applications<br/>заявки, changeStatus,<br/>status-machine"]
        Pipeline["PipelineService<br/>конвейер"]
        Docs["documents<br/>файлы и дозапрос"]
        Expl["explanation<br/>почему так и что улучшить"]
        Analyst["analyst<br/>очередь, карточка, решение"]
        Contracts["contracts<br/>принятие, подпись, выдача"]
        Ext["external<br/>ExternalClient: таймаут 3 с, повтор"]
        API --> Auth & Products & Registry & Apps & Docs & Expl & Analyst & Contracts
        Apps --> Pipeline
        Docs --> Pipeline
        Pipeline --> Ext
        Contracts --> Ext
    end

    Scoring["пакет @alfa/scoring<br/>score, decide, advise —<br/>чистые функции без базы и сети"]
    Pipeline --> Scoring
    Expl --> Scoring

    DB[("PostgreSQL 16 — :55432")]
    Auth & Apps & Pipeline & Docs & Analyst & Contracts --> DB

    subgraph mock["mock-external — Fastify :4001"]
        Reg["/registry/:inn<br/>ЕГРЮЛ / ЕГРИП"]
        Tax["/tax/:inn<br/>ФНС"]
        Bki["/bki/report<br/>БКИ, только с согласием"]
        Sign["/sign/request, /sign/confirm<br/>подписание кодом"]
        Pay["/payout<br/>выдача"]
    end

    Ext --> Reg & Tax & Bki & Sign & Pay
    Registry --> Reg

    Shared["пакет @alfa/shared<br/>demo-companies.json"]
    Shared -.-> mock
    Shared -.->|"seed при старте"| DB
```

## Компоненты

| Компонент | Что делает |
|---|---|
| **web** | одностраничное приложение на React + Mantine, состояние в Zustand, запросы через `fetch`. В Docker собирается и отдаётся nginx, который проксирует `/api` в API |
| **api** | NestJS. Все пути с префиксом `/api/v1`. Глобально: `AuthGuard` проверяет JWT и роли (`@Public`, `@Roles`), `ValidationPipe` проверяет тела запросов по DTO, `ApiExceptionFilter` приводит любые ошибки к формату `{ code, message, details }` |
| **auth** | вход по email и паролю (bcrypt), выдача JWT, `GET /me` — пользователь и его компании |
| **products** | список продуктов и подбор продукта по цели, сумме и сроку |
| **registry** | поиск компании по ИНН в реестре (через заглушку) |
| **applications** | создание, отправка, отзыв и просмотр заявок. `changeStatus` — единственное место смены статуса: проверка по таблице переходов (`status-machine.ts`), защита от одновременных изменений по `version`, запись в историю — в одной транзакции |
| **PipelineService** | конвейер: проверка документов → запросы в реестр, ФНС и БКИ → скоринг → решение. Работает в фоне, смотрит на текущий статус и делает следующий шаг, поэтому после перезапуска сервера продолжает заявки с того же этапа |
| **documents** | загрузка документов, чек-лист «чего не хватает», дозапрос. Когда клиент загрузил всё запрошенное, заявка сама возвращается в конвейер |
| **explanation** | объяснение решения клиенту: сильные и слабые стороны, подсказки «что сделать, чтобы условия стали лучше» |
| **analyst** | очередь заявок на ручное рассмотрение, карточка со всеми данными, решение с обязательным комментарием, запрос документа |
| **contracts** | принятие предложения → договор → подпись кодом → выдача денег |
| **external** | `ExternalClient` — общий клиент внешних сервисов: таймаут 3 секунды и одна повторная попытка при сбое. Ошибки не бросает — конвейер сам решает, что делать (например, передать заявку специалисту) |
| **@alfa/scoring** | пакет с чистыми функциями: `score` (баллы, рейтинг, стоп-факторы), `decide` (решение, ставка, контрпредложение), `advise` (подсказки клиенту). Без базы и сети, покрыт тестами |
| **@alfa/shared** | синтетические данные 7 демо-компаний: из них заполняется база при старте и отвечает заглушка |
| **mock-external** | Fastify-сервис, который заменяет внешние системы банка: реестр, ФНС, БКИ, подписание и выдачу |
| **PostgreSQL** | все данные; миграции применяются автоматически при старте API |

## Как проходит заявка

```mermaid
sequenceDiagram
    actor C as Клиент
    participant W as web
    participant A as api
    participant P as PipelineService
    participant M as mock-external
    actor An as Аналитик

    C->>W: заполняет заявку
    W->>A: POST /applications, POST /applications/:id/submit
    A-->>W: SUBMITTED (ответ сразу)
    A->>P: start(id) в фоне
    P->>P: проверка документов
    P->>M: реестр, ФНС, БКИ (параллельно)
    M-->>P: данные компании
    P->>P: score() и decide()
    W->>A: GET /applications/:id каждые 2–3 с
    A-->>W: решение и clientView
    opt рейтинг C или крупная сумма
        An->>A: POST /analyst/applications/:id/decision
    end
    C->>W: принимает предложение
    W->>A: POST /applications/:id/accept
    A->>M: /sign/request — код показывается в кабинете
    C->>W: вводит код
    W->>A: POST /applications/:id/sign
    A->>M: /sign/confirm, затем /payout
    A-->>W: ISSUED — средства выданы
```

## Порты при запуске через Docker Compose

| Сервис | Адрес |
|---|---|
| Кабинет (web) | http://localhost:8080 |
| API | http://localhost:3000/api/v1 |
| Заглушка внешних систем | http://localhost:4001 |
| PostgreSQL | localhost:55432 |
