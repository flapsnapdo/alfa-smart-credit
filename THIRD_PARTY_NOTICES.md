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
| rxjs | 7.8.2 | Apache-2.0 | https://github.com/ReactiveX/rxjs |
| reflect-metadata | 0.2.2 | Apache-2.0 | https://github.com/rbuckton/reflect-metadata |
| class-validator | 0.15.1 | MIT | https://github.com/typestack/class-validator |
| class-transformer | 0.5.1 | MIT | https://github.com/typestack/class-transformer |
| fastify | * | MIT | https://github.com/fastify/fastify |
| react | 18.x | MIT | https://github.com/facebook/react |
| vite | 8.3.4 | MIT | https://github.com/vitejs/vite |
| @mantine/core | * | MIT | https://github.com/mantinedev/mantine |

> **Примечание:** Полный список всех транзитивных зависимостей доступен через команду `pnpm licenses list --prod`. Все они распространяются под разрешительными лицензиями (MIT, BSD-3-Clause, ISC, Apache-2.0).

## Смоделированные интеграции

Следующие сервисы являются синтетическими моками (`apps/mock-external`) и не подключаются к реальным внешним системам:

-   **Реестр ЕГРЮЛ/ЕГРИП**: Возвращает статус компании, дату регистрации и ОКВЭД по ИНН.
-   **ФНС**: Предоставляет данные о налоговой задолженности.
-   **БКИ**: Эмулирует запрос кредитной истории (только при наличии согласия клиента).
-   **Подписание договора**: Код подтверждения отображается прямо в кабинете (без СМС/почты, по условиям кейса).
-   **Выдача кредита**: Имитация зачисления средств на расчетный счет.

## Тестовые данные
Фикстуры компаний находятся в `packages/shared/demo-companies.json`.