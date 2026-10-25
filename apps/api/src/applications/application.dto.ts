import { IsBoolean, IsIn, IsInt, IsUUID, Min } from 'class-validator';
import { PURPOSES, Purpose } from '../products/recommend.dto';

export const PRODUCT_CODES = ['OVERDRAFT', 'WORKING_CAPITAL', 'EQUIPMENT'] as const;
export type ProductCode = (typeof PRODUCT_CODES)[number];

/** POST /applications — создать черновик */
export class CreateApplicationDto {
  @IsUUID()
  companyId: string;

  @IsIn(PRODUCT_CODES)
  productCode: ProductCode;

  @IsIn(PURPOSES)
  purpose: Purpose;

  /** Сумма в копейках */
  @IsInt()
  @Min(1)
  amount: number;

  /** Срок в месяцах */
  @IsInt()
  @Min(1)
  term: number;
}

/** POST /applications/:id/submit — отправить заявку */
export class SubmitApplicationDto {
  @IsBoolean()
  bkiConsent: boolean;
}