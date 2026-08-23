import { SetMetadata } from '@nestjs/common';
import type { RegistryUserRole } from '../registry.constants';

export const REGISTRY_ROLES_KEY = 'registry_roles';
export const RegistryRoles = (...roles: RegistryUserRole[]) =>
  SetMetadata(REGISTRY_ROLES_KEY, roles);
