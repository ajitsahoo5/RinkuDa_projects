import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { initFirebaseAdmin } from '../../common/firebase-admin.init';
import { AuthenticatedUser, FirebaseVerifiedToken } from '../../common/types/auth.types';

@Injectable()
export class AuthService {
  private firebaseReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    this.firebaseReady = initFirebaseAdmin(this.config);
  }

  async authenticateFirebaseToken(token: string): Promise<AuthenticatedUser> {
    const decoded = await this.verifyFirebaseToken(token);
    const user = await this.syncUserFromFirebase(decoded);
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }
    this.assertValidBusinessAssignment(user);
    return this.toAuthenticatedUser(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return {
      user: this.toAuthenticatedUser(user),
      business: user.business,
    };
  }

  private async verifyFirebaseToken(token: string): Promise<FirebaseVerifiedToken> {
    if (!this.firebaseReady) {
      throw new UnauthorizedException(
        'Firebase Admin is not configured. Set FIREBASE_* env variables.',
      );
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token.');
    }
  }

  private async syncUserFromFirebase(decoded: FirebaseVerifiedToken): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (existing) {
      if (!decoded.email && !decoded.name) {
        return existing;
      }
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: decoded.email ?? existing.email,
          displayName: decoded.name ?? existing.displayName,
        },
      });
    }

    throw new UnauthorizedException(
      'No account linked to this Firebase user. Ask a platform admin to create your user.',
    );
  }

  private assertValidBusinessAssignment(user: User) {
    if (user.role === UserRole.PLATFORM_SUPER_ADMIN) {
      if (user.businessId != null) {
        throw new ForbiddenException('Platform admin must not belong to a business.');
      }
      return;
    }

    if (user.businessId == null) {
      throw new ForbiddenException('Business user is missing business assignment.');
    }
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      businessId: user.businessId,
    };
  }

  assertPlatformSuperAdmin(user: AuthenticatedUser) {
    if (user.role !== UserRole.PLATFORM_SUPER_ADMIN) {
      throw new ForbiddenException('Platform super admin only.');
    }
  }

  assertBusinessUser(user: AuthenticatedUser): string {
    if (user.businessId == null) {
      throw new BadRequestException('Business context is required.');
    }
    return user.businessId;
  }
}
