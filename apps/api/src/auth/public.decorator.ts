import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Пометка «эта ручка доступна без входа» */
export const Public = () => SetMetadata(IS_PUBLIC, true);