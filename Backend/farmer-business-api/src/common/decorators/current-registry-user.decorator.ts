import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RegistryAuthenticatedUser } from '../types/registry-auth.types';

export const CurrentRegistryUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RegistryAuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ registryUser?: RegistryAuthenticatedUser }>();
    return request.registryUser!;
  },
);
