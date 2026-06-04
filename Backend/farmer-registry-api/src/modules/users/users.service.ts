import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { User, UserDocument } from './schemas/user.schema';

function toResponse(doc: UserDocument): UserResponseDto {
  return {
    uid: doc._id.toString(),
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    active: doc.active,
  };
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findAll(): Promise<UserResponseDto[]> {
    const docs = await this.userModel.find().sort({ email: 1 }).exec();
    return docs.map(toResponse);
  }

  async findById(uid: string): Promise<UserResponseDto> {
    const doc = await this.userModel.findById(uid).exec();
    if (!doc) throw new NotFoundException('User not found.');
    return toResponse(doc);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const doc = await this.userModel.create({
      email,
      passwordHash,
      displayName: dto.displayName?.trim() || null,
      role: dto.role ?? 'client',
      active: true,
    });
    return toResponse(doc);
  }

  async update(uid: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const doc = await this.userModel.findById(uid).exec();
    if (!doc) throw new NotFoundException('User not found.');

    if (dto.displayName !== undefined) {
      doc.displayName = dto.displayName?.trim() || null;
    }
    if (dto.role !== undefined) doc.role = dto.role;
    if (dto.active !== undefined) doc.active = dto.active;
    await doc.save();
    return toResponse(doc);
  }

  async remove(uid: string, callerUid: string): Promise<void> {
    if (uid === callerUid) {
      throw new ConflictException('You cannot delete your own account.');
    }
    const result = await this.userModel.deleteOne({ _id: uid }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('User not found.');
  }

  async validateCredentials(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.active) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }
}
