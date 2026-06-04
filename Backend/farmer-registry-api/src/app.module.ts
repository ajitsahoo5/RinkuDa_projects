import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FarmersModule } from './modules/farmers/farmers.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/farmer_registry'),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    FarmersModule,
    CatalogModule,
    SettingsModule,
  ],
})
export class AppModule {}
