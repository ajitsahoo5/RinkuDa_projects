import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { UserRole } from '../../../common/constants';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsIn(['admin', 'client'])
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsIn(['admin', 'client'])
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UserResponseDto {
  uid!: string;
  email!: string;
  displayName!: string | null;
  role!: UserRole;
  active!: boolean;
}
