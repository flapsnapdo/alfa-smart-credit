import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ProductsService } from './products.service';
import { RecommendDto } from './recommend.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  list() {
    return this.products.list();
  }

  @Public()
  @Post('recommend')
  @HttpCode(200)
  recommend(@Body() dto: RecommendDto) {
    return this.products.recommend(dto.purpose, dto.amount, dto.term);
  }
}