# Postman

- `alfa-smart-credit.postman_collection.json` — сценарии T1–T13 по шагам, каждый ответ проверяется тестами.
- `files/` — PDF для загрузки документов: счёт на оборудование и финансовая отчётность (синтетические).

Запуск из корня репозитория, когда API запущен:

```bash
npx -y newman@6.2.1 run docs/postman/alfa-smart-credit.postman_collection.json
```

Адрес API — переменная коллекции `baseUrl`, по умолчанию `http://localhost:3000/api/v1`. Другой адрес: `--env-var baseUrl=http://host:port/api/v1`.

Как запустить в самом Postman и что проверяет каждый сценарий — в [docs/test-scenarios.md](../test-scenarios.md).
