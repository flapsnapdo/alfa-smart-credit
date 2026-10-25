# Кабинет: сборка React-приложения и раздача через nginx, который проксирует /api в API

# Этап 1: сборка
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

# Сначала только файлы зависимостей: пока они не меняются, Docker берёт установку из кэша
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web...

COPY apps/web apps/web
RUN pnpm --filter web build

# Этап 2: раздача через nginx
FROM nginx:stable-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
