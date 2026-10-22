import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../db/schema';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Достаёт из запроса пользователя, которого положил туда AuthGuard */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);