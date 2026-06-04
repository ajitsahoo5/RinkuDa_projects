import type { UserRole } from '../../common/constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    uid: string;
    email: string;
    displayName: string | null;
    role: UserRole;
    active: boolean;
  };
}
