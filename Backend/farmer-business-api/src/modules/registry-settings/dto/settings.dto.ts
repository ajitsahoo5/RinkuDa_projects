import { IsOptional, IsString } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString()
  googleSheetLink?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  mobileNumber?: string | null;
}

export class AppSettingsResponseDto {
  googleSheetLink!: string | null;
  address!: string | null;
  gstNumber!: string | null;
  mobileNumber!: string | null;
}
