import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CompanyStatus, decide, DecisionType, industryRiskByOkved, score, ScoringInput } from '@alfa/scoring';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import {
  ApplicationStatus, applications, CheckSource, companies, companyFinancials, decisions,
  documents, externalChecks, infoRequests, products, scoringResults,
} from '../db/schema';
import { DOC_TITLES, missingDocTypes } from '../documents/doc-requirements';
import { ExternalClient } from '../external/external.client';
import { ApplicationsService } from './applications.service';

/** Что нам нужно из ответов внешних сервисов */
interface RegistryData { status: CompanyStatus; registeredAt: string; okved: string }
interface TaxData { hasTaxDebt: boolean }
interface BkiData {
  totalMonthlyPayments: number;
  hasClosedLoans: boolean;
  maxDelinquencyDays12m: number;
  currentDelinquencyDays: number;
  inquiries30d: number;
}
interface Enriched { registry: RegistryData; tax: TaxData; bki: BkiData }

/** Пауза между этапами, чтобы на демо было видно, как меняется статус */
const STEP_MS = Number(process.env.PIPELINE_STEP_MS ?? 1500);
const pause = () => new Promise((resolve) => setTimeout(resolve, STEP_MS));

/** Статусы, в которых заявкой занимается конвейер. После перезапуска сервера такие заявки подхватываем */
const IN_PROGRESS: ApplicationStatus[] = ['SUBMITTED', 'VALIDATION', 'ENRICHMENT', 'SCORING'];

const STATUS_BY_DECISION: Record<DecisionType, ApplicationStatus> = {
  APPROVE: 'APPROVED',
  COUNTER_OFFER: 'COUNTER_OFFER',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  REJECT: 'REJECTED',
};

/** Сколько полных месяцев прошло с даты регистрации */
function monthsSince(date: string): number {
  const from = new Date(date);
  const now = new Date();
  const months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  return now.getDate() < from.getDate() ? months - 1 : months;
}

@Injectable()
export class PipelineService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
    private readonly external: ExternalClient,
  ) {}

  /** Сервер перезапустили посреди обработки — продолжаем заявки с того этапа, где они остановились */
  async onApplicationBootstrap() {
    const stuck = await this.db.select({ id: applications.id }).from(applications)
      .where(inArray(applications.status, IN_PROGRESS));
    if (stuck.length > 0) this.logger.log(`После перезапуска продолжаем обработку заявок: ${stuck.length}`);
    for (const { id } of stuck) this.start(id);
  }

  /** Запуск в фоне: клиент сразу получает ответ, а заявка дальше идёт по этапам сама */
  start(id: string): void {
    this.run(id).catch((e) => this.logger.error(`Заявка ${id}: конвейер остановлен — ${(e as Error).message}`));
  }

  /**
   * Конвейер смотрит на текущий статус и делает следующий шаг — и так, пока заявка не дойдёт
   * до решения или не начнёт ждать человека. Поэтому его можно запустить с любого этапа:
   * после отправки, после дозагрузки документов или после перезапуска сервера.
   */
  private async run(id: string) {
    let enriched: Enriched | null = null;

    for (;;) {
      const row = await this.load(id);
      if (!row) return;

      switch (row.app.status) {
        case 'SUBMITTED':
          await pause();
          await this.apps.changeStatus(id, 'VALIDATION', 'SYSTEM', null, 'Проверяем заявку');
          break;

        case 'VALIDATION':
          if (!(await this.validate(id, row))) return;   // не хватает документов — ждём клиента
          break;

        case 'ENRICHMENT':
          enriched = await this.enrich(id, row);
          await pause();
          if (!enriched) return this.toManualReview(id);
          await this.apps.changeStatus(id, 'SCORING', 'SYSTEM', null, 'Данные из реестра, налоговой и БКИ получены');
          break;

        case 'SCORING':
          // После перезапуска ответов внешних сервисов в памяти нет — запрашиваем их снова
          enriched ??= await this.enrich(id, row);
          if (!enriched) return this.toManualReview(id);
          return this.scoreAndDecide(id, row, enriched);

        default:
          return;   // решение принято или заявка ждёт клиента/аналитика — конвейер своё отработал
      }
    }
  }

  /** Заявка со всем нужным для конвейера: компания, продукт, финансы */
  private async load(id: string) {
    const [row] = await this.db
      .select({ app: applications, company: companies, product: products, fin: companyFinancials })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .innerJoin(products, eq(products.id, applications.productId))
      .leftJoin(companyFinancials, eq(companyFinancials.companyId, applications.companyId))
      .where(eq(applications.id, id));
    return row ?? null;
  }

  /** ── 1. Комплектность документов. true — можно идти дальше, false — запросили документы у клиента */
  private async validate(id: string, row: NonNullable<Awaited<ReturnType<PipelineService['load']>>>) {
    const uploaded = await this.db.select({ docType: documents.docType }).from(documents)
      .where(eq(documents.applicationId, id));
    const open = await this.db.select({ docType: infoRequests.docType }).from(infoRequests)
      .where(and(eq(infoRequests.applicationId, id), isNull(infoRequests.fulfilledAt)));
    const missing = missingDocTypes(
      row.product.requiredDocs, row.app.requestedAmount,
      uploaded.map((d) => d.docType), open.map((r) => r.docType),
    );

    await pause();
    if (missing.length === 0) {
      await this.apps.changeStatus(id, 'ENRICHMENT', 'SYSTEM', null, 'Данные и документы в порядке');
      return true;
    }

    // Запрос создаём только на то, что ещё не запрошено, — чтобы не дублировать
    const alreadyRequested = new Set(open.map((r) => r.docType));
    await this.apps.changeStatus(id, 'INFO_REQUESTED', 'SYSTEM', null,
      `Нужны документы: ${missing.map((t) => DOC_TITLES[t]).join(', ')}`, {},
      async (tx) => {
        const toRequest = missing.filter((t) => !alreadyRequested.has(t));
        if (toRequest.length > 0) {
          await tx.insert(infoRequests).values(toRequest.map((docType) => ({
            applicationId: id, docType, actorType: 'SYSTEM' as const, comment: 'Обязательный документ для этого продукта',
          })));
        }
      });
    return false;
  }

  /** ── 2. Обогащение: реестр, налоговая и БКИ — параллельно. null — кто-то не ответил */
  private async enrich(id: string, row: NonNullable<Awaited<ReturnType<PipelineService['load']>>>): Promise<Enriched | null> {
    const { app, company } = row;
    const [registry, tax, bki] = await Promise.all([
      this.check<RegistryData>(id, 'REGISTRY', `/registry/${company.inn}`),
      this.check<TaxData>(id, 'TAX', `/tax/${company.inn}`),
      this.check<BkiData>(id, 'BKI', '/bki/report', { inn: company.inn, consent: app.bkiConsentAt !== null }),
    ]);
    return registry && tax && bki ? { registry, tax, bki } : null;
  }

  private async toManualReview(id: string) {
    await this.apps.changeStatus(id, 'MANUAL_REVIEW', 'SYSTEM', null,
      'Не удалось получить данные из внешних источников — заявку посмотрит специалист');
  }

  /** ── 3. Скоринг и решение — чистые функции из пакета @alfa/scoring */
  private async scoreAndDecide(
    id: string, row: NonNullable<Awaited<ReturnType<PipelineService['load']>>>, { registry, tax, bki }: Enriched,
  ) {
    const { app, product, fin } = row;
    if (!fin) return this.toManualReview(id);   // нет финансовых данных — оценить не можем

    const input: ScoringInput = {
      businessAgeMonths: monthsSince(registry.registeredAt),
      companyStatus: registry.status,
      avgMonthlyRevenue: fin.avgMonthlyRevenue,
      revenueLast6m: fin.revenueLast6m,
      revenuePrev6m: fin.revenuePrev6m,
      currentMonthlyPayments: bki.totalMonthlyPayments,
      maxDelinquencyDays12m: bki.maxDelinquencyDays12m,
      currentDelinquencyDays: bki.currentDelinquencyDays,
      hasClosedLoans: bki.hasClosedLoans,
      inquiries30d: bki.inquiries30d,
      industryRisk: industryRiskByOkved(registry.okved),
      hasTaxDebt: tax.hasTaxDebt,
    };
    const scoring = score(input, product);
    const decision = decide({
      scoring, product,
      requestedAmount: app.requestedAmount,
      requestedTerm: app.requestedTerm,
      avgMonthlyRevenue: input.avgMonthlyRevenue,
      currentMonthlyPayments: input.currentMonthlyPayments,
    });

    await pause();
    // Результат скоринга, решение и смена статуса — одной транзакцией: либо всё, либо ничего
    await this.apps.changeStatus(id, STATUS_BY_DECISION[decision.type], 'SYSTEM', null,
      `Скоринг ${scoring.score}, рейтинг ${scoring.grade}`, {},
      async (tx) => {
        await tx.insert(scoringResults).values({
          applicationId: id, score: scoring.score, grade: scoring.grade, factors: scoring.factors,
          stopFactors: scoring.stopFactors, input, rulesVersion: scoring.rulesVersion,
        });
        await tx.insert(decisions).values({
          applicationId: id, type: decision.type, rate: decision.rate,
          maxAvailableAmount: decision.maxAvailableAmount, offer: decision.offer,
          alternatives: decision.alternatives, reasons: decision.reasons, actorType: 'SYSTEM',
        });
      });
  }

  /** Один запрос во внешний сервис + запись в журнал проверок */
  private async check<T>(applicationId: string, source: CheckSource, path: string, body?: unknown): Promise<T | null> {
    const r = await this.external.call<T>(path, body);
    await this.db.insert(externalChecks).values({
      applicationId, source, ok: r.ok, httpStatus: r.status, durationMs: r.durationMs,
      payload: r.ok ? r.data : { error: r.error },
    });
    return r.ok ? r.data : null;
  }
}
