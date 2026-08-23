import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistryAuthModule } from '../registry-auth/registry-auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { FarmersController } from './farmers.controller';
import { FarmersService } from './farmers.service';

@Module({
  imports: [PrismaModule, CatalogModule, RegistryAuthModule],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {}
