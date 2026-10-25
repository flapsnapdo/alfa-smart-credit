import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AcceptOfferDto, SignDto } from './contract.dto';
import { ContractsService } from './contracts.service';

@Controller('applications')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Roles('CLIENT')
  @Post(':id/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AcceptOfferDto) {
    return this.contracts.accept(user, id, dto.offerIndex);
  }

  @Get(':id/contract')
  contract(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.contract(user, id);
  }

  @Roles('CLIENT')
  @Post(':id/sign')
  @HttpCode(200)
  sign(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SignDto) {
    return this.contracts.sign(user, id, dto.code);
  }
}