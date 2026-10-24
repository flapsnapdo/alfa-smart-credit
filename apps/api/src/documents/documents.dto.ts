import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { DocType, docTypeEnum } from '../db/schema';

/** POST /applications/:id/documents — поле формы рядом с файлом */
export class UploadDocumentDto {
  @IsIn(docTypeEnum.enumValues)
  docType: DocType;
}

/** POST /analyst/applications/:id/request-info — аналитик запрашивает документ */
export class RequestInfoDto {
  @IsIn(docTypeEnum.enumValues)
  docType: DocType;

  /** Что именно нужно и зачем — клиент увидит этот текст */
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  comment: string;
}
