import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { RegistryModule } from './registry/registry.module';

@Module({
  imports: [DbModule, AuthModule, ProductsModule, RegistryModule],
  controllers: [HealthController],
})
export class AppModule {}