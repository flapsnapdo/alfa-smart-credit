import { DEFAULT_PRODUCTS } from '@alfa/scoring';
import demo from '@alfa/shared/demo-companies.json';
import bcrypt from 'bcryptjs';
import { createDb } from './client';
import { companies, companyFinancials, companyMembers, products, users } from './schema';

const DEMO_PASSWORD = 'Demo2026!';

const DEMO_USERS = [
  { email: 'anna@demo.ru', fullName: 'Анна Смирнова', role: 'CLIENT' as const },
  { email: 'igor@demo.ru', fullName: 'Игорь Волков', role: 'CLIENT' as const },
  { email: 'olga@demo.ru', fullName: 'Ольга Белова', role: 'CLIENT' as const },
  { email: 'kozlov@demo.ru', fullName: 'Павел Козлов', role: 'CLIENT' as const },
  { email: 'analyst@demo.ru', fullName: 'Дмитрий Орлов', role: 'ANALYST' as const },
];

/** Какие документы нужны для продукта и с какой суммы (в копейках) */
const REQUIRED_DOCS: Record<string, { docType: string; fromAmount: number }[]> = {
  OVERDRAFT: [],
  WORKING_CAPITAL: [{ docType: 'FINANCIAL_STATEMENTS', fromAmount: 3_000_000_00 + 1 }],
  EQUIPMENT: [{ docType: 'EQUIPMENT_INVOICE', fromAmount: 0 }],
};

async function main() {
  const { db, pool } = createDb();

  // 1. Пользователи — пароль храним только в виде хэша
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.insert(users)
    .values(DEMO_USERS.map((u) => ({ ...u, passwordHash })))
    .onConflictDoNothing();

  // 2. Продукты — берём из пакета скоринга, чтобы параметры везде совпадали
  await db.insert(products)
    .values(DEFAULT_PRODUCTS.map((p) => ({
      code: p.code, name: p.name,
      minAmount: p.minAmount, maxAmount: p.maxAmount,
      minTerm: p.minTerm, maxTerm: p.maxTerm,
      baseRate: p.baseRate, revenueMultiplier: p.revenueMultiplier,
      minBusinessAgeMonths: p.minBusinessAgeMonths,
      autoDecisionLimit: p.autoDecisionLimit, annuity: p.annuity,
      requiredDocs: REQUIRED_DOCS[p.code],
    })))
    .onConflictDoNothing();

  // 3. Компании
  for (const c of demo.companies) {
    await db.insert(companies).values({
      inn: c.inn, ogrn: c.ogrn, name: c.name,
      type: c.type as 'LLC' | 'IE',
      status: c.status as 'ACTIVE' | 'LIQUIDATED',
      registeredAt: c.registeredAt,
      okved: c.okved, okvedName: c.okvedName,
      address: c.address, directorName: c.directorName,
    }).onConflictDoNothing();
  }

  // 4. Связи «пользователь ↔ компания» и финансы.
  //    Сначала читаем id, которые база присвоила выше
  const userId = new Map((await db.select().from(users)).map((u) => [u.email, u.id]));
  const companyId = new Map((await db.select().from(companies)).map((c) => [c.inn, c.id]));

  for (const c of demo.companies) {
    const cid = companyId.get(c.inn)!;
    await db.insert(companyMembers).values({
      userId: userId.get(c.owner)!,
      companyId: cid,
      position: c.position as 'OWNER' | 'CEO' | 'ACCOUNTANT',
    }).onConflictDoNothing();

    await db.insert(companyFinancials).values({
      companyId: cid,
      avgMonthlyRevenue: c.fin.avgMonthlyRevenue,
      revenueLast6m: c.fin.revenueLast6m,
      revenuePrev6m: c.fin.revenuePrev6m,
      existingMonthlyPayments: c.fin.existingMonthlyPayments,
    }).onConflictDoNothing();
  }

  await pool.end();
  console.log(`Готово: ${DEMO_USERS.length} пользователей, ${DEFAULT_PRODUCTS.length} продукта, ${demo.companies.length} компаний`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});