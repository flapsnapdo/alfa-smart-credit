# API: NestJS. При старте контейнера — миграции, демо-данные, сервер
FROM node:24-alpine
WORKDIR /app
RUN corepack enable

# Сначала только файлы зависимостей: пока они не меняются, Docker берёт установку из кэша
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/scoring/package.json packages/scoring/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter api...

# Потом исходники и сборка. Пакет скоринга собираем первым — API берёт его из packages/scoring/dist
COPY packages/scoring packages/scoring
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @alfa/scoring build && pnpm --filter api build

WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Миграции → демо-данные (повторный запуск ничего не дублирует) → сервер
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/db/seed.js && node dist/main.js"]
