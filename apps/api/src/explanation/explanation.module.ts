import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { ExplanationController } from './explanation.controller';
import { ExplanationService } from './explanation.service';

@Module({
  imports: [ApplicationsModule],
  controllers: [ExplanationController],
  providers: [ExplanationService],
})
export class ExplanationModule {}
