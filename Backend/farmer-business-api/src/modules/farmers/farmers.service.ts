import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  isValidIndianMobile,
  normalizedAadharDigits,
  normalizedMobileDigits,
  omitZeroAmountLines,
} from '../../common/registry.constants';
import { type PurchaseLine } from '../../common/types/purchase-line.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import {
  CreateFarmerDto,
  FarmerFilterQueryDto,
  FarmerResponseDto,
  UpdateFarmerDto,
} from './dto/farmer.dto';

const farmerInclude = {
  fertilizerLines: { include: { product: true } },
  pesticideLines: { include: { product: true } },
  seedLines: { include: { product: true } },
  cscProductLines: { include: { product: true } },
} satisfies Prisma.FarmerInclude;

type FarmerWithLines = Prisma.FarmerGetPayload<{ include: typeof farmerInclude }>;

function lineToPurchase(line: {
  productId: string;
  productName: string;
  amount: number;
  price: number;
  unit: string | null;
  product: { name: string };
}): PurchaseLine {
  return {
    id: line.productId,
    name: line.productName || line.product.name,
    amount: line.amount,
    price: line.price,
    ...(line.unit ? { unit: line.unit } : {}),
  };
}

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

function toResponse(row: FarmerWithLines): FarmerResponseDto {
  const fertilizers = row.fertilizerLines.map(lineToPurchase);
  const pesticides = row.pesticideLines.map(lineToPurchase);
  const seeds = row.seedLines.map(lineToPurchase);
  const cscProducts = row.cscProductLines.map(lineToPurchase);
  return {
    id: row.externalId,
    slNo: row.slNo,
    dateOfPurchase: row.dateOfPurchase,
    landOwnerName: row.landOwnerName,
    villageOrMouza: row.villageOrMouza,
    khataNo: row.khataNo,
    area: row.area,
    farmerName: row.farmerName,
    aadharNo: row.aadharNo,
    mobileNo: row.mobileNo,
    cropsName: row.cropsName,
    address: row.address,
    paymentRemark: row.paymentRemark,
    fertilizers,
    pesticides,
    seeds,
    cscProducts,
    remarks: row.remarks,
    sentToBank: row.sentToBank,
    sentToBankAt: row.sentToBankAt,
    totalPrice: totalPrice({ fertilizers, pesticides, seeds, cscProducts }),
  };
}

function sanitizeLines(lines: PurchaseLine[] | undefined): PurchaseLine[] {
  return omitZeroAmountLines(lines ?? []);
}

function buildLineCreates(lines: PurchaseLine[]) {
  return lines.map((line) => ({
    productId: line.id,
    productName: line.name,
    amount: line.amount,
    price: line.price,
    unit: line.unit?.trim() || null,
  }));
}

@Injectable()
export class FarmersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
  ) {}

  async findAll(filter: FarmerFilterQueryDto): Promise<FarmerResponseDto[]> {
    const areaFilter =
      filter.minAcre != null || filter.maxAcre != null
        ? {
            area: {
              ...(filter.minAcre != null ? { gte: filter.minAcre } : {}),
              ...(filter.maxAcre != null ? { lte: filter.maxAcre } : {}),
            },
          }
        : {};

    const rows = await this.prisma.farmer.findMany({
      where: {
        ...(filter.mouja?.trim()
          ? { villageOrMouza: { contains: filter.mouja.trim(), mode: 'insensitive' } }
          : {}),
        ...areaFilter,
        ...(filter.sentToBank != null ? { sentToBank: filter.sentToBank } : {}),
      },
      include: farmerInclude,
      orderBy: { slNo: 'asc' },
    });
    return rows.map(toResponse);
  }

  async findOne(externalId: string): Promise<FarmerResponseDto> {
    const row = await this.prisma.farmer.findUnique({
      where: { externalId },
      include: farmerInclude,
    });
    if (!row) throw new NotFoundException('Farmer not found.');
    return toResponse(row);
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

    const rows = await this.prisma.farmer.findMany({ include: farmerInclude });
    for (const row of rows) {
      if (row.externalId === excludeFarmerId) continue;
      if (checkAadhar) {
        const other = normalizedAadharDigits(row.aadharNo);
        if (other.length === 12 && other === aadhar) return toResponse(row);
      }
      if (checkMobile) {
        const other = normalizedMobileDigits(row.mobileNo);
        if (isValidIndianMobile(other) && other === mobile) return toResponse(row);
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
    const purchase = this.purchaseBuckets(dto);
    const farmerData = await this.buildFarmerData(externalId, dto);

    if (deductStock) {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.catalogService.deductStockForFarmer(purchase, tx);
        await this.ensureCatalogProducts(purchase, tx);
        return tx.farmer.create({
          data: {
            ...farmerData,
            fertilizerLines: { create: buildLineCreates(purchase.fertilizers) },
            pesticideLines: { create: buildLineCreates(purchase.pesticides) },
            seedLines: { create: buildLineCreates(purchase.seeds) },
            cscProductLines: { create: buildLineCreates(purchase.cscProducts) },
          },
          include: farmerInclude,
        });
      });
      return toResponse(row);
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await this.ensureCatalogProducts(purchase, tx);
      return tx.farmer.create({
        data: {
          ...farmerData,
          fertilizerLines: { create: buildLineCreates(purchase.fertilizers) },
          pesticideLines: { create: buildLineCreates(purchase.pesticides) },
          seedLines: { create: buildLineCreates(purchase.seeds) },
          cscProductLines: { create: buildLineCreates(purchase.cscProducts) },
        },
        include: farmerInclude,
      });
    });
    return toResponse(row);
  }

  async update(externalId: string, dto: UpdateFarmerDto): Promise<FarmerResponseDto> {
    const conflict = await this.findConflict(dto, externalId);
    if (conflict) {
      throw new ConflictException('A farmer with the same Aadhaar or mobile already exists.');
    }

    const purchase = this.purchaseBuckets(dto);
    const farmerData = await this.buildFarmerData(externalId, dto);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.ensureCatalogProducts(purchase, tx);
        await tx.farmerFertilizerLine.deleteMany({ where: { farmerId: externalId } });
        await tx.farmerPesticideLine.deleteMany({ where: { farmerId: externalId } });
        await tx.farmerSeedLine.deleteMany({ where: { farmerId: externalId } });
        await tx.farmerCscProductLine.deleteMany({ where: { farmerId: externalId } });
        return tx.farmer.update({
          where: { externalId },
          data: {
            ...farmerData,
            fertilizerLines: { create: buildLineCreates(purchase.fertilizers) },
            pesticideLines: { create: buildLineCreates(purchase.pesticides) },
            seedLines: { create: buildLineCreates(purchase.seeds) },
            cscProductLines: { create: buildLineCreates(purchase.cscProducts) },
          },
          include: farmerInclude,
        });
      });
      return toResponse(row);
    } catch {
      throw new NotFoundException('Farmer not found.');
    }
  }

  async markSentToBank(externalId: string): Promise<FarmerResponseDto> {
    try {
      const row = await this.prisma.farmer.update({
        where: { externalId },
        data: { sentToBank: true, sentToBankAt: new Date().toISOString() },
        include: farmerInclude,
      });
      return toResponse(row);
    } catch {
      throw new NotFoundException('Farmer not found.');
    }
  }

  async removeFromBankDocs(externalId: string): Promise<FarmerResponseDto> {
    try {
      const row = await this.prisma.farmer.update({
        where: { externalId },
        data: { sentToBank: false, sentToBankAt: null },
        include: farmerInclude,
      });
      return toResponse(row);
    } catch {
      throw new NotFoundException('Farmer not found.');
    }
  }

  async remove(externalId: string): Promise<void> {
    try {
      await this.prisma.farmer.delete({ where: { externalId } });
    } catch {
      throw new NotFoundException('Farmer not found.');
    }
  }

  private purchaseBuckets(dto: CreateFarmerDto) {
    return {
      fertilizers: sanitizeLines(dto.fertilizers as PurchaseLine[]),
      pesticides: sanitizeLines(dto.pesticides as PurchaseLine[]),
      seeds: sanitizeLines(dto.seeds as PurchaseLine[]),
      cscProducts: sanitizeLines(dto.cscProducts as PurchaseLine[]),
    };
  }

  private async buildFarmerData(externalId: string, dto: CreateFarmerDto) {
    const cropId = await this.resolveCropId(dto.cropsName);
    const villageMouzaId = await this.resolveVillageId(dto.villageOrMouza);

    return {
      externalId,
      slNo: dto.slNo,
      dateOfPurchase: dto.dateOfPurchase,
      landOwnerName: dto.landOwnerName,
      villageOrMouza: dto.villageOrMouza,
      villageMouzaId,
      khataNo: dto.khataNo,
      area: dto.area,
      farmerName: dto.farmerName,
      aadharNo: dto.aadharNo,
      mobileNo: dto.mobileNo,
      cropsName: dto.cropsName,
      cropId,
      address: dto.address ?? '',
      paymentRemark: dto.paymentRemark ?? '',
      remarks: dto.remarks ?? '',
      sentToBank: dto.sentToBank ?? false,
      sentToBankAt: dto.sentToBankAt ?? null,
    };
  }

  private async resolveCropId(cropsName: string): Promise<string | null> {
    const name = cropsName.trim();
    if (!name) return null;
    const row = await this.prisma.catalogCrop.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    return row?.id ?? null;
  }

  private async resolveVillageId(villageOrMouza: string): Promise<string | null> {
    const name = villageOrMouza.trim();
    if (!name) return null;
    const row = await this.prisma.catalogVillageMouza.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    return row?.id ?? null;
  }

  private async ensureCatalogProducts(
    purchase: {
      fertilizers: PurchaseLine[];
      pesticides: PurchaseLine[];
      seeds: PurchaseLine[];
      cscProducts: PurchaseLine[];
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await this.ensureLineCatalog(tx.catalogFertilizer, purchase.fertilizers);
    await this.ensureLineCatalog(tx.catalogPesticide, purchase.pesticides);
    await this.ensureLineCatalog(tx.catalogSeed, purchase.seeds);
    await this.ensureLineCatalog(tx.catalogCscProduct, purchase.cscProducts);
  }

  private async ensureLineCatalog(
    model: {
      upsert: (args: {
        where: { id: string };
        create: { id: string; name: string; unit: string; price: number; stock: number };
        update: { name: string; unit?: string; price?: number };
      }) => Promise<unknown>;
    },
    lines: PurchaseLine[],
  ): Promise<void> {
    for (const line of lines) {
      await model.upsert({
        where: { id: line.id },
        create: {
          id: line.id,
          name: line.name,
          unit: line.unit?.trim() || 'kg',
          price: line.price,
          stock: 0,
        },
        update: {
          name: line.name,
          ...(line.unit ? { unit: line.unit.trim() || 'kg' } : {}),
          price: line.price,
        },
      });
    }
  }
}
