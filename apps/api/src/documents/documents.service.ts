import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { ApplicationsService } from '../applications/applications.service';
import { PipelineService } from '../applications/pipeline.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import { applications, DocType, documents, infoRequests, products } from '../db/schema';
import { ALLOWED_MIME, DOC_TITLES, MAX_FILE_BYTES, missingDocTypes } from './doc-requirements';

/** То, что Nest (multer) кладёт в @UploadedFile(): нам нужны только эти поля */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Колонки документа без самого файла — список не должен тащить мегабайты из базы */
const META = {
  id: documents.id, docType: documents.docType, fileName: documents.fileName,
  mimeType: documents.mimeType, sizeBytes: documents.sizeBytes, createdAt: documents.createdAt,
};

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
    private readonly pipeline: PipelineService,
  ) {}

  /** Загрузка документа. Если банк ждал документы и теперь всё есть — заявка сама идёт дальше */
  async upload(user: AuthUser, id: string, docType: DocType, file: UploadedFileData | undefined) {
    const app = await this.apps.get(user, id);   // 403, если заявка чужая
    if (app.status !== 'DRAFT' && app.status !== 'INFO_REQUESTED') {
      throw new ConflictException({ code: 'INVALID_STATE', message: 'Документы можно загрузить в черновик или когда банк их запросил' });
    }
    if (!file) throw new BadRequestException('Прикрепите файл в поле «file»');
    if (!ALLOWED_MIME.includes(file.mimetype)) throw new BadRequestException('Можно загрузить только PDF, JPG или PNG');
    if (file.size > MAX_FILE_BYTES) throw new BadRequestException('Файл больше 10 МБ');

    // Документ и закрытие запросов этого типа — одной транзакцией
    const document = await this.db.transaction(async (tx) => {
      const [doc] = await tx.insert(documents).values({
        applicationId: id, docType, fileName: fixFileName(file.originalname), mimeType: file.mimetype,
        sizeBytes: file.size, content: file.buffer, uploadedBy: user.id,
      }).returning(META);
      await tx.update(infoRequests).set({ fulfilledAt: new Date() })
        .where(and(eq(infoRequests.applicationId, id), eq(infoRequests.docType, docType), isNull(infoRequests.fulfilledAt)));
      return doc;
    });

    if (app.status === 'INFO_REQUESTED' && (await this.checklist(id)).missing.length === 0) {
      await this.apps.changeStatus(id, 'VALIDATION', 'CLIENT', user.id, 'Клиент загрузил запрошенные документы');
      this.pipeline.start(id);   // в фоне, как после отправки
    }
    return { document, ...(await this.checklist(id)) };
  }

  /** Список документов заявки + чек-лист: что нужно, что загружено, чего не хватает */
  async list(user: AuthUser, id: string) {
    await this.apps.get(user, id);
    return { documents: await this.documentsOf(id), ...(await this.checklist(id)) };
  }

  /** Сам файл — для просмотра аналитиком или клиентом */
  async file(user: AuthUser, id: string, docId: string) {
    await this.apps.get(user, id);
    const [doc] = await this.db.select().from(documents)
      .where(and(eq(documents.id, docId), eq(documents.applicationId, id)));
    if (!doc) throw new NotFoundException('Документ не найден');
    return doc;
  }

  /** Документы без содержимого файлов — для карточки аналитика */
  documentsOf(id: string) {
    return this.db.select(META).from(documents)
      .where(eq(documents.applicationId, id)).orderBy(asc(documents.createdAt));
  }

  /** Что требуется по заявке и чего не хватает */
  async checklist(id: string) {
    const [row] = await this.db.select({ amount: applications.requestedAmount, rules: products.requiredDocs })
      .from(applications).innerJoin(products, eq(products.id, applications.productId))
      .where(eq(applications.id, id));
    const uploaded = (await this.documentsOf(id)).map((d) => d.docType);
    const requests = await this.db.select().from(infoRequests)
      .where(eq(infoRequests.applicationId, id)).orderBy(asc(infoRequests.createdAt));
    const open = requests.filter((r) => r.fulfilledAt === null);

    const missing = missingDocTypes(row.rules, row.amount, uploaded, open.map((r) => r.docType));
    return {
      missing: missing.map((docType) => ({
        docType,
        title: DOC_TITLES[docType],
        comment: open.find((r) => r.docType === docType)?.comment ?? null,
      })),
      requests: requests.map((r) => ({
        docType: r.docType, title: DOC_TITLES[r.docType], comment: r.comment,
        actorType: r.actorType, fulfilledAt: r.fulfilledAt, createdAt: r.createdAt,
      })),
    };
  }
}

/** Браузеры присылают имя файла в UTF-8, а multer читает его как latin1 — «Счёт.pdf» превращается в кракозябры */
function fixFileName(name: string): string {
  const utf8 = Buffer.from(name, 'latin1').toString('utf8');
  return utf8.includes('�') ? name : utf8;
}
