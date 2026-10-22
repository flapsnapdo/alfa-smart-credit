import { Controller, Get, Query } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registry: RegistryService) {}

  /** GET /registry/lookup?inn=7701526010 — автозаполнение данных компании */
  @Get('lookup')
  lookup(@Query('inn') inn: string) {
    return this.registry.lookup(inn ?? '');
  }
}