import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// В dev-режиме запросы /api уходят в API (docker compose up postgres mock-external api).
// Другой адрес API: API_URL=http://host:3000 pnpm --filter web dev
const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': apiUrl } },
  preview: { proxy: { '/api': apiUrl } },
})
