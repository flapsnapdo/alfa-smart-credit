import { Module } from '@nestjs/common';
import { ExternalClient } from './external.client';

@Module({
  providers: [ExternalClient],
  exports: [ExternalClient],
})
export class ExternalModule {}