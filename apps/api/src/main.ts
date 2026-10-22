import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');   // все пути начинаются с /api/v1, как в контракте API
  app.enableCors();                 // разрешаем запросы с фронта (другой порт)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));  // проверка тел запросов по DTO
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API: http://localhost:${port}/api/v1`);
}

bootstrap();