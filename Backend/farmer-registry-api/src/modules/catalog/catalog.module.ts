import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogDocument, CatalogDocumentSchema } from './schemas/catalog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogDocument.name, schema: CatalogDocumentSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
