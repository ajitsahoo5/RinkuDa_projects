import { config } from 'dotenv';

config();

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/constants';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const registryOnly = process.env.REGISTRY_ONLY === 'true';
  const app = await NestFactory.create(AppModule.register());
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX') ?? API_PREFIX;
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map((value) => value.trim()) : true,
    credentials: true,
  });

  setupSwagger(app);

  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port);

  const mode = registryOnly
    ? 'registry-only (PostgreSQL farmer data)'
    : 'full (PostgreSQL registry + platform)';
  console.log(`Farmer Business API listening on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger UI: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`Mode: ${mode}`);
}

void bootstrap();
