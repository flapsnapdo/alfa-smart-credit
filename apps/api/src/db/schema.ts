import {
  bigint, boolean, date, doublePrecision, index, integer, jsonb,
  pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid,
} from 'drizzle-orm/pg-core';

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

export type Role = (typeof roleEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type ActorType = (typeof actorTypeEnum.enumValues)[number];

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