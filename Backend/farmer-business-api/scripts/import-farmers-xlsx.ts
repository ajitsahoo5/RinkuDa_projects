/**
 * Import farmer registry rows from admin Excel export into PostgreSQL.
 *
 * The export format matches `exportFarmersList.ts` (one row per farmer,
 * dynamic product quantity columns, no per-line prices).
 *
 * Dry run (default):
 *   npm run import:farmers-xlsx -- Keys/farmers-registry-full-2026-08-23.xlsx
 *
 * Apply:
 *   npm run import:farmers-xlsx -- Keys/farmers-registry-full-2026-08-23.xlsx --apply
 *
 * Replace existing farmers:
 *   npm run import:farmers-xlsx -- Keys/farmers-registry-full-2026-08-23.xlsx --apply --drop
 *
 * Load product prices/units/categories from Firestore catalog (recommended):
 *   npm run import:farmers-xlsx -- Keys/farmers-registry-full-2026-08-23.xlsx --apply --catalog-firestore
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { createFarmerWithLines } from './registry-db.helpers';

config();

type CliFlags = {
  apply: boolean;
  drop: boolean;
  catalogFirestore: boolean;
};

type PurchaseLine = {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit?: string;
};

type CatalogLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
};

type ProductLookup = Map<
  string,
  { category: 'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts'; line: CatalogLine }
>;

const BASE_HEADERS = [
  'SL',
  'Date of purchase',
  'Farmer name',
  'Land owner name',
  'Village / mouza',
  'Khata no.',
  'Area (acre)',
  'Aadhaar no.',
  'Mobile no.',
  'Crops',
  'Address',
  'Payment remark',
] as const;

const TRAILING_HEADERS = ['Remarks', 'Total inputs (₹)'] as const;

function parseArgs(argv: string[]): CliFlags & { filePath: string } {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const filePath = positional[0];
  if (!filePath) {
    console.error('Usage: npm run import:farmers-xlsx -- <path-to.xlsx> [--apply] [--drop] [--catalog-firestore]');
    process.exit(1);
  }
  return {
    filePath,
    apply: argv.includes('--apply'),
    drop: argv.includes('--drop'),
    catalogFirestore: argv.includes('--catalog-firestore'),
  };
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function dashToEmpty(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s || s === '—' || s === '-') return '';
  return s;
}

function parseExcelDate(value: unknown): string {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (!raw || raw === '—') return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 0) {
    const parsed = XLSX.SSF.parse_date_code(asNum);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return raw;
}

function parseQuantity(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function slugId(name: string): string {
  const slug = normalizeKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || randomUUID();
}

function parseLineItem(raw: unknown): CatalogLine | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  if (!name) return null;
  return {
    id: String(row.id ?? slugId(name)).trim() || slugId(name),
    name,
    unit: String(row.unit ?? 'kg').trim() || 'kg',
    price: Number(row.price ?? 0) || 0,
  };
}

function parseLineArray(raw: unknown): CatalogLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseLineItem).filter(Boolean) as CatalogLine[];
}

function buildProductLookup(catalog: {
  fertilizers: unknown;
  pesticides: unknown;
  seeds: unknown;
  cscProducts: unknown;
}): ProductLookup {
  const lookup: ProductLookup = new Map();
  const add = (category: 'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts', items: CatalogLine[]) => {
    for (const line of items) {
      lookup.set(normalizeKey(line.name), { category, line });
    }
  };
  add('fertilizers', parseLineArray(catalog.fertilizers));
  add('pesticides', parseLineArray(catalog.pesticides));
  add('seeds', parseLineArray(catalog.seeds));
  add('cscProducts', parseLineArray(catalog.cscProducts));
  return lookup;
}

function resolveProduct(
  columnName: string,
  lookup: ProductLookup,
): { category: 'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts'; line: CatalogLine } {
  const key = normalizeKey(columnName);
  const exact = lookup.get(key);
  if (exact) return exact;

  for (const [catalogKey, entry] of lookup.entries()) {
    if (key.includes(catalogKey) || catalogKey.includes(key)) {
      return entry;
    }
  }

  return {
    category: 'fertilizers',
    line: {
      id: slugId(columnName),
      name: columnName.trim(),
      unit: 'kg',
      price: 0,
    },
  };
}

function emptyPurchaseBuckets(): Record<
  'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts',
  PurchaseLine[]
> {
  return { fertilizers: [], pesticides: [], seeds: [], cscProducts: [] };
}

function addPurchaseLine(
  buckets: ReturnType<typeof emptyPurchaseBuckets>,
  category: 'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts',
  line: PurchaseLine,
) {
  const existing = buckets[category].find(
    (x) => normalizeKey(x.name) === normalizeKey(line.name),
  );
  if (existing) {
    existing.amount += line.amount;
    return;
  }
  buckets[category].push(line);
}

function readWorkbookRows(filePath: string): Record<string, unknown>[] {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }
  const wb = XLSX.readFile(abs, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('Workbook has no sheets.');
  }
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
}

async function loadCatalogFromFirestore(): Promise<{
  fertilizers: unknown;
  pesticides: unknown;
  seeds: unknown;
  cscProducts: unknown;
}> {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS for --catalog-firestore.');
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const snap = await admin.firestore().collection('settings').doc('catalog').get();
  if (!snap.exists) {
    throw new Error('Firestore settings/catalog document not found.');
  }
  const data = snap.data() ?? {};
  return {
    fertilizers: data.fertilizers ?? [],
    pesticides: data.pesticides ?? [],
    seeds: data.seeds ?? [],
    cscProducts: data.cscProducts ?? data.otherPecsItems ?? [],
  };
}

async function loadCatalogFromPostgres(prisma: PrismaClient) {
  const [fertilizers, pesticides, seeds, cscProducts] = await Promise.all([
    prisma.catalogFertilizer.findMany(),
    prisma.catalogPesticide.findMany(),
    prisma.catalogSeed.findMany(),
    prisma.catalogCscProduct.findMany(),
  ]);
  return { fertilizers, pesticides, seeds, cscProducts };
}

function parseFarmerRow(
  row: Record<string, unknown>,
  productColumns: string[],
  lookup: ProductLookup,
): {
  externalId: string;
  slNo: number;
  dateOfPurchase: string;
  landOwnerName: string;
  villageOrMouza: string;
  khataNo: string;
  area: number;
  farmerName: string;
  aadharNo: string;
  mobileNo: string;
  cropsName: string;
  address: string;
  paymentRemark: string;
  fertilizers: PurchaseLine[];
  pesticides: PurchaseLine[];
  seeds: PurchaseLine[];
  cscProducts: PurchaseLine[];
  remarks: string;
} {
  const buckets = emptyPurchaseBuckets();

  for (const column of productColumns) {
    const amount = parseQuantity(row[column]);
    if (amount <= 0) continue;
    const { category, line } = resolveProduct(column, lookup);
    addPurchaseLine(buckets, category, {
      id: line.id,
      name: line.name,
      amount,
      price: line.price,
      ...(line.unit ? { unit: line.unit } : {}),
    });
  }

  const totalInputs = Number(row['Total inputs (₹)'] ?? 0) || 0;
  backfillPricesFromTotal(buckets, totalInputs);

  const slNo = Number(row['SL'] ?? 0) || 0;
  const farmerName = dashToEmpty(row['Farmer name']);

  return {
    externalId: randomUUID(),
    slNo,
    dateOfPurchase: parseExcelDate(row['Date of purchase']),
    landOwnerName: dashToEmpty(row['Land owner name']),
    villageOrMouza: dashToEmpty(row['Village / mouza']),
    khataNo: dashToEmpty(row['Khata no.']),
    area: Number(row['Area (acre)'] ?? 0) || 0,
    farmerName,
    aadharNo: dashToEmpty(row['Aadhaar no.']),
    mobileNo: dashToEmpty(row['Mobile no.']),
    cropsName: dashToEmpty(row['Crops']),
    address: dashToEmpty(row['Address']),
    paymentRemark: dashToEmpty(row['Payment remark']),
    fertilizers: buckets.fertilizers,
    pesticides: buckets.pesticides,
    seeds: buckets.seeds,
    cscProducts: buckets.cscProducts,
    remarks: dashToEmpty(row['Remarks']),
  };
}

/** When catalog prices are missing, spread Excel total evenly per unit so row totals match. */
function backfillPricesFromTotal(
  buckets: ReturnType<typeof emptyPurchaseBuckets>,
  totalInputs: number,
): void {
  const lines = [
    ...buckets.fertilizers,
    ...buckets.pesticides,
    ...buckets.seeds,
    ...buckets.cscProducts,
  ];
  if (totalInputs <= 0 || !lines.length) return;

  const pricedTotal = lines.reduce((sum, line) => sum + line.amount * line.price, 0);
  if (pricedTotal > 0) return;

  const totalQty = lines.reduce((sum, line) => sum + line.amount, 0);
  if (totalQty <= 0) return;

  const unitPrice = totalInputs / totalQty;
  for (const line of lines) {
    line.price = unitPrice;
  }
}

function productColumnsFromHeaders(headers: string[]): string[] {
  const baseSet = new Set<string>([...BASE_HEADERS, ...TRAILING_HEADERS]);
  return headers.filter((h) => h.trim() && !baseSet.has(h.trim()));
}

async function main() {
  const { filePath, apply, drop, catalogFirestore } = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL in .env (PostgreSQL connection string).');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}${drop ? ' + DROP' : ''}`);
  console.log(`File: ${path.resolve(filePath)}`);
  console.log(`PostgreSQL: ${process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@')}\n`);

  try {
    const rawRows = readWorkbookRows(filePath);
    if (!rawRows.length) {
      console.log('No data rows found in workbook.');
      return;
    }

    const headers = Object.keys(rawRows[0] ?? {});
    const productColumns = productColumnsFromHeaders(headers);
    console.log(`Rows: ${rawRows.length}, product columns: ${productColumns.length}`);

    const catalog = catalogFirestore
      ? await loadCatalogFromFirestore()
      : await loadCatalogFromPostgres(prisma);
    const lookup = buildProductLookup(catalog);
    console.log(`Catalog SKUs loaded for matching: ${lookup.size}${catalogFirestore ? ' (Firestore)' : ' (PostgreSQL)'}\n`);

    if (apply && drop) {
      const deleted = await prisma.farmer.deleteMany();
      console.log(`Cleared ${deleted.count} existing farmer row(s).\n`);
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rawRows) {
      const slNo = Number(row['SL'] ?? 0) || 0;
      const farmerName = dashToEmpty(row['Farmer name']);
      if (!slNo && !farmerName) {
        skipped++;
        continue;
      }

      const payload = parseFarmerRow(row, productColumns, lookup);
      const lineCount =
        payload.fertilizers.length +
        payload.pesticides.length +
        payload.seeds.length +
        payload.cscProducts.length;

      if (imported < 3 || imported % 250 === 0) {
        console.log(
          `SL ${payload.slNo} — ${payload.farmerName || 'unnamed'} (${lineCount} product line(s))`,
        );
      }

      if (apply) {
        await createFarmerWithLines(prisma, payload);
      }
      imported++;
    }

    const finalCount = apply ? await prisma.farmer.count() : imported;
    console.log(`\nFarmers: ${imported} row(s) ${apply ? 'imported' : 'would import'} (${skipped} skipped).`);
    console.log(`Total in farmers table: ${finalCount}`);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\nDone.');
  if (!apply) {
    console.log('Re-run with --apply to write to PostgreSQL.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
