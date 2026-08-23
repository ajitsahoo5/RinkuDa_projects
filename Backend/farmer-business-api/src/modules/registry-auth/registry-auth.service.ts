import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { initFirebaseAdmin } from '../../common/firebase-admin.init';
import type { RegistryAuthenticatedUser } from '../../common/types/registry-auth.types';
import { RegistryUsersService } from '../registry-users/registry-users.service';

@Injectable()
export class RegistryAuthService {
  private firebaseReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly registryUsersService: RegistryUsersService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    this.firebaseReady = initFirebaseAdmin(this.config);
  }

  async authenticateFirebaseToken(token: string): Promise<RegistryAuthenticatedUser> {
    if (!this.firebaseReady) {
      throw new UnauthorizedException(
        'Firebase Admin is not configured. Set FIREBASE_* env variables.',
      );
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token.');
    }

    const profile = await this.registryUsersService.findByFirebaseUid(decoded.uid);
    if (!profile) {
      throw new UnauthorizedException(
        'No registry profile for this Firebase user. Run migration or create the user.',
      );
    }
    if (!profile.active) {
      throw new UnauthorizedException('Account deactivated.');
    }

    return {
      firebaseUid: profile.firebaseUid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      active: profile.active,
    };
  }
}
