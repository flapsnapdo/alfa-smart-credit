import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../db/schema';
import { IS_PUBLIC } from './public.decorator';
import { ROLES } from './roles.decorator';

/** Охранник: пропускает запрос дальше, только если в нём правильный токен и подходящая роль */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];

    // 1. Ручка помечена @Public() — пропускаем без проверок
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    // 2. Достаём токен из заголовка «Authorization: Bearer <токен>»
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Нужно войти в систему');

    // 3. Проверяем подпись и срок действия токена
    try {
      const payload = await this.jwt.verifyAsync(header.slice(7));
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }

    // 4. Если у ручки есть @Roles(...) — проверяем роль
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, targets);
    if (roles?.length && !roles.includes(req.user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return true;
  }
}