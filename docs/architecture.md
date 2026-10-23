# Архитектура системы

```mermaid
flowchart TD
    Browser[Браузер Жюри] --> Web[Frontend React/Vite]
    Web -->|HTTPS| API[NestJS API Gateway]
    
    subgraph Backend Core
        API --> Auth[Auth Module]
        API --> Apps[Applications Module]
        API --> Prod[Products Module]
        API --> Reg[Registry Adapter]
        
        Apps --> StateMachine[State Machine Service]
        Apps --> DB[(PostgreSQL)]
        StateMachine --> History[Audit Log]
    end
    
    API -->|HTTP| MockExt[Mock External Services]
    MockExt -->|JSON| EGRUL[ЕГРЮЛ Мок]
    MockExt -->|JSON| FNS[ФНС Мок]
    MockExt -->|JSON| BKI[БКИ Мок]
    
    Scoring[@alfa/scoring Package] -.->|Pure Functions| API
```

## Описание компонентов
- **Web**: SPA на React+Mantine. Работает с API через TanStack Query.
- **NestJS API**: Единая точка входа. Маршрутизация, валидация, авторизация.
- **State Machine**: Ядро бизнес-логики. Гарантирует корректные переходы статусов и оптимистическую блокировку.
- **Mock External**: Fastify-сервис, эмулирующий внешние реестры и БКИ. Отвечает задержкой ~1с для демо конвейера.
- **@alfa/scoring**: Изолированный пакет с чистыми функциями скоринга. Не имеет доступа к БД.