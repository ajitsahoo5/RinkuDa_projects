import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsString()
  @IsUrl({}, { message: 'googleSheetLink must be a valid URL' })
  googleSheetLink?: string | null;
}

export class AppSettingsResponseDto {
  googleSheetLink!: string | null;
}
