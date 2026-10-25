import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RequestInfoDto } from '../documents/documents.dto';
import { AnalystDecisionDto, QueueQueryDto } from './analyst.dto';
import { AnalystService } from './analyst.service';

/** Кабинет аналитика. @Roles на классе — правило для всех ручек сразу */
@Roles('ANALYST')
@Controller('analyst/applications')
export class AnalystController {
  constructor(private readonly analyst: AnalystService) {}

  @Get()
  queue(@Query() query: QueueQueryDto) {
    return this.analyst.queue(query.status);
  }

  @Get(':id')
  card(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.analyst.card(user, id);
  }

  @Post(':id/decision')
  @HttpCode(200)
  decide(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AnalystDecisionDto) {
    return this.analyst.decide(user, id, dto);
  }

  @Post(':id/request-info')
  @HttpCode(200)
  requestInfo(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RequestInfoDto) {
    return this.analyst.requestInfo(user, id, dto);
  }
}