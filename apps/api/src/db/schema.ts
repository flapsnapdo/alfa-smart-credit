import {
  bigint, boolean, customType, date, doublePrecision, index, integer, jsonb,
  pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid,
} from 'drizzle-orm/pg-core';
import type { Factor, Grade, Offer, ScoringInput, StopFactor } from '@alfa/scoring';

// Перечисления: в базе станут типами ENUM, значения только из списка
export const roleEnum = pgEnum('role', ['CLIENT', 'ANALYST']);
export const companyTypeEnum = pgEnum('company_type', ['LLC', 'IE']);
export const companyStatusEnum = pgEnum('company_status', ['ACTIVE', 'LIQUIDATING', 'LIQUIDATED', 'BANKRUPT']);
export const memberPositionEnum = pgEnum('member_position', ['OWNER', 'CEO', 'CFO', 'ACCOUNTANT', 'OTHER']);
export const productCodeEnum = pgEnum('product_code', ['OVERDRAFT', 'WORKING_CAPITAL', 'EQUIPMENT']);

export const purposeEnum = pgEnum('purpose', ['CASH_GAP', 'WORKING_CAPITAL', 'EQUIPMENT', 'OTHER']);
export const applicationStatusEnum = pgEnum('application_status', [
  'DRAFT', 'SUBMITTED', 'VALIDATION', 'INFO_REQUESTED', 'ENRICHMENT', 'SCORING', 'MANUAL_REVIEW',
  'APPROVED', 'COUNTER_OFFER', 'SIGNING', 'ISSUED', 'REJECTED', 'CANCELLED', 'EXPIRED',
]);
export const actorTypeEnum = pgEnum('actor_type', ['CLIENT', 'ANALYST', 'SYSTEM']);
export const checkSourceEnum = pgEnum('check_source', ['REGISTRY', 'TAX', 'BKI']);
export const decisionTypeEnum = pgEnum('decision_type', ['APPROVE', 'COUNTER_OFFER', 'MANUAL_REVIEW', 'REJECT']);
export const docTypeEnum = pgEnum('doc_type', ['FINANCIAL_STATEMENTS', 'EQUIPMENT_INVOICE', 'OTHER']);

export type Role = (typeof roleEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type ActorType = (typeof actorTypeEnum.enumValues)[number];
export type CheckSource = (typeof checkSourceEnum.enumValues)[number];
export type DocType = (typeof docTypeEnum.enumValues)[number];

// Деньги — bigint в копейках; mode 'number' — в коде обычное число
const money = (name: string) => bigint(name, { mode: 'number' });
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: roleEnum('role').notNull(),
  createdAt: createdAt(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  inn: text('inn').notNull().unique(),
  ogrn: text('ogrn'),
  type: companyTypeEnum('type').notNull(),
  name: text('name').notNull(),
  status: companyStatusEnum('status').notNull().default('ACTIVE'),
  registeredAt: date('registered_at'),
  okved: text('okved'),
  okvedName: text('okved_name'),
  address: text('address'),
  directorName: text('director_name'),
  createdAt: createdAt(),
});

// Связь «пользователь ↔ компания»: у бухгалтера Ольги — три компании
export const companyMembers = pgTable('company_members', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  position: memberPositionEnum('position').notNull().default('OWNER'),
}, (t) => [primaryKey({ columns: [t.userId, t.companyId] })]);

export const companyFinancials = pgTable('company_financials', {
  companyId: uuid('company_id').primaryKey().references(() => companies.id, { onDelete: 'cascade' }),
  avgMonthlyRevenue: money('avg_monthly_revenue').notNull(),
  revenueLast6m: money('revenue_last_6m').notNull(),
  revenuePrev6m: money('revenue_prev_6m').notNull(),
  existingMonthlyPayments: money('existing_monthly_payments').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: productCodeEnum('code').notNull().unique(),
  name: text('name').notNull(),
  minAmount: money('min_amount').notNull(),
  maxAmount: money('max_amount').notNull(),
  minTerm: integer('min_term').notNull(),
  maxTerm: integer('max_term').notNull(),
  baseRate: doublePrecision('base_rate').notNull(),
  revenueMultiplier: doublePrecision('revenue_multiplier').notNull(),
  minBusinessAgeMonths: integer('min_business_age_months').notNull(),
  autoDecisionLimit: money('auto_decision_limit').notNull(),
  annuity: boolean('annuity').notNull(),
  requiredDocs: jsonb('required_docs').$type<{ docType: string; fromAmount: number }[]>().notNull().default([]),
});

// ── Заявки ─────────────────────────────────────────────────────────
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  seq: serial('seq').notNull(),                       // порядковый номер для красивого номера заявки
  companyId: uuid('company_id').notNull().references(() => companies.id),
  applicantId: uuid('applicant_id').notNull().references(() => users.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  purpose: purposeEnum('purpose').notNull(),
  requestedAmount: money('requested_amount').notNull(),
  requestedTerm: integer('requested_term').notNull(),
  status: applicationStatusEnum('status').notNull().default('DRAFT'),
  bkiConsentAt: timestamp('bki_consent_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  version: integer('version').notNull().default(0),   // защита от одновременных изменений
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('applications_status_idx').on(t.status)]);

// История смены статусов: только добавляем строки, никогда не меняем и не удаляем
export const applicationStatusHistory = pgTable('application_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  fromStatus: applicationStatusEnum('from_status'),
  toStatus: applicationStatusEnum('to_status').notNull(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  reason: text('reason'),
  createdAt: createdAt(),
}, (t) => [index('status_history_app_idx').on(t.applicationId)]);

// ── Конвейер: внешние проверки, скоринг, решение ───────────────────

// Что ответили реестр, налоговая и БКИ — чтобы аналитик видел, на чём основано решение
export const externalChecks = pgTable('external_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  source: checkSourceEnum('source').notNull(),
  ok: boolean('ok').notNull(),
  httpStatus: integer('http_status'),
  durationMs: integer('duration_ms').notNull(),
  payload: jsonb('payload'),
  createdAt: createdAt(),
}, (t) => [index('external_checks_app_idx').on(t.applicationId)]);

// Результат скоринга: баллы, рейтинг, факторы и входные данные, по которым считали
export const scoringResults = pgTable('scoring_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  grade: text('grade').$type<Grade>().notNull(),
  factors: jsonb('factors').$type<Factor[]>().notNull(),
  stopFactors: jsonb('stop_factors').$type<StopFactor[]>().notNull(),
  input: jsonb('input').$type<ScoringInput>().notNull(),
  rulesVersion: text('rules_version').notNull(),
  createdAt: createdAt(),
}, (t) => [index('scoring_results_app_idx').on(t.applicationId)]);

// Решение по заявке: от системы или от аналитика. Последнее по времени — действующее
export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  type: decisionTypeEnum('type').notNull(),
  rate: doublePrecision('rate'),
  maxAvailableAmount: money('max_available_amount').notNull(),
  offer: jsonb('offer').$type<Offer>(),
  alternatives: jsonb('alternatives').$type<Offer[]>().notNull().default([]),
  reasons: jsonb('reasons').$type<string[]>().notNull().default([]),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  createdAt: createdAt(),
}, (t) => [index('decisions_app_idx').on(t.applicationId)]);

// ── Договор: принятое предложение, подписание и выдача ─────────────
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().unique().references(() => applications.id, { onDelete: 'cascade' }),
  number: text('number').notNull().unique(),           // ДГ-2026-000042
  offer: jsonb('offer').$type<Offer>().notNull(),      // условия, которые принял клиент
  signRequestId: text('sign_request_id'),
  demoSignCode: text('demo_sign_code'),                // по условиям кейса всё внутри продукта: код показываем в кабинете, без СМС
  signedAt: timestamp('signed_at', { withTimezone: true }),
  payoutId: text('payout_id'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  createdAt: createdAt(),
});

// ── Документы и дозапрос ───────────────────────────────────────────

// Байты файла. Для хакатона храним прямо в PostgreSQL: не нужен отдельный том в Docker и нет проблем с путями.
// В настоящем банке это было бы объектное хранилище (S3), а в базе — только ссылка
const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

// Документы, которые загрузил клиент
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  docType: docTypeEnum('doc_type').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  content: bytea('content').notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index('documents_app_idx').on(t.applicationId)]);

// Запросы документов: от системы (не хватает обязательного) или от аналитика.
// Запрос закрыт, когда клиент загрузил документ этого типа (fulfilledAt)
export const infoRequests = pgTable('info_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  docType: docTypeEnum('doc_type').notNull(),
  comment: text('comment'),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index('info_requests_app_idx').on(t.applicationId)]);
