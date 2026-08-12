import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateBusinessDto, actor: AuthenticatedUser) {
    this.authService.assertPlatformSuperAdmin(actor);

    const existing = await this.prisma.business.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Business code ${dto.code} already exists.`);
    }

    return this.prisma.business.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        gstNo: dto.gstNo?.trim() || null,
        address: dto.address?.trim() || null,
      },
    });
  }

  async listForPlatform(actor: AuthenticatedUser) {
    this.authService.assertPlatformSuperAdmin(actor);
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async mine(actor: AuthenticatedUser) {
    const businessId = this.authService.assertBusinessUser(actor);
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found.');
    }
    return business;
  }

  async assignBusinessSuperAdmin(
    businessId: string,
    firebaseUid: string,
    email: string | null,
    displayName: string | null,
  ) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (existingUser && existingUser.businessId && existingUser.businessId !== businessId) {
      throw new ConflictException('User already belongs to another business.');
    }

    return this.prisma.user.upsert({
      where: { firebaseUid },
      update: {
        role: UserRole.BUSINESS_SUPER_ADMIN,
        businessId,
        email,
        displayName,
        isActive: true,
      },
      create: {
        firebaseUid,
        role: UserRole.BUSINESS_SUPER_ADMIN,
        businessId,
        email,
        displayName,
      },
    });
  }
}
