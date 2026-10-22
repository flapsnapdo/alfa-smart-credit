import { SetMetadata } from '@nestjs/common';
import { Role } from '../db/schema';

export const ROLES = 'roles';

/** Пометка «только для этих ролей», например @Roles('ANALYST') */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);