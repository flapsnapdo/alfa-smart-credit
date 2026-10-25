# Third-party notices

Проект использует open-source библиотеки и образы под разрешительными лицензиями. Платные API, внешние сервисы и модели ИИ не используются.

## Библиотеки, которые входят в приложение

### API (`apps/api`)

| Библиотека | Версия | Лицензия | Репозиторий |
|---|---|---|---|
| @nestjs/common | 11.2.7 | MIT | https://github.com/nestjs/nest |
| @nestjs/core | 11.2.7 | MIT | https://github.com/nestjs/nest |
| @nestjs/platform-express | 11.2.7 | MIT | https://github.com/nestjs/nest |
| @nestjs/jwt | 11.0.2 | MIT | https://github.com/nestjs/jwt |
| drizzle-orm | 0.45.4 | Apache-2.0 | https://github.com/drizzle-team/drizzle-orm |
| pg | 8.23.1 | MIT | https://github.com/brianc/node-postgres |
| bcryptjs | 3.0.3 | BSD-3-Clause | https://github.com/dcodeIO/bcrypt.js |
| class-validator | 0.15.1 | MIT | https://github.com/typestack/class-validator |
| class-transformer | 0.5.1 | MIT | https://github.com/typestack/class-transformer |
| reflect-metadata | 0.2.2 | Apache-2.0 | https://github.com/rbuckton/reflect-metadata |
| rxjs | 7.8.2 | Apache-2.0 | https://github.com/ReactiveX/rxjs |

### Заглушка внешних систем (`apps/mock-external`)

| Библиотека | Версия | Лицензия | Репозиторий |
|---|---|---|---|
| fastify | 5.12.7 | MIT | https://github.com/fastify/fastify |

### Фронтенд (`apps/web`)

| Библиотека | Версия | Лицензия | Репозиторий |
|---|---|---|---|
| react | 18.3.1 | MIT | https://github.com/facebook/react |
| react-dom | 18.3.1 | MIT | https://github.com/facebook/react |
| react-router-dom | 6.30.6 | MIT | https://github.com/remix-run/react-router |
| @mantine/core | 7.17.8 | MIT | https://github.com/mantinedev/mantine |
| @mantine/hooks | 7.17.8 | MIT | https://github.com/mantinedev/mantine |
| @tabler/icons-react | 3.49.0 | MIT | https://github.com/tabler/tabler-icons |
| zustand | 5.0.16 | MIT | https://github.com/pmndrs/zustand |

### Вместе с транзитивными зависимостями

Полный список production-зависимостей со всеми вложенными пакетами выводит команда:
```bash
pnpm licenses list --prod
```
На момент последней проверки — 211 пакетов, все под разрешительными лицензиями: MIT (189), ISC (9), BSD-3-Clause (7), Apache-2.0 (4), 0BSD (1), MIT OR CC0-1.0 (1).

Инструменты разработки и сборки (TypeScript, Vite, Vitest, drizzle-kit) в приложение не входят.

## Docker-образы

| Образ | Что это | Лицензия |
|---|---|---|
| node:24-alpine | среда выполнения API и заглушки | MIT (Node.js) |
| postgres:16-alpine | база данных | PostgreSQL License |
| nginx:stable-alpine | раздача фронтенда и прокси к API | BSD-2-Clause |

## Модели ИИ

Не используются. Решение по заявке принимают детерминированные правила скоринга из пакета `@alfa/scoring`.

## Смоделированные интеграции

Все внешние системы банка заменены синтетической заглушкой [`apps/mock-external`](apps/mock-external). Реальных подключений нет.

| Система | Что имитирует |
|---|---|
| Реестр ЕГРЮЛ/ЕГРИП | статус компании, дата регистрации, ОКВЭД, адрес, руководитель |
| ФНС | наличие налоговой задолженности |
| БКИ | кредитная история и текущие платежи; запрос только с согласием клиента |
| Подписание договора | выдаёт код подтверждения; по условиям кейса код показывается прямо в кабинете, без СМС и почты |
| Выдача кредита | имитирует зачисление денег на счёт |

Данные заглушки — синтетические: 7 демо-компаний в [`packages/shared/demo-companies.json`](packages/shared/demo-companies.json). Любое совпадение с реальными организациями случайно.
