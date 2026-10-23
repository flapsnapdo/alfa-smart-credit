# THIRD_PARTY_NOTICES

Проект использует следующие open-source библиотеки.

## Основные зависимости

| Библиотека | Версия | Лицензия | Репозиторий |
|------------|--------|----------|-------------|
| @nestjs/common | 11.2.7 | MIT | https://github.com/nestjs/nest |
| @nestjs/core | 11.2.7 | MIT | https://github.com/nestjs/nest |
| @nestjs/jwt | 11.0.2 | MIT | https://github.com/nestjs/nest |
| @nestjs/platform-express | 11.2.7 | MIT | https://github.com/nestjs/nest |
| drizzle-orm | 0.45.4 | Apache-2.0 | https://github.com/drizzle-team/drizzle-orm |
| pg | 8.23.1 | MIT | https://github.com/brianc/node-postgres |
| bcryptjs | 3.0.3 | MIT | https://github.com/dcodeIO/bcrypt.js |
| multer | 2.5.0 | MIT | https://github.com/expressjs/multer |
| rxjs | 7.8.2 | Apache-2.0 | https://github.com/ReactiveX/rxjs |
| reflect-metadata | 0.2.2 | Apache-2.0 | https://github.com/rbuckton/reflect-metadata |
| class-validator | 0.15.1 | MIT | https://github.com/typestack/class-validator |
| class-transformer | 0.5.1 | MIT | https://github.com/typestack/class-transformer |
| fastify | * | MIT | https://github.com/fastify/fastify |
| react | 19.x | MIT | https://github.com/facebook/react |
| vite | 8.3.4 | MIT | https://github.com/vitejs/vite |
| @mantine/core | * | MIT | https://github.com/mantinedev/mantine |

> **Примечание:** Полный список всех транзитивных зависимостей доступен через команду `pnpm licenses list --prod`. Все они распространяются под разрешительными лицензиями (MIT, BSD-3-Clause, ISC, Apache-2.0).

## Смоделированные интеграции

Следующие сервисы являются синтетическими моками и не подключаются к реальным внешним системам:

-   **ЕГРЮЛ / ФНС / БКИ**: Эмуляция через `apps/mock-external`. Использует фикстуры из `packages/scoring`.
-   **Подписание договора**: Синтетическая генерация PDF и кода подтверждения.
-   **Выдача кредита**: Имитация зачисления средств на счет.
-   **ИИ-подсказки**: Опциональная интеграция с Ollama (open-weights модели) для подбора продуктов.

## Тестовые аккаунты

Для демонстрации используются следующие учетные записи (пароль для всех: `Demo2026!`):

-   `anna@demo.ru`, `igor@demo.ru`, `olga@demo.ru`, `kozlov@demo.ru` — Клиенты
-   `analyst@demo.ru` — Аналитик