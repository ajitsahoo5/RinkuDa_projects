import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { PURCHASE_LINE_AMOUNT_EPSILON } from '../../common/constants';
import { PurchaseLine } from '../farmers/schemas/farmer.schema';
import { CatalogResponseDto, CatalogLineItemDto, UpdateCatalogSectionDto } from './dto/catalog.dto';
import {
  CatalogDocument,
  CatalogDocumentDoc,
  CatalogLineItem,
} from './schemas/catalog.schema';

const CATALOG_KEY = 'catalog';
const STOCK_EPSILON = 1e-9;

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

function deductStockFromRows(
  rows: CatalogLineItem[],
  requestedById: Map<string, number>,
  categoryLabel: string,
): CatalogLineItem[] {
  const updated = rows.map((row) => ({ ...row }));
  for (const [id, requested] of requestedById.entries()) {
    if (requested <= STOCK_EPSILON) continue;
    const idx = updated.findIndex((row) => row.id.trim() === id);
    if (idx < 0) {
      throw new BadRequestException(
        `No inventory row with id "${id}" under ${categoryLabel}.`,
      );
    }
    const row = updated[idx];
    const stock = row.stock ?? 0;
    if (requested > stock + STOCK_EPSILON) {
      throw new BadRequestException(
        `Not enough stock for ${categoryLabel} "${row.name}" ` +
          `(requested ${requested}, available ${stock}).`,
      );
    }
    updated[idx] = { ...row, stock: stock - requested };
  }
  return updated;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(CatalogDocument.name)
    private readonly catalogModel: Model<CatalogDocumentDoc>,
  ) {}

  private async getOrCreateDoc(): Promise<CatalogDocumentDoc> {
    let doc = await this.catalogModel.findOne({ key: CATALOG_KEY }).exec();
    if (!doc) {
      doc = await this.catalogModel.create({ key: CATALOG_KEY });
    }
    return doc;
  }

  async getCatalog(): Promise<CatalogResponseDto> {
    const doc = await this.getOrCreateDoc();
    return this.toResponse(doc);
  }

  async updateCatalog(dto: UpdateCatalogSectionDto): Promise<CatalogResponseDto> {
    const doc = await this.getOrCreateDoc();
    if (dto.fertilizers) doc.fertilizers = this.normalizeLineItems(dto.fertilizers);
    if (dto.pesticides) doc.pesticides = this.normalizeLineItems(dto.pesticides);
    if (dto.seeds) doc.seeds = this.normalizeLineItems(dto.seeds);
    if (dto.cscProducts) doc.cscProducts = this.normalizeLineItems(dto.cscProducts);
    if (dto.crops) doc.crops = dto.crops;
    if (dto.remarkPresets) doc.remarkPresets = dto.remarkPresets;
    await doc.save();
    return this.toResponse(doc);
  }

  private normalizeLineItems(items: CatalogLineItemDto[]): CatalogLineItem[] {
    return items.map((item) => ({
      ...item,
      unit: item.unit?.trim() || 'kg',
    }));
  }

  async deductStockForFarmer(
    farmer: {
      fertilizers: PurchaseLine[];
      pesticides: PurchaseLine[];
      seeds: PurchaseLine[];
      cscProducts: PurchaseLine[];
    },
    session?: ClientSession,
  ): Promise<void> {
    const doc = await this.catalogModel.findOne({ key: CATALOG_KEY }).session(session ?? null).exec();
    if (!doc) {
      throw new BadRequestException('Inventory catalog is missing (settings/catalog).');
    }

    doc.fertilizers = deductStockFromRows(
      doc.fertilizers,
      sumPositiveAmountsById(farmer.fertilizers),
      'Fertilizer',
    );
    doc.cscProducts = deductStockFromRows(
      doc.cscProducts,
      sumPositiveAmountsById(farmer.cscProducts),
      'CSC product',
    );
    doc.seeds = deductStockFromRows(
      doc.seeds,
      sumPositiveAmountsById(farmer.seeds),
      'Seed',
    );
    doc.pesticides = deductStockFromRows(
      doc.pesticides,
      sumPositiveAmountsById(farmer.pesticides),
      'Pesticide',
    );

    await doc.save({ session });
  }

  private toResponse(doc: CatalogDocumentDoc): CatalogResponseDto {
    return {
      fertilizers: doc.fertilizers,
      pesticides: doc.pesticides,
      seeds: doc.seeds,
      cscProducts: doc.cscProducts,
      crops: doc.crops.sort((a, b) => a.name.localeCompare(b.name)),
      remarkPresets: doc.remarkPresets,
    };
  }
}
