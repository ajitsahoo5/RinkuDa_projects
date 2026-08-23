import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RegistryAuthGuard } from './common/guards/registry-auth.guard';
import { RegistryRolesGuard } from './common/guards/registry-roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { FarmersModule } from './modules/farmers/farmers.module';
import { HealthModule } from './modules/health/health.module';
import { RegistryAuthModule } from './modules/registry-auth/registry-auth.module';
import { RegistrySettingsModule } from './modules/registry-settings/registry-settings.module';
import { RegistryUsersModule } from './modules/registry-users/registry-users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    const registryOnly = process.env.REGISTRY_ONLY === 'true';

    const imports: DynamicModule['imports'] = [
      ConfigModule.forRoot({ isGlobal: true }),
      PrismaModule,
      HealthModule,
      RegistryAuthModule,
      RegistryUsersModule,
      FarmersModule,
      CatalogModule,
      RegistrySettingsModule,
    ];

    if (!registryOnly) {
      imports.push(AuthModule, BusinessesModule);
    }

    return {
      module: AppModule,
      imports,
      providers: [RegistryAuthGuard, RegistryRolesGuard],
    };
  }
}
