import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'code must use uppercase letters, numbers, and hyphens only',
  })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
