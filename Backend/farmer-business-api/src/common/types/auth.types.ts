import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  businessId: string | null;
}

export interface FirebaseVerifiedToken {
  uid: string;
  email?: string;
  name?: string;
}
