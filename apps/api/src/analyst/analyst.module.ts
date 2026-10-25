import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { DocumentsModule } from '../documents/documents.module';
import { AnalystController } from './analyst.controller';
import { AnalystService } from './analyst.service';

@Module({
  imports: [ApplicationsModule, DocumentsModule],
  controllers: [AnalystController],
  providers: [AnalystService],
})
export class AnalystModule {}