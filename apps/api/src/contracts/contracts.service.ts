import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException,
  ServiceUnavailableException, UnprocessableEntityException,
} from '@nestjs/common';
import { formatRub } from '@alfa/scoring';
import { eq } from 'drizzle-orm';
import { ApplicationsService } from '../applications/applications.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import { contracts } from '../db/schema';
import { ExternalClient } from '../external/external.client';

@Injectable()
export class ContractsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
    private readonly external: ExternalClient,
  ) {}

  /** Клиент принимает предложение → создаём договор и запрашиваем код подписи */
  async accept(user: AuthUser, id: string, offerIndex = 0) {
    const app = await this.apps.get(user, id);   // 403, если заявка чужая
    if (app.status !== 'APPROVED' && app.status !== 'COUNTER_OFFER') {
      throw new ConflictException({ code: 'INVALID_TRANSITION', message: 'Принять можно только одобренную заявку или контрпредложение' });
    }

    // Основное предложение и альтернативы — клиент выбирает по номеру
    const options = app.decision?.offer ? [app.decision.offer, ...app.decision.alternatives] : [];
    const offer = options[offerIndex];
    if (!offer) throw new BadRequestException('Такого варианта нет в предложении');

    // Сначала сервис подписи: если он недоступен, статус заявки не меняем
    const sign = await this.external.call<{ requestId: string; demoCode: string }>('/sign/request', { applicationId: id });
    if (!sign.ok || !sign.data) throw new ServiceUnavailableException('Сервис подписи недоступен, попробуйте позже');
    const { requestId, demoCode } = sign.data;

    await this.apps.changeStatus(id, 'SIGNING', 'CLIENT', user.id,
      `Клиент принял предложение: ${formatRub(offer.amount)} на ${offer.term} мес под ${offer.rate}%`, {},
      async (tx) => {
        await tx.insert(contracts).values({
          applicationId: id,
          number: app.number.replace('ЗК', 'ДГ'),
          offer,
          signRequestId: requestId,
          demoSignCode: demoCode,
        });
      });
    return this.contract(user, id);
  }

  /** Договор по заявке: условия, статус подписи и выдачи */
  async contract(user: AuthUser, id: string) {
    const app = await this.apps.get(user, id);
    const [c] = await this.db.select().from(contracts).where(eq(contracts.applicationId, id));
    if (!c) throw new NotFoundException('Договора ещё нет — сначала примите предложение');
    return {
      number: c.number,
      status: app.status,
      offer: c.offer,
      signedAt: c.signedAt,
      issuedAt: c.issuedAt,
      payoutId: c.payoutId,
      // По условиям кейса всё происходит внутри продукта: код показываем в кабинете, пока договор не подписан
      demoSignCode: c.signedAt ? null : c.demoSignCode,
    };
  }

  /** Подписание кодом → выдача денег → ISSUED */
  async sign(user: AuthUser, id: string, code: string) {
    const app = await this.apps.get(user, id);
    if (app.status !== 'SIGNING') {
      throw new ConflictException({ code: 'INVALID_TRANSITION', message: 'Подписать можно только заявку в статусе «Подписание договора»' });
    }
    const [c] = await this.db.select().from(contracts).where(eq(contracts.applicationId, id));

    // 1. Подпись. Если договор уже подписан (выдача сорвалась в прошлый раз) — этот шаг пропускаем
    if (!c.signedAt) {
      const r = await this.external.call('/sign/confirm', { requestId: c.signRequestId, code });
      if (r.status === 422) throw new UnprocessableEntityException({ code: 'INVALID_CODE', message: 'Неверный код подтверждения' });
      if (!r.ok) throw new ServiceUnavailableException('Сервис подписи недоступен, попробуйте позже');
      await this.db.update(contracts).set({ signedAt: new Date() }).where(eq(contracts.id, c.id));
    }

    // 2. Выдача
    const payout = await this.external.call<{ payoutId: string }>('/payout', { amount: c.offer.amount, contractNumber: c.number });
    if (!payout.ok || !payout.data) {
      throw new ServiceUnavailableException('Договор подписан, но выдача временно недоступна — повторите через минуту');
    }
    const { payoutId } = payout.data;

    await this.apps.changeStatus(id, 'ISSUED', 'CLIENT', user.id,
      `Договор ${c.number} подписан, ${formatRub(c.offer.amount)} зачислены на счёт`, {},
      async (tx) => {
        await tx.update(contracts).set({ payoutId, issuedAt: new Date() }).where(eq(contracts.id, c.id));
      });
    return this.contract(user, id);
  }
}