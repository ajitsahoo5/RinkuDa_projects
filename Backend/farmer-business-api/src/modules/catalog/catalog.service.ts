import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PURCHASE_LINE_AMOUNT_EPSILON } from '../../common/registry.constants';
import {
  type CatalogLineItem,
  type NamedCatalogItem,
  type PurchaseLine,
} from '../../common/types/purchase-line.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CatalogLineItemDto,
  CatalogResponseDto,
  UpdateCatalogSectionDto,
} from './dto/catalog.dto';

const STOCK_EPSILON = 1e-9;

type PrismaTx = Prisma.TransactionClient;

function sumPositiveAmountsById(lines: PurchaseLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    if (line.amount <= PURCHASE_LINE_AMOUNT_EPSILON) continue;
    const id = line.id.trim();
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + line.amount);
  }
  return map;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: PrismaTx) {
    return tx ?? this.prisma;
  }

  async getCatalog(): Promise<CatalogResponseDto> {
    return this.toResponse();
  }

  async updateCatalog(dto: UpdateCatalogSectionDto): Promise<CatalogResponseDto> {
    await this.prisma.$transaction(async (tx) => {
      if (dto.fertilizers) {
        await this.replaceLineItems(tx.catalogFertilizer, dto.fertilizers);
      }
      if (dto.pesticides) {
        await this.replaceLineItems(tx.catalogPesticide, dto.pesticides);
      }
      if (dto.seeds) {
        await this.replaceLineItems(tx.catalogSeed, dto.seeds);
      }
      if (dto.cscProducts) {
        await this.replaceLineItems(tx.catalogCscProduct, dto.cscProducts);
      }
      if (dto.crops) {
        await this.replaceNamedItems(tx.catalogCrop, dto.crops);
      }
      if (dto.villageMouzas) {
        await this.replaceNamedItems(tx.catalogVillageMouza, dto.villageMouzas);
      }
      if (dto.remarkPresets) {
        await this.replaceNamedItems(tx.catalogRemarkPreset, dto.remarkPresets);
      }
    });
    return this.toResponse();
  }

  async deductStockForFarmer(
    farmer: {
      fertilizers: PurchaseLine[];
      pesticides: PurchaseLine[];
      seeds: PurchaseLine[];
      cscProducts: PurchaseLine[];
    },
    tx?: PrismaTx,
  ): Promise<void> {
    const db = this.client(tx);
    await this.deductStockFromTable(
      db.catalogFertilizer,
      sumPositiveAmountsById(farmer.fertilizers),
      'Fertilizer',
    );
    await this.deductStockFromTable(
      db.catalogPesticide,
      sumPositiveAmountsById(farmer.pesticides),
      'Pesticide',
    );
    await this.deductStockFromTable(
      db.catalogSeed,
      sumPositiveAmountsById(farmer.seeds),
      'Seed',
    );
    await this.deductStockFromTable(
      db.catalogCscProduct,
      sumPositiveAmountsById(farmer.cscProducts),
      'CSC product',
    );
  }

  private async deductStockFromTable(
    model: {
      findMany: () => Promise<{ id: string; name: string; stock: number }[]>;
      update: (args: {
        where: { id: string };
        data: { stock: number };
      }) => Promise<unknown>;
    },
    requestedById: Map<string, number>,
    categoryLabel: string,
  ): Promise<void> {
    if (!requestedById.size) return;
    const rows = await model.findMany();
    const byId = new Map(rows.map((row) => [row.id.trim(), row]));

    for (const [id, requested] of requestedById.entries()) {
      if (requested <= STOCK_EPSILON) continue;
      const row = byId.get(id);
      if (!row) {
        throw new BadRequestException(
          `No inventory row with id "${id}" under ${categoryLabel}.`,
        );
      }
      const stock = row.stock ?? 0;
      if (requested > stock + STOCK_EPSILON) {
        throw new BadRequestException(
          `Not enough stock for ${categoryLabel} "${row.name}" ` +
            `(requested ${requested}, available ${stock}).`,
        );
      }
      await model.update({
        where: { id: row.id },
        data: { stock: stock - requested },
      });
    }
  }

  private async replaceLineItems(
    model: {
      upsert: (args: {
        where: { id: string };
        create: { id: string; name: string; unit: string; price: number; stock: number };
        update: { name: string; unit: string; price: number; stock: number };
      }) => Promise<unknown>;
    },
    items: CatalogLineItemDto[],
  ): Promise<void> {
    for (const item of items) {
      await model.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          name: item.name,
          unit: item.unit?.trim() || 'kg',
          price: item.price,
          stock: item.stock,
        },
        update: {
          name: item.name,
          unit: item.unit?.trim() || 'kg',
          price: item.price,
          stock: item.stock,
        },
      });
    }
  }

  private async replaceNamedItems(
    model: {
      upsert: (args: {
        where: { id: string };
        create: { id: string; name: string };
        update: { name: string };
      }) => Promise<unknown>;
    },
    items: NamedCatalogItem[],
  ): Promise<void> {
    for (const item of items) {
      await model.upsert({
        where: { id: item.id },
        create: { id: item.id, name: item.name },
        update: { name: item.name },
      });
    }
  }

  private async toResponse(): Promise<CatalogResponseDto> {
    const [fertilizers, pesticides, seeds, cscProducts, crops, villageMouzas, remarkPresets] =
      await Promise.all([
        this.prisma.catalogFertilizer.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogPesticide.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogSeed.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogCscProduct.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogCrop.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogVillageMouza.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.catalogRemarkPreset.findMany({ orderBy: { name: 'asc' } }),
      ]);

    return {
      fertilizers: fertilizers.map(this.toLineItemDto),
      pesticides: pesticides.map(this.toLineItemDto),
      seeds: seeds.map(this.toLineItemDto),
      cscProducts: cscProducts.map(this.toLineItemDto),
      crops: crops.map((row) => ({ id: row.id, name: row.name })),
      villageMouzas: villageMouzas.map((row) => ({ id: row.id, name: row.name })),
      remarkPresets: remarkPresets.map((row) => ({ id: row.id, name: row.name })),
    };
  }

  private toLineItemDto(row: {
    id: string;
    name: string;
    unit: string;
    price: number;
    stock: number;
  }): CatalogLineItem {
    return {
      id: row.id,
      name: row.name,
      unit: row.unit,
      price: row.price,
      stock: row.stock,
    };
  }
}
