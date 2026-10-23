import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { ExplanationService } from './explanation.service';

@Controller('applications')
export class ExplanationController {
  constructor(private readonly explanation: ExplanationService) {}

  @Get(':id/explanation')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.explanation.explain(user, id);
  }
}
