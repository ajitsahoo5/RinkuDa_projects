import type { RegistryUserRole } from '../registry.constants';

export interface RegistryAuthenticatedUser {
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: RegistryUserRole;
  active: boolean;
}
