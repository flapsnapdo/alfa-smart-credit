# Этап 1: Сборка проекта
FROM node:24-alpine AS build
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

# Устанавливаем pnpm и зависимости
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter web...

# Копируем исходный код и собираем
COPY . .
RUN pnpm --filter web build

# Этап 2: Запуск через Nginx
FROM nginx:stable-alpine

# Копируем nginx конфиг
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]