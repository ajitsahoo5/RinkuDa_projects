import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { RegistryUserRole } from '../../../common/registry.constants';

export class CreateRegistryUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firebaseUid?: string;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsEnum(['admin', 'client'])
  role?: RegistryUserRole;
}

export class UpdateRegistryUserDto {
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsEnum(['admin', 'client'])
  role?: RegistryUserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class RegistryUserResponseDto {
  uid!: string;
  email!: string;
  displayName!: string | null;
  role!: RegistryUserRole;
  active!: boolean;
}
