import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateApplicationDto, SubmitApplicationDto } from './application.dto';
import { ApplicationsService } from './applications.service';
import { PipelineService } from './pipeline.service';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly apps: ApplicationsService,
    private readonly pipeline: PipelineService,
  ) {}

  @Roles('CLIENT')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.apps.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.apps.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.apps.get(user, id);
  }

  @Get(':id/timeline')
  timeline(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.apps.timeline(user, id);
  }

  @Roles('CLIENT')
  @Post(':id/submit')
  @HttpCode(200)
  async submit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SubmitApplicationDto) {
    const app = await this.apps.submit(user, id, dto.bkiConsent);
    this.pipeline.start(id);   // не ждём: конвейер работает в фоне
    return app;
  }

  @Roles('CLIENT')
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.apps.cancel(user, id);
  }
}