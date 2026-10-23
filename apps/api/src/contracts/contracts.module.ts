import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { ExternalModule } from '../external/external.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [ApplicationsModule, ExternalModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}