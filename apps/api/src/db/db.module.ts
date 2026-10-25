import { Global, Module } from '@nestjs/common';
import { createDb } from './client';

/** Ключ, по которому сервисы просят подключение к базе */
export const DB = 'DB';

@Global()
@Module({
  providers: [{ provide: DB, useFactory: () => createDb().db }],
  exports: [DB],
})
export class DbModule {}