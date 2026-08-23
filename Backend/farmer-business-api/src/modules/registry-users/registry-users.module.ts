import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegistryAuthModule } from '../registry-auth/registry-auth.module';
import { RegistryUsersController } from './registry-users.controller';
import { RegistryUsersService } from './registry-users.service';

@Module({
  imports: [PrismaModule, forwardRef(() => RegistryAuthModule)],
  controllers: [RegistryUsersController],
  providers: [RegistryUsersService],
  exports: [RegistryUsersService],
})
export class RegistryUsersModule {}
