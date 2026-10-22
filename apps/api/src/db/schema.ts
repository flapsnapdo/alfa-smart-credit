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
  companyId: uuid('company_id').primaryKey().references(() => companies.id, { onDelete: 'cascade'