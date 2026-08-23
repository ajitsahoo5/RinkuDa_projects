import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CatalogLineItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  stock!: number;
}

export class NamedCatalogItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;
}

export class UpdateCatalogSectionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogLineItemDto)
  fertilizers?: CatalogLineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogLineItemDto)
  pesticides?: CatalogLineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogLineItemDto)
  seeds?: CatalogLineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogLineItemDto)
  cscProducts?: CatalogLineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NamedCatalogItemDto)
  crops?: NamedCatalogItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NamedCatalogItemDto)
  villageMouzas?: NamedCatalogItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NamedCatalogItemDto)
  remarkPresets?: NamedCatalogItemDto[];
}

export class CatalogResponseDto {
  fertilizers!: CatalogLineItemDto[];
  pesticides!: CatalogLineItemDto[];
  seeds!: CatalogLineItemDto[];
  cscProducts!: CatalogLineItemDto[];
  crops!: NamedCatalogItemDto[];
  villageMouzas!: NamedCatalogItemDto[];
  remarkPresets!: NamedCatalogItemDto[];
}
