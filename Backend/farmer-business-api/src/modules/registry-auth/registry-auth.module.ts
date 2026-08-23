import { Module, forwardRef } from '@nestjs/common';
import { RegistryAuthGuard } from '../../common/guards/registry-auth.guard';
import { RegistryRolesGuard } from '../../common/guards/registry-roles.guard';
import { RegistryUsersModule } from '../registry-users/registry-users.module';
import { RegistryAuthService } from './registry-auth.service';

@Module({
  imports: [forwardRef(() => RegistryUsersModule)],
  providers: [RegistryAuthService, RegistryAuthGuard, RegistryRolesGuard],
  exports: [RegistryAuthService, RegistryAuthGuard, RegistryRolesGuard],
})
export class RegistryAuthModule {}
