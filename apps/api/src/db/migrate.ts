import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client';

/**
 * Применяет миграции из папки apps/api/drizzle. Запускается при старте контейнера.
 * В отличие от drizzle-kit (это dev-инструмент), работает на одной drizzle-orm — той же, что и сам API.
 * Уже применённые миграции пропускаются: drizzle помнит их в таблице drizzle.__drizzle_migrations.
 */
async function main() {
  const { db, pool } = createDb();
  await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  await pool.end();
  console.log('Миграции применены');
}

main().catch((e) => {
  console.error('Не удалось применить миграции:', e);
  process.exit(1);
});
