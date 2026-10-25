import { IsInt, IsOptional, Matches, Min } from 'class-validator';

/** POST /applications/:id/accept — какой вариант принимает клиент */
export class AcceptOfferDto {
  /** 0 — основное предложение, 1 и дальше — альтернативные варианты контрпредложения */
  @IsOptional()
  @IsInt()
  @Min(0)
  offerIndex?: number;
}

/** POST /applications/:id/sign — код подтверждения */
export class SignDto {
  @Matches(/^\d{4}$/, { message: 'Код подтверждения — 4 цифры' })
  code: string;
}