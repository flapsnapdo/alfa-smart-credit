import { Injectable, Logger } from '@nestjs/common';

/** Результат запроса во внешний сервис. Ошибки не бросаем — конвейер сам решает, что делать */
export interface CallResult<T> {
  ok: boolean;
  status: number | null;   // HTTP-код; null — сервис вообще не ответил
  data: T | null;
  error: string | null;
  durationMs: number;
}

@Injectable()
export class ExternalClient {
  private readonly logger = new Logger(ExternalClient.name);
  private readonly baseUrl = process.env.MOCK_EXTERNAL_URL ?? 'http://127.0.0.1:4001';

  /** GET, если body не передан, иначе POST. Таймаут 3 с, при сбое — ещё одна попытка */
  async call<T>(path: string, body?: unknown): Promise<CallResult<T>> {
    const started = Date.now();
    let status: number | null = null;
    let error = '';

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: body === undefined ? 'GET' : 'POST',
          headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        status = res.status;
        const data = await res.json().catch(() => null);
        if (res.ok) return { ok: true, status, data: data as T, error: null, durationMs: Date.now() - started };
        error = data?.message ?? `HTTP ${res.status}`;
        if (res.status < 500) break;   // 4xx — ошибка в запросе, повтор не поможет
      } catch (e) {
        error = (e as Error).message;  // таймаут или сервис не запущен
      }
      this.logger.warn(`${path}: ${error} (попытка ${attempt})`);
    }
    return { ok: false, status, data: null, error, durationMs: Date.now() - started };
  }
}