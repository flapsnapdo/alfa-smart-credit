import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { monthlyPayment, Offer } from '@alfa/scoring';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { ApplicationsService, toNumber } from '../applications/applications.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import {
  ApplicationStatus, applications, companies, decisions, externalChecks, infoRequests, products, scoringResults,
} from '../db/schema';
import { DOC_TITLES } from '../documents/doc-requirements';
import { RequestInfoDto } from '../documents/documents.dto';
import { DocumentsService } from '../documents/documents.service';
import { AnalystDecisionDto, AnalystDecisionType } from './analyst.dto';

const STATUS_BY_DECISION: Record<AnalystDecisionType, ApplicationStatus> = {
  APPROVE: 'APPROVED',
  COUNTER_OFFER: 'COUNTER_OFFER',
  REJECT: 'REJECTED',
};

@Injectable()
export class AnalystService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
    private readonly docs: DocumentsService,
  ) {}

  /** Очередь: по умолчанию — заявки, которые ждут аналитика. Самые давние сверху */
  async queue(status: ApplicationStatus = 'MANUAL_REVIEW') {
    const rows = await this.db
      .select({ app: applications, company: companies, product: products })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .innerJoin(products, eq(products.id, applications.productId))
      .where(eq(applications.status, status))
      .orderBy(asc(applications.submittedAt));

    // Баллы по каждой заявке — одним запросом, а не по запросу на заявку
    const ids = rows.map((r) => r.app.id);
    const scorings = ids.length === 0 ? [] : await this.db
      .select({ applicationId: scoringResults.applicationId, score: scoringResults.score, grade: scoringResults.grade })
      .from(scoringResults)
      .where(inArray(scoringResults.applicationId, ids))
      .orderBy(asc(scoringResults.createdAt));
    const scoringByApp = new Map(scorings.map((s) => [s.applicationId, s]));   // более поздний перезапишет ранний

    return rows.map(({ app, company, product }) => ({
      id: app.id,
      number: toNumber(app.seq),
      status: app.status,
      company: { id: company.id, name: company.name, inn: company.inn },
      product: { code: product.code, name: product.name },
      requested: { amount: app.requestedAmount, term: app.requestedTerm },
      score: scoringByApp.get(app.id)?.score ?? null,
      grade: scoringByApp.get(app.id)?.grade ?? null,
      submittedAt: app.submittedAt,
    }));
  }

  /** Карточка: заявка + ответы внешних сервисов + скоринг + все решения + история */
  async card(user: AuthUser, id: string) {
    const application = await this.apps.get(user, id);   // 404, если заявки нет
    const [checks, [scoring], allDecisions, history, docs, checklist] = await Promise.all([
      this.db.select().from(externalChecks)
        .where(eq(externalChecks.applicationId, id)).orderBy(asc(externalChecks.createdAt)),
      this.db.select().from(scoringResults)
        .where(eq(scoringResults.applicationId, id)).orderBy(desc(scoringResults.createdAt)).limit(1),
      this.db.select().from(decisions)
        .where(eq(decisions.applicationId, id)).orderBy(asc(decisions.createdAt)),
      this.apps.timeline(user, id),
      this.docs.documentsOf(id),
      this.docs.checklist(id),
    ]);

    return {
      application,
      checks: checks.map((c) => ({
        source: c.source, ok: c.ok, httpStatus: c.httpStatus, durationMs: c.durationMs, payload: c.payload, createdAt: c.createdAt,
      })),
      scoring: scoring ? {
        score: scoring.score, grade: scoring.grade, factors: scoring.factors, stopFactors: scoring.stopFactors,
        input: scoring.input, rulesVersion: scoring.rulesVersion, createdAt: scoring.createdAt,
      } : null,
      decisions: allDecisions.map((d) => ({
        type: d.type, rate: d.rate, offer: d.offer, alternatives: d.alternatives, reasons: d.reasons,
        actorType: d.actorType, createdAt: d.createdAt,
      })),
      history,
      documents: docs,
      documentRequests: checklist.requests,
    };
  }

  /** Решение аналитика: новая запись в decisions + смена статуса — в одной транзакции */
  async decide(user: AuthUser, id: string, dto: AnalystDecisionDto) {
    const application = await this.apps.get(user, id);
    const [product] = await this.db.select().from(products).where(eq(products.code, application.product.code));
    const system = application.decision;   // последнее решение системы — от него берём ставку и лимит

    let offer: Offer | null = null;
    if (dto.type !== 'REJECT') {
      const amount = dto.amount ?? (dto.type === 'APPROVE' ? application.requested.amount : undefined);
      const term = dto.term ?? (dto.type === 'APPROVE' ? application.requested.term : undefined);
      if (amount === undefined || term === undefined) {
        throw new BadRequestException('Для контрпредложения укажите сумму и срок');
      }
      if (amount < product.minAmount || amount > product.maxAmount) {
        throw new BadRequestException(`Сумма для продукта «${product.name}»: от ${product.minAmount / 100} до ${product.maxAmount / 100} ₽`);
      }
      if (term < product.minTerm || term > product.maxTerm) {
        throw new BadRequestException(`Срок для продукта «${product.name}»: от ${product.minTerm} до ${product.maxTerm} мес`);
      }
      const rate = dto.rate ?? system?.rate ?? product.baseRate;
      offer = { productCode: product.code, amount, term, rate, monthlyPayment: monthlyPayment(amount, rate, term, product.annuity) };
    }

    await this.apps.changeStatus(id, STATUS_BY_DECISION[dto.type], 'ANALYST', user.id, dto.comment, {}, async (tx) => {
      await tx.insert(decisions).values({
        applicationId: id,
        type: dto.type,
        rate: offer?.rate ?? null,
        maxAvailableAmount: system?.maxAvailableAmount ?? offer?.amount ?? 0,
        offer,
        reasons: dto.type === 'REJECT' ? [dto.comment] : [],
        actorType: 'ANALYST',
        actorId: user.id,
      });
    });
    return this.apps.get(user, id);
  }

  /** Аналитик запрашивает документ: заявка уходит клиенту, после загрузки конвейер продолжит сам */
  async requestInfo(user: AuthUser, id: string, dto: RequestInfoDto) {
    await this.apps.changeStatus(id, 'INFO_REQUESTED', 'ANALYST', user.id,
      `Запрошен документ «${DOC_TITLES[dto.docType]}»: ${dto.comment}`, {},
      async (tx) => {
        await tx.insert(infoRequests).values({
          applicationId: id, docType: dto.docType, comment: dto.comment, actorType: 'ANALYST', actorId: user.id,
        });
      });
    return this.apps.get(user, id);
  }
}
