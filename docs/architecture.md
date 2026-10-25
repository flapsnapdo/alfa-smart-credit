# Архитектура системы

```mermaid
flowchart TD
    Browser[Браузер] --> Web[Frontend React + Zustand + Fetch]
    Web -->|HTTP| API[NestJS API]
    
    subgraph Backend Core
        API --> Auth[Auth Module]
        API --> Apps[Applications Module]
        API --> Prod[Products Module]
        API --> Reg[Registry Adapter]
        
        Apps --> Pipeline[PipelineService]
        Apps --> StateMachine[State Machine Service]
        Apps --> DB[(PostgreSQL)]
        
        Pipeline --> Scoring[@alfa/scoring Package]
        Pipeline --> ExtClient[External Client<br/>Timeout 3s + Retry]
    end
    
    ExtClient -->|HTTP| MockExt[Mock External Services<br/>Fastify]
    MockExt --> EGRUL[ЕГРЮЛ/ЕГРИП Мок]
    MockExt --> FNS[ФНС Мок]
    MockExt --> BKI[БКИ Мок]
    MockExt --> Sign[Подписание Мок]
    MockExt --> Issue[Выдача Мок]