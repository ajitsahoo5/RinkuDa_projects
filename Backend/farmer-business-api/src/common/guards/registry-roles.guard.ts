import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REGISTRY_ROLES_KEY } from '../decorators/registry-roles.decorator';
import type { RegistryUserRole } from '../registry.constants';
import type { RegistryAuthenticatedUser } from '../types/registry-auth.types';

@Injectable()
export class RegistryRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RegistryUserRole[]>(
      REGISTRY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ registryUser?: RegistryAuthenticatedUser }>();
    const user = request.registryUser;
    if (!user?.active) {
      throw new UnauthorizedException('Account deactivated.');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions.');
    }
    return true;
  }
}
