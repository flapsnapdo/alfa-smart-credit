import { BadRequestException, ConflictException, ForbiddenException, PayloadTooLargeException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';

/** Подделка ответа Express: запоминаем статус и тело, которые выставит фильтр */
function run(exception: unknown) {
  const out: { status?: number; body?: Record<string, unknown> } = {};
  const res = {
    status(code: number) { out.status = code; return this; },
    json(body: Record<string, unknown>) { out.body = body; return this; },
  };
  const host = { switchToHttp: () => ({ getResponse: () => res }) };
  new ApiExceptionFilter().catch(exception, host as never);
  return out;
}

describe('единый формат ошибок', () => {
  it('ошибки валидации DTO: строка в message и список в details', () => {
    const r = run(new BadRequestException(['comment must be longer', 'type must be one of']));
    expect(r.status).toBe(400);
    expect(r.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'comment must be longer; type must be one of',
      details: ['comment must be longer', 'type must be one of'],
    });
  });

  it('свой код сервиса сохраняется вместе с доп. полями', () => {
    const r = run(new ConflictException({ code: 'INVALID_TRANSITION', message: 'Переход недоступен', from: 'DRAFT', to: 'ISSUED' }));
    expect(r.status).toBe(409);
    expect(r.body).toEqual({ code: 'INVALID_TRANSITION', message: 'Переход недоступен', from: 'DRAFT', to: 'ISSUED' });
  });

  it('обычное исключение Nest получает код по статусу', () => {
    expect(run(new ForbiddenException('Нет доступа к этой заявке')).body).toEqual({ code: 'FORBIDDEN', message: 'Нет доступа к этой заявке' });
  });

  it('слишком большой файл — понятный текст на русском', () => {
    expect(run(new PayloadTooLargeException('File too large')).body).toEqual({ code: 'FILE_TOO_LARGE', message: 'Файл больше 10 МБ' });
  });

  it('неожиданная ошибка — 500 без подробностей наружу', () => {
    const r = run(new TypeError("Cannot read properties of undefined (reading 'id')"));
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
  });
});
