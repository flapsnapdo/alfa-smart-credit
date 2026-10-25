FROM node:24-alpine
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/mock-external/package.json ./apps/mock-external/
RUN pnpm install --frozen-lockfile --prod --filter mock-external...

COPY apps/mock-external ./apps/mock-external
WORKDIR /app/apps/mock-external
ENV PORT=4001
EXPOSE 4001
CMD ["node", "src/server.js"]
