import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { FarmersController } from './farmers.controller';
import { FarmersService } from './farmers.service';
import { Farmer, FarmerSchema } from './schemas/farmer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Farmer.name, schema: FarmerSchema }]),
    forwardRef(() => CatalogModule),
  ],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {}
