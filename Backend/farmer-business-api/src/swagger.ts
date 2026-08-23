import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Farmer Registry API')
    .setDescription(
      'REST API for the farmer registry (PostgreSQL). ' +
        'Registry routes require a Firebase ID token in the Authorization header.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token from admin dashboard or Flutter app',
      },
      'firebase',
    )
    .addTag('Health', 'Public health check')
    .addTag('Registry — Farmers', 'Farmer records and purchase lines')
    .addTag('Registry — Catalog', 'Product catalog (fertilizers, pesticides, seeds, CSC, lookups)')
    .addTag('Registry — Users', 'Admin and client user profiles')
    .addTag('Registry — Settings', 'Shared app settings')
    .addTag('Platform — Auth', 'Platform auth (disabled when REGISTRY_ONLY=true)')
    .addTag('Platform — Businesses', 'Multi-tenant businesses (disabled when REGISTRY_ONLY=true)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Farmer Registry API',
  });
}
