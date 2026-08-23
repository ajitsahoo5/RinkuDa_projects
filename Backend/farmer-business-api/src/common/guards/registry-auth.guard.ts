import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegistryAuthService } from '../../modules/registry-auth/registry-auth.service';
import type { RegistryAuthenticatedUser } from '../types/registry-auth.types';

@Injectable()
export class RegistryAuthGuard implements CanActivate {
  constructor(private readonly registryAuthService: RegistryAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      registryUser?: RegistryAuthenticatedUser;
    }>();

    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token.');
    }

    request.registryUser = await this.registryAuthService.authenticateFirebaseToken(token);
    return true;
  }
}
