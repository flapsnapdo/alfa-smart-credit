import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { advise } from '@alfa/scoring';
import { desc, eq } from 'drizzle-orm';
import { ApplicationsService } from '../applications/applications.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Db } from '../db/client';
import { DB } from '../db/db.module';
import { applications, products, scoringResults } from '../db/schema';

@Injectable()
export class ExplanationService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly apps: ApplicationsService,
  ) {}

  /** «Почему такое решение и что можно улучшить» — по сохранённым данным скоринга */
  async explain(user: AuthUser, id: string) {
    await this.apps.get(user, id);   // проверка доступа: чужую заявку не покажем (403/404)

    const [scoring] = await this.db.select().from(scoringResults)
      .where(eq(scoringResults.applicationId, id))
      .orderBy(desc(scoringResults.createdAt))
      .limit(1);
    if (!scoring) {
      throw new NotFoundException('Заявка ещё не оценена — объяснение появится вместе с решением');
    }

    const [row] = await this.db
      .select({ app: applications, product: products })
      .from(applications)
      .innerJoin(products, eq(products.id, applications.productId))
      .where(eq(applications.id, id));
    const allProducts = await this.db.select().from(products);

    // Те же входные данные, что видел скоринг, — поэтому объяснение совпадает с решением
    return advise({
      input: scoring.input,
      product: row.product,
      requestedAmount: row.app.requestedAmount,
      requestedTerm: row.app.requestedTerm,
      products: allProducts,
    });
  }
}
