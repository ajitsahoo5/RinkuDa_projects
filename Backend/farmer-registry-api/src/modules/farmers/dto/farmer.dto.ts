import {
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseLineDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateFarmerDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  @Min(0)
  slNo!: number;

  @IsISO8601()
  dateOfPurchase!: string;

  @IsString()
  landOwnerName!: string;

  @IsString()
  villageOrMouza!: string;

  @IsString()
  khataNo!: string;

  @IsNumber()
  @Min(0)
  area!: number;

  @IsString()
  farmerName!: string;

  @IsString()
  aadharNo!: string;

  @IsString()
  mobileNo!: string;

  @IsString()
  cropsName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  paymentRemark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  fertilizers?: PurchaseLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  pesticides?: PurchaseLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  seeds?: PurchaseLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  cscProducts?: PurchaseLineDto[];

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateFarmerDto extends CreateFarmerDto {}

export class FarmerFilterQueryDto {
  @IsOptional()
  @IsString()
  mouja?: string;

  @IsOptional()
  @IsNumber()
  minAcre?: number;

  @IsOptional()
  @IsNumber()
  maxAcre?: number;
}

export class FarmerResponseDto {
  id!: string;
  slNo!: number;
  dateOfPurchase!: string;
  landOwnerName!: string;
  villageOrMouza!: string;
  khataNo!: string;
  area!: number;
  farmerName!: string;
  aadharNo!: string;
  mobileNo!: string;
  cropsName!: string;
  address!: string;
  paymentRemark!: string;
  fertilizers!: PurchaseLineDto[];
  pesticides!: PurchaseLineDto[];
  seeds!: PurchaseLineDto[];
  cscProducts!: PurchaseLineDto[];
  remarks!: string;
  totalPrice!: number;
}
