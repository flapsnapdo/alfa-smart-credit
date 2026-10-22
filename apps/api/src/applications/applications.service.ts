import {
  BadRequestException, ConflictException, ForbiddenException, Inject, Injectable,
  NotFoundException, UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { AuthUser } from '../auth/current-user.decorator';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import {
  ActorType, ApplicationStatus, applicationStatusHistory, applications, companies, companyMembers, products,
} from '../db/schema';
import { CreateApplicationDto } from './application.dto';
import { CLIENT_VIEW } from './client-view';
import { assertTransition, InvalidTransitionError } from './status-machine';

/** Номер заявки для людей: ЗК-2026-000042 */
const toNumber = (seq: number) => `ЗК-2026-${String(seq).padStart(6, '0')}`;

@Injectable()
export class ApplicationsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** id компаний, с которыми пользователь может работать */
  private async companyIdsOf(userId: string): Promise<string[]> {
    const rows = await this.db.select({ id: companyMembers.companyId }).from(companyMembers)
      .where(eq(companyMembers.userId, userId));
    return rows.map((r) => r.id);
  }

  async create(user: AuthUser, dto: CreateApplicationDto) {
    // 1. Клиент может подать заявку только от своей компании
    if (!(await this.companyIdsOf(user.id)).includes(dto.companyId)) {
      throw new ForbiddenException('Нет доступа к этой компании');
    }

    // 2. Сумма и срок должны укладываться в границы продукта
    const [product] = await this.db.select().from(products).where(eq(products.code, dto.productCode));
    if (dto.amount < product.minAmount || dto.amount > product.maxAmount) {
      throw new BadRequestException(`Сумма для продукта «${product.name}»: от ${product.minAmount / 100} до ${product.maxAmount / 100} ₽`);
    }
    if (dto.term < product.minTerm || dto.term > product.maxTerm) {
      throw new BadRequestException(`Срок для продукта «${product.name}»: от ${product.minTerm} до ${product.maxTerm} мес`);
    }

    // 3. Создаём черновик и первую запись в истории — в одной транзакции
    const id = await this.db.transaction(async (tx) => {
      const [app] = await tx.insert(applications).values({
        companyId: dto.companyId, applicantId: user.id, productId: product.id,
        purpose: dto.purpose, requestedAmount: dto.amount, requestedTerm: dto.term,
      }).returning({ id: applications.id });
      await tx.insert(applicationStatusHistory).values({
        applicationId: app.id, fromStatus: null, toStatus: 'DRAFT', actorType: 'CLIENT', actorId: user.id,
      });
      return app.id;
    });
    return this.get(user, id);
  }

  async list(user: AuthUser) {
    const companyIds = await this.companyIdsOf(user.id);
    if (companyIds.length === 0) return [];
    const rows = await this.db
      .select({ app: applications, companyName: companies.name, productName: products.name, productCode: products.code })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .innerJoin(products, eq(products.id, applications.productId))
      .where(inArray(applications.companyId, companyIds))
      .orderBy(desc(applications.createdAt));
    return rows.map((r) => ({
      id: r.app.id, number: toNumber(r.app.seq), status: r.app.status,
      clientView: CLIENT_VIEW[r.app.status],
      company: { id: r.app.companyId, name: r.companyName },
      product: { code: r.productCode, name: r.productName },
      requested: { amount: r.app.requestedAmount, term: r.app.requestedTerm },
      updatedAt: r.app.updatedAt,
    }));
  }

  async get(user: AuthUser, id: string) {
    const [row] = await this.db
      .select({ app: applications, company: companies, product: products })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .innerJoin(products, eq(products.id, applications.productId))
      .where(eq(applications.id, id));
    if (!row) throw new NotFoundException('Заявка не найдена');

    // Клиент видит только заявки своих компаний, аналитик — все
    if (user.role === 'CLIENT' && !(await this.companyIdsOf(user.id)).includes(row.app.companyId)) {
      throw new ForbiddenException('Нет доступа к этой заявке');
    }

    const { app } = row;
    return {
      id: app.id, number: toNumber(app.seq), status: app.status,
      clientView: CLIENT_VIEW[app.status],
      company: { id: row.company.id, name: row.company.name, inn: row.company.inn },
      product: { code: row.product.code, name: row.product.name },
      purpose: app.purpose,
      requested: { amount: app.requestedAmount, term: app.requestedTerm },
      bkiConsentAt: app.bkiConsentAt, submittedAt: app.submittedAt,
      version: app.version, createdAt: app.createdAt, updatedAt: app.updatedAt,
    };
  }

  async timeline(user: AuthUser, id: string) {
    await this.get(user, id); // проверка доступа
    return this.db.select().from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, id))
      .orderBy(asc(applicationStatusHistory.createdAt));
  }

  /**
   * Единственное место, где меняется статус заявки.
   * Проверка по таблице переходов + защита от гонок по version + запись в историю — в одной транзакции.
   */
  async changeStatus(
    id: string, to: ApplicationStatus, actor: ActorType, actorId: string | null,
    reason?: string, extra: Partial<typeof applications.$inferInsert> = {},
  ) {
    await this.db.transaction(async (tx) => {
      const [app] = await tx.select().from(applications).where(eq(applications.id, id));
      if (!app) throw new NotFoundException('Заявка не найдена');

      try {
        assertTransition(app.status, to, actor);
      } catch (e) {
        if (e instanceof InvalidTransitionError) {
          throw new ConflictException({ code: 'INVALID_TRANSITION', message: e.message, from: app.status, to });
        }
        throw e;
      }

      // Обновляем, только если с момента чтения никто не успел поменять заявку
      const updated = await tx.update(applications)
        .set({ ...extra, status: to, version: app.version + 1, updatedAt: new Date() })
        .where(and(eq(applications.id, id), eq(applications.version, app.version)))
        .returning({ id: applications.id });
      if (updated.length === 0) {
        throw new ConflictException({ code: 'CONCURRENT_UPDATE', message: 'Заявку уже изменили, обновите страницу' });
      }

      await tx.insert(applicationStatusHistory).values({
        applicationId: id, fromStatus: app.status, toStatus: to, actorType: actor, actorId, reason,
      });
    });
  }

  async submit(user: AuthUser, id: string, bkiConsent: boolean) {
    await this.get(user, id); // проверка доступа
    if (!bkiConsent) {
      throw new UnprocessableEntityException('Нужно согласие на запрос кредитной истории');
    }
    const now = new Date();
    await this.changeStatus(id, 'SUBMITTED', 'CLIENT', user.id, 'Клиент отправил заявку', {
      bkiConsentAt: now, submittedAt: now,
    });
    return this.get(user, id);
  }

  async cancel(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.changeStatus(id, 'CANCELLED', 'CLIENT', user.id, 'Клиент отозвал заявку');
    return this.get(user, id);
  }
}