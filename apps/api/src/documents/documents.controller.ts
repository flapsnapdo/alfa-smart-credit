import {
  Body, Controller, Get, Param, ParseUUIDPipe, Post, StreamableFile, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { MAX_FILE_BYTES } from './doc-requirements';
import { UploadDocumentDto } from './documents.dto';
import { DocumentsService, UploadedFileData } from './documents.service';

@Controller('applications')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  /** multipart/form-data: поле «file» — сам файл, поле «docType» — тип документа */
  @Roles('CLIENT')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file?: UploadedFileData,
  ) {
    return this.docs.upload(user, id, dto.docType, file);
  }

  @Get(':id/documents')
  list(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.docs.list(user, id);
  }

  /** Отдаём файл как есть: браузер откроет PDF или картинку прямо во вкладке */
  @Get(':id/documents/:docId')
  async file(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    const doc = await this.docs.file(user, id, docId);
    return new StreamableFile(doc.content, {
      type: doc.mimeType,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
    });
  }
}
