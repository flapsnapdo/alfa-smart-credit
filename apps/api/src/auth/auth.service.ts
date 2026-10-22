import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import { companies, companyMembers, users } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase()));

    // Одинаковый ответ и для «нет такого email», и для «неверный пароль» —
    // чтобы по ответу нельзя было узнать, какие email есть в системе
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  /** Профиль и компании, к которым у пользователя есть доступ */
  async me(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    const rows = await this.db
      .select({ company: companies, position: companyMembers.position })
      .from(companyMembers)
      .innerJoin(companies, eq(companies.id, companyMembers.companyId))
      .where(eq(companyMembers.userId, userId));

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      companies: rows.map((r) => ({ ...r.company, position: r.position })),
    };
  }
}