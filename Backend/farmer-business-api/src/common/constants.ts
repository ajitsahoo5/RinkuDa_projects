export const API_PREFIX = 'api/v1';

export const USER_ROLES = {
  PLATFORM_SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
  BUSINESS_SUPER_ADMIN: 'BUSINESS_SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type AppUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
