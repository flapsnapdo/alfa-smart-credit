import { AnalystModule } from './analyst/analyst.module';
import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { ExplanationModule } from './explanation/explanation.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { RegistryModule } from './registry/registry.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [DbModule, AuthModule, ProductsModule, RegistryModule, ApplicationsModule, ExplanationModule, AnalystModule, ContractsModule, DocumentsModule],
  controllers: [HealthController],
})
export class AppModule {}
