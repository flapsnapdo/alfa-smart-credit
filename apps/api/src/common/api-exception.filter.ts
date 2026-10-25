import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/** Машинный код по HTTP-статусу — если сервис не указал свой (например, INVALID_TRANSITION) */
const DEFAULT_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'FILE_TOO_LARGE',
  422: 'UNPROCESSABLE',
  503: 'SERVICE_UNAVAILABLE',
};

/** Сообщения, которые Nest пишет по-английски, — переводим, чтобы клиент видел понятный текст */
function translate(message: string, status: number): string {
  if (status === 413) return 'Файл больше 10 МБ';
  if (message.includes('uuid is expected')) return 'Некорректный идентификатор';
  if (message.startsWith('Cannot ')) return 'Такого адреса в API нет';
  return message;
}

/**
 * Единый формат ошибок API: { code, message, details? }.
 * code — для фронтенда (по нему решает, что показать), message — всегда строка для человека,
 * details — список, если ошибок несколько (например, несколько неверных полей формы).
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiError');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      // Nest кладёт в ответ строку или { statusCode, message, error }; наши сервисы — { code, message, ... }
      const { statusCode, error, message, code, ...extra } =
        typeof body === 'string' ? { message: body } as Record<string, unknown> : body as Record<string, unknown>;
      const details = Array.isArray(message) ? message.map(String) : undefined;
      const text = details ? details.join('; ') : String(message ?? exception.message);

      res.status(status).json({
        code: typeof code === 'string' ? code : DEFAULT_CODES[status] ?? 'ERROR',
        message: translate(text, status),
        ...(details && { details }),
        ...extra,   // дополнительные поля, например from/to при недопустимом переходе статуса
      });
      return;
    }

    // Всё остальное — наша ошибка в коде: пишем подробности в лог, клиенту — без внутренностей
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
  }
}
