import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApplicationStatus, applicationStatusEnum } from '../db/schema';

/** GET /analyst/applications?status=… — фильтр очереди */
export class QueueQueryDto {
  @IsOptional()
  @IsIn(applicationStatusEnum.enumValues)
  status?: ApplicationStatus;
}

export const ANALYST_DECISIONS = ['APPROVE', 'COUNTER_OFFER', 'REJECT'] as const;
export type AnalystDecisionType = (typeof ANALYST_DECISIONS)[number];

/** POST /analyst/applications/:id/decision — решение аналитика */
export class AnalystDecisionDto {
  @IsIn(ANALYST_DECISIONS)
  type: AnalystDecisionType;

  /** Комментарий обязателен: решение человека должно быть объяснимо */
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  comment: string;

  /** Сумма в копейках. Для одобрения — по умолчанию запрошенная, для контрпредложения — обязательна */
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  /** Срок в месяцах */
  @IsOptional()
  @IsInt()
  @Min(1)
  term?: number;

  /** Ставка, % годовых. По умолчанию — ставка из решения системы */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  rate?: number;
}