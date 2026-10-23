import { Inject, Injectable, Logger } from '@nestjs/common';
import { CompanyStatus, decide, DecisionType, industryRiskByOkved, score, ScoringInput } from '@alfa/scoring';
import { eq } from 'drizzle-orm';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import {
  ApplicationStatus, applications, CheckSource, companies, companyFinancials, decisions,
  externalChecks, products, scoringResults,
} from '../db/schema';
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

/** Пауза между этапами, чтобы на демо было видно, как меняется статус */
const STEP_MS = Number(process.env.PIPELINE_STEP_MS ?? 1500);
const pause = () => new Promise((resolve) => setTimeout(resolve, STEP_MS));

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
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
    private readonly external: ExternalClient,
  ) {}

  /** Запуск в фоне: клиент сразу получает ответ, а заявка дальше идёт по этапам сама */
  start(id: string): void {
    this.run(id).catch((e) => this.logger.error(`Заявка ${id}: конвейер остановлен — ${(e as Error).message}`));
  }

  private async run(id: string) {
    const [row] = await this.db
      .select({ app: applications, company: companies, product: products, fin: companyFinancials })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .innerJoin(products, eq(products.id, applications.productId))
      .leftJoin(companyFinancials, eq(companyFinancials.companyId, applications.companyId))
      .where(eq(applications.id, id));
    if (!row) return;
    const { app, company, product, fin } = row;

    // ── 1. Проверка заявки (проверку документов добавим в следующем шаге)
    await pause();
    await this.apps.changeStatus(id, 'VALIDATION', 'SYSTEM', null, 'Проверяем заявку');
    await pause();
    await this.apps.changeStatus(id, 'ENRICHMENT', 'SYSTEM', null, 'Данные заявки в порядке');

    // ── 2. Обогащение: реестр, налоговая и БКИ — параллельно
    const [registry, tax, bki] = await Promise.all([
      this.check<RegistryData>(id, 'REGISTRY', `/registry/${company.inn}`),
      this.check<TaxData>(id, 'TAX', `/tax/${company.inn}`),
      this.check<BkiData>(id, 'BKI', '/bki/report', { inn: company.inn, consent: app.bkiConsentAt !== null }),
    ]);
    await pause();
    if (!registry || !tax || !bki || !fin) {
      await this.apps.changeStatus(id, 'MANUAL_REVIEW', 'SYSTEM', null,
        'Не удалось получить данные из внешних источников — заявку посмотрит специалист');
      return;
    }
    await this.apps.changeStatus(id, 'SCORING', 'SYSTEM', null, 'Данные из реестра, налоговой и БКИ получены');

    // ── 3. Скоринг и решение — чистые функции из пакета @alfa/scoring
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

    await this.db.insert(scoringResults).values({
      applicationId: id, score: scoring.score, grade: scoring.grade, factors: scoring.factors,
      stopFactors: scoring.stopFactors, input, rulesVersion: scoring.rulesVersion,
    });
    await this.db.insert(decisions).values({
      applicationId: id, type: decision.type, rate: decision.rate,
      maxAvailableAmount: decision.maxAvailableAmount, offer: decision.offer,
      alternatives: decision.alternatives, reasons: decision.reasons, actorType: 'SYSTEM',
    });

    await pause();
    await this.apps.changeStatus(id, STATUS_BY_DECISION[decision.type], 'SYSTEM', null,
      `Скоринг ${scoring.score}, рейтинг ${scoring.grade}`);
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