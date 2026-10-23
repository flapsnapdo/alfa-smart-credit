import { Module } from '@nestjs/common';
import { ExternalModule } from '../external/external.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PipelineService } from './pipeline.service';

@Module({
  imports: [ExternalModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, PipelineService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}