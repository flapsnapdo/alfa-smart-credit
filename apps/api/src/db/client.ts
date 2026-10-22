import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/** Подключение к PostgreSQL. Адрес берётся из переменной окружения DATABASE_URL */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Не задана переменная окружения DATABASE_URL');
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export type Db = ReturnType<typeof createDb>['db'];