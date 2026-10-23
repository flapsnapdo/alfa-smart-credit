import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AnalystController } from './analyst.controller';
import { AnalystService } from './analyst.service';

@Module({
  imports: [ApplicationsModule],
  controllers: [AnalystController],
  providers: [AnalystService],
})
export class AnalystModule {}