# Этап 1: Сборка проекта
FROM node:22-alpine AS build
WORKDIR /app

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Копируем файлы зависимостей и устанавливаем их
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Копируем исходный код и собираем проект
COPY . .
RUN pnpm run build

# Этап 2: Запуск через Nginx
FROM nginx:stable-alpine
# Копируем собранные файлы из первого этапа
COPY --from=build /app/dist /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]