import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

/** Ответ реестра ЕГРЮЛ/ЕГРИП (сейчас — мок) */
export interface RegistryRecord {
  inn: string;
  ogrn: string;
  type: 'LLC' | 'IE';
  name: string;
  status: 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'BANKRUPT';
  registeredAt: string;
  okved: string;
  okvedName: string;
  address: string;
  directorName: string;
}

@Injectable()
export class RegistryService {
  private readonly logger = new Logger(RegistryService.name);
  private readonly baseUrl = process.env.MOCK_EXTERNAL_URL ?? 'http://localhost:4001';

  async lookup(inn: string): Promise<RegistryRecord> {
    // ИНН: 10 цифр у организаций, 12 — у ИП
    if (!/^(\d{10}|\d{12})$/.test(inn)) {
      throw new BadRequestException('ИНН должен состоять из 10 или 12 цифр');
    }

    // Две попытки: если внешний сервис моргнул, пробуем ещё раз
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}/registry/${inn}`, {
          signal: AbortSignal.timeout(3000), // ждём не больше 3 секунд
        });
        if (res.status === 404) {
          throw new NotFoundException('Компания с таким ИНН не найдена в реестре — заполните данные вручную');
        }
        if (res.ok) return (await res.json()) as RegistryRecord;
        this.logger.warn(`Реестр ответил ${res.status} (попытка ${attempt})`);
      } catch (e) {
        if (e instanceof NotFoundException) throw e;
        this.logger.warn(`Реестр недоступен: ${(e as Error).message} (попытка ${attempt})`);
      }
    }
    throw new ServiceUnavailableException('Реестр временно недоступен, попробуйте позже');
  }
}