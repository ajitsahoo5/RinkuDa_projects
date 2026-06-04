import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  isValidIndianMobile,
  normalizedAadharDigits,
  normalizedMobileDigits,
  omitZeroAmountLines,
} from '../../common/constants';
import { CatalogService } from '../catalog/catalog.service';
import { CreateFarmerDto, FarmerFilterQueryDto, FarmerResponseDto, UpdateFarmerDto } from './dto/farmer.dto';
import { Farmer, FarmerDocument, PurchaseLine } from './schemas/farmer.schema';

function totalPrice(farmer: {
  fertilizers: PurchaseLine[];
  pesticides: PurchaseLine[];
  seeds: PurchaseLine[];
  cscProducts: PurchaseLine[];
}): number {
  const lines = [
    ...farmer.fertilizers,
    ...farmer.pesticides,
    ...farmer.seeds,
    ...farmer.cscProducts,
  ];
  return lines.reduce((sum, line) => sum + line.amount * line.price, 0);
}

function toResponse(doc: FarmerDocument): FarmerResponseDto {
  return {
    id: doc.externalId,
    slNo: doc.slNo,
    dateOfPurchase: doc.dateOfPurchase,
    landOwnerName: doc.landOwnerName,
    villageOrMouza: doc.villageOrMouza,
    khataNo: doc.khataNo,
    area: doc.area,
    farmerName: doc.farmerName,
    aadharNo: doc.aadharNo,
    mobileNo: doc.mobileNo,
    cropsName: doc.cropsName,
    address: doc.address,
    paymentRemark: doc.paymentRemark,
    fertilizers: doc.fertilizers,
    pesticides: doc.pesticides,
    seeds: doc.seeds,
    cscProducts: doc.cscProducts,
    remarks: doc.remarks,
    totalPrice: totalPrice(doc),
  };
}

function sanitizeLines(lines: PurchaseLine[] | undefined): PurchaseLine[] {
  return omitZeroAmountLines(lines ?? []);
}

@Injectable()
export class FarmersService {
  constructor(
    @InjectModel(Farmer.name) private readonly farmerModel: Model<FarmerDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly catalogService: CatalogService,
  ) {}

  async findAll(filter: FarmerFilterQueryDto): Promise<FarmerResponseDto[]> {
    const query: Record<string, unknown> = {};
    if (filter.mouja?.trim()) {
      query.villageOrMouza = new RegExp(filter.mouja.trim(), 'i');
    }
    if (filter.minAcre != null || filter.maxAcre != null) {
      query.area = {};
      if (filter.minAcre != null) (query.area as Record<string, number>).$gte = filter.minAcre;
      if (filter.maxAcre != null) (query.area as Record<string, number>).$lte = filter.maxAcre;
    }

    const docs = await this.farmerModel.find(query).sort({ slNo: 1 }).exec();
    return docs.map(toResponse);
  }

  async findOne(externalId: string): Promise<FarmerResponseDto> {
    const doc = await this.farmerModel.findOne({ externalId }).exec();
    if (!doc) throw new NotFoundException('Farmer not found.');
    return toResponse(doc);
  }

  async findConflict(
    dto: CreateFarmerDto,
    excludeFarmerId?: string,
  ): Promise<FarmerResponseDto | null> {
    const aadhar = normalizedAadharDigits(dto.aadharNo);
    const mobile = normalizedMobileDigits(dto.mobileNo);
    const checkAadhar = aadhar.length === 12;
    const checkMobile = isValidIndianMobile(mobile);
    if (!checkAadhar && !checkMobile) return null;

    const docs = await this.farmerModel.find().exec();
    for (const doc of docs) {
      if (doc.externalId === excludeFarmerId) continue;
      if (checkAadhar) {
        const other = normalizedAadharDigits(doc.aadharNo);
        if (other.length === 12 && other === aadhar) return toResponse(doc);
      }
      if (checkMobile) {
        const other = normalizedMobileDigits(doc.mobileNo);
        if (isValidIndianMobile(other) && other === mobile) return toResponse(doc);
      }
    }
    return null;
  }

  async create(dto: CreateFarmerDto, deductStock = true): Promise<FarmerResponseDto> {
    const conflict = await this.findConflict(dto);
    if (conflict) {
      throw new ConflictException('A farmer with the same Aadhaar or mobile already exists.');
    }

    const externalId = dto.id?.trim() || uuidv4();
    const payload = this.buildFarmerPayload(externalId, dto);

    if (deductStock) {
      const session = await this.connection.startSession();
      try {
        session.startTransaction();
        await this.catalogService.deductStockForFarmer(payload, session);
        const [doc] = await this.farmerModel.create([payload], { session });
        await session.commitTransaction();
        return toResponse(doc);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    const doc = await this.farmerModel.create(payload);
    return toResponse(doc);
  }

  async update(externalId: string, dto: UpdateFarmerDto): Promise<FarmerResponseDto> {
    const conflict = await this.findConflict(dto, externalId);
    if (conflict) {
      throw new ConflictException('A farmer with the same Aadhaar or mobile already exists.');
    }

    const payload = this.buildFarmerPayload(externalId, dto);
    const doc = await this.farmerModel
      .findOneAndUpdate({ externalId }, payload, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Farmer not found.');
    return toResponse(doc);
  }

  async remove(externalId: string): Promise<void> {
    const result = await this.farmerModel.deleteOne({ externalId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Farmer not found.');
  }

  private buildFarmerPayload(externalId: string, dto: CreateFarmerDto): Farmer {
    return {
      externalId,
      slNo: dto.slNo,
      dateOfPurchase: dto.dateOfPurchase,
      landOwnerName: dto.landOwnerName,
      villageOrMouza: dto.villageOrMouza,
      khataNo: dto.khataNo,
      area: dto.area,
      farmerName: dto.farmerName,
      aadharNo: dto.aadharNo,
      mobileNo: dto.mobileNo,
      cropsName: dto.cropsName,
      address: dto.address ?? '',
      paymentRemark: dto.paymentRemark ?? '',
      fertilizers: sanitizeLines(dto.fertilizers as PurchaseLine[]),
      pesticides: sanitizeLines(dto.pesticides as PurchaseLine[]),
      seeds: sanitizeLines(dto.seeds as PurchaseLine[]),
      cscProducts: sanitizeLines(dto.cscProducts as PurchaseLine[]),
      remarks: dto.remarks ?? '',
    };
  }
}
