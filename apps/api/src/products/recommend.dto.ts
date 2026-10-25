import { IsIn, IsInt, Max, Min } from 'class-validator';

export const PURPOSES = ['CASH_GAP', 'WORKING_CAPITAL', 'EQUIPMENT', 'OTHER'] as const;
export type Purpose = (typeof PURPOSES)[number];

/** Тело запроса POST /products/recommend */
export class RecommendDto {
  @IsIn(PURPOSES)
  purpose: Purpose;

  /** Сумма в копейках */
  @IsInt()
  @Min(1)
  amount: number;

  /** Срок в месяцах */
  @IsInt()
  @Min(1)
  @Max(60)
  term: number;
}