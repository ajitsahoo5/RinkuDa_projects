import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistryUser, RegistryUserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRegistryUserDto,
  RegistryUserResponseDto,
  UpdateRegistryUserDto,
} from './dto/registry-user.dto';

function toResponse(row: RegistryUser): RegistryUserResponseDto {
  return {
    uid: row.firebaseUid,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    active: row.active,
  };
}

@Injectable()
export class RegistryUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RegistryUserResponseDto[]> {
    const rows = await this.prisma.registryUser.findMany({ orderBy: { email: 'asc' } });
    return rows.map(toResponse);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<RegistryUser | null> {
    return this.prisma.registryUser.findUnique({ where: { firebaseUid } });
  }

  async findOne(firebaseUid: string): Promise<RegistryUserResponseDto> {
    const row = await this.findByFirebaseUid(firebaseUid);
    if (!row) throw new NotFoundException('User not found.');
    return toResponse(row);
  }

  async create(dto: CreateRegistryUserDto): Promise<RegistryUserResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const firebaseUid = dto.firebaseUid?.trim();
    if (!firebaseUid) {
      throw new ConflictException('firebaseUid is required when creating a registry user.');
    }

    const existing = await this.prisma.registryUser.findFirst({
      where: { OR: [{ firebaseUid }, { email }] },
    });
    if (existing) {
      throw new ConflictException('User with this Firebase UID or email already exists.');
    }

    const row = await this.prisma.registryUser.create({
      data: {
        firebaseUid,
        email,
        displayName: dto.displayName?.trim() || null,
        role: (dto.role ?? 'client') as RegistryUserRole,
        active: true,
      },
    });
    return toResponse(row);
  }

  async update(firebaseUid: string, dto: UpdateRegistryUserDto): Promise<RegistryUserResponseDto> {
    try {
      const row = await this.prisma.registryUser.update({
        where: { firebaseUid },
        data: {
          ...(dto.displayName !== undefined
            ? { displayName: dto.displayName?.trim() || null }
            : {}),
          ...(dto.role !== undefined ? { role: dto.role as RegistryUserRole } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
      return toResponse(row);
    } catch {
      throw new NotFoundException('User not found.');
    }
  }

  async remove(firebaseUid: string, callerUid: string): Promise<void> {
    if (firebaseUid === callerUid) {
      throw new ConflictException('You cannot delete your own account.');
    }
    try {
      await this.prisma.registryUser.delete({ where: { firebaseUid } });
    } catch {
      throw new NotFoundException('User not found.');
    }
  }
}
