import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistryAuthModule } from '../registry-auth/registry-auth.module';
import { RegistrySettingsController } from './registry-settings.controller';
import { RegistrySettingsService } from './registry-settings.service';

@Module({
  imports: [PrismaModule, RegistryAuthModule],
  controllers: [RegistrySettingsController],
  providers: [RegistrySettingsService],
  exports: [RegistrySettingsService],
})
export class RegistrySettingsModule {}
