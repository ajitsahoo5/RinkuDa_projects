/**
 * Import full data-registry Excel (admin export) into PostgreSQL.
 *
 * Sheets: Overview, Farmers, Catalog ×4, Crops, Villages, Remarks, Users, App settings
 *
 * Dry run:
 *   npm run import:data-registry-xlsx -- Keys/data-registry-full-2026-08-23.xlsx
 *
 * Apply:
 *   npm run import:data-registry-xlsx -- Keys/data-registry-full-2026-08-23.xlsx --apply
 *
 * Replace registry rows first:
 *   npm run import:data-registry-xlsx -- Keys/data-registry-full-2026-08-23.xlsx --apply --drop
 */
import { PrismaClient, RegistryUserRole } from '@prisma/client';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  clearRegistryData,
  createFarmerWithLines,
  upsertCatalogTables,
} from './registry-db.helpers';

config();

type CliFlags = {
  apply: boolean;
  drop: boolean;
  filePath: string;
};

type CatalogLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
};

type NamedItem = { id: string; name: string };

type PurchaseLine = {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit?: string;
};

type CategoryKey = 'fertilizers' | 'pesticides' | 'seeds' | 'cscProducts';

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

const CATALOG_SHEETS: { sheet: string; key: CategoryKey }[] = [
  { sheet: 'Catalog — FERTILIZERS', key: 'fertilizers' },
  { sheet: 'Catalog — PESTICIDES', key: 'pesticides' },
  { sheet: 'Catalog — SEEDS', key: 'seeds' },
  { sheet: 'Catalog — CSC PRODUCTS', key: 'cscProducts' },
];

function parseArgs(argv: string[]): CliFlags {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const filePath = positional[0];
  if (!filePath) {
    console.error(
      'Usage: npm run import:data-registry-xlsx -- <path-to.xlsx> [--apply] [--drop]',
    );
    process.exit(1);
  }
  return {
    filePath,
    apply: argv.includes('--apply'),
    drop: argv.includes('--drop'),
  };
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
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 0) {
    const parsed = XLSX.SSF.parse_date_code(asNum);
    if (parsed) {
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${m}-${d}`;
    }
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return raw;
}

function parseQuantity(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function slugId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || randomUUID();
}

function sheetRows(wb: XLSX.WorkBook, name: string): unknown[][] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
}

function findSheet(wb: XLSX.WorkBook, prefix: string): string | undefined {
  return wb.SheetNames.find((n) => n === prefix || n.startsWith(prefix));
}

function parseCatalogSheet(rows: unknown[][]): CatalogLine[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((c) => String(c ?? '').trim().toLowerCase());
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const unitIdx = header.findIndex((h) => h === 'unit');
  const priceIdx = header.findIndex((h) => h.includes('price'));
  const stockIdx = header.indexOf('stock');
  const out: CatalogLine[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = String(row[nameIdx] ?? '').trim();
    if (!name) continue;
    out.push({
      id: String(row[idIdx] ?? slugId(name)).trim() || slugId(name),
      name,
      unit: String(row[unitIdx] ?? 'kg').trim() || 'kg',
      price: Number(row[priceIdx] ?? 0) || 0,
      stock: Number(row[stockIdx] ?? 0) || 0,
    });
  }
  return out;
}

function parseNamedSheet(rows: unknown[][]): NamedItem[] {
  if (rows.length < 2) return [];
  const out: NamedItem[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = String(row[1] ?? row[0] ?? '').trim();
    if (!name) continue;
    out.push({
      id: String(row[0] ?? slugId(name)).trim() || slugId(name),
      name,
    });
  }
  return out;
}

function parseUsersSheet(rows: unknown[][]): {
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: RegistryUserRole;
  active: boolean;
}[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((c) => String(c ?? '').trim().toLowerCase());
  const uidIdx = header.findIndex((h) => h === 'uid');
  const emailIdx = header.indexOf('email');
  const nameIdx = header.findIndex((h) => h.includes('display'));
  const roleIdx = header.indexOf('role');
  const activeIdx = header.indexOf('active');
  const out: {
    firebaseUid: string;
    email: string;
    displayName: string | null;
    role: RegistryUserRole;
    active: boolean;
  }[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const email = String(row[emailIdx] ?? '').trim().toLowerCase();
    const firebaseUid = String(row[uidIdx] ?? '').trim();
    if (!email || !firebaseUid) continue;
    const roleRaw = String(row[roleIdx] ?? 'client').trim().toLowerCase();
    out.push({
      firebaseUid,
      email,
      displayName: String(row[nameIdx] ?? '').trim() || null,
      role: roleRaw === 'admin' ? RegistryUserRole.admin : RegistryUserRole.client,
      active: String(row[activeIdx] ?? 'yes').trim().toLowerCase() !== 'no',
    });
  }
  return out;
}

function parseAppSettings(rows: unknown[][]): {
  googleSheetLink: string | null;
  address: string | null;
  gstNumber: string | null;
  mobileNumber: string | null;
} {
  if (rows.length < 2) {
    return { googleSheetLink: null, address: null, gstNumber: null, mobileNumber: null };
  }
  const header = rows[0].map((c) => String(c ?? '').trim().toLowerCase());
  const data = rows[1];
  const pick = (label: string): string | null => {
    const idx = header.findIndex((h) => h.includes(label));
    if (idx < 0) return null;
    const v = dashToEmpty(data[idx]);
    return v || null;
  };
  return {
    googleSheetLink: pick('google'),
    address: pick('address'),
    gstNumber: pick('gst'),
    mobileNumber: pick('mobile'),
  };
}

function buildProductColumnMap(
  headerRow: string[],
  catalog: Record<CategoryKey, CatalogLine[]>,
): Map<number, { category: CategoryKey; product: CatalogLine }> {
  const map = new Map<number, { category: CategoryKey; product: CatalogLine }>();
  const allByName = new Map<string, CatalogLine>();
  for (const key of Object.keys(catalog) as CategoryKey[]) {
    for (const product of catalog[key]) {
      allByName.set(product.name.trim().toLowerCase(), product);
    }
  }

  const blocks: { key: CategoryKey; products: CatalogLine[] }[] = [
    { key: 'fertilizers', products: catalog.fertilizers },
    { key: 'pesticides', products: catalog.pesticides },
    { key: 'seeds', products: catalog.seeds },
    { key: 'cscProducts', products: catalog.cscProducts },
  ];

  let col = BASE_HEADERS.length;
  for (const block of blocks) {
    for (let i = 0; i < block.products.length; i += 1) {
      const colIdx = col + i;
      const headerName = String(headerRow[colIdx] ?? '').trim();
      if (!headerName || headerName === 'Remarks' || headerName.startsWith('Total inputs')) {
        continue;
      }

      const fromCatalog = allByName.get(headerName.toLowerCase());
      const fallback = block.products[i];
      const product: CatalogLine =
        fromCatalog ??
        (fallback && fallback.name.trim().toLowerCase() === headerName.toLowerCase()
          ? fallback
          : {
              id: slugId(headerName),
              name: headerName,
              unit: fallback?.unit ?? 'kg',
              price: fallback?.price ?? 0,
              stock: fallback?.stock ?? 0,
            });

      map.set(colIdx, { category: block.key, product });
    }
    col += block.products.length;
  }

  return map;
}

function parseFarmersSheet(
  rows: unknown[][],
  catalog: Record<CategoryKey, CatalogLine[]>,
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
}[] {
  if (rows.length < 3) return [];

  const headerRow = rows[1].map((c) => String(c ?? '').trim());
  const headerIndex = new Map<string, number>();
  headerRow.forEach((h, idx) => {
    if (h) headerIndex.set(h, idx);
  });

  const productCols = buildProductColumnMap(headerRow, catalog);
  const farmers: ReturnType<typeof parseFarmersSheet> = [];

  for (let r = 2; r < rows.length; r += 1) {
    const row = rows[r];
    const slNo = Number(row[headerIndex.get('SL') ?? 0] ?? 0) || 0;
    const farmerName = dashToEmpty(row[headerIndex.get('Farmer name') ?? -1]);
    if (!slNo && !farmerName) continue;

    const buckets: Record<CategoryKey, PurchaseLine[]> = {
      fertilizers: [],
      pesticides: [],
      seeds: [],
      cscProducts: [],
    };

    for (const [colIdx, { category, product }] of productCols.entries()) {
      const amount = parseQuantity(row[colIdx]);
      if (amount <= 0) continue;
      buckets[category].push({
        id: product.id,
        name: product.name,
        amount,
        price: product.price,
        unit: product.unit,
      });
    }

    farmers.push({
      externalId: randomUUID(),
      slNo,
      dateOfPurchase: parseExcelDate(row[headerIndex.get('Date of purchase') ?? -1]),
      landOwnerName: dashToEmpty(row[headerIndex.get('Land owner name') ?? -1]),
      villageOrMouza: dashToEmpty(row[headerIndex.get('Village / mouza') ?? -1]),
      khataNo: dashToEmpty(row[headerIndex.get('Khata no.') ?? -1]),
      area: Number(row[headerIndex.get('Area (acre)') ?? -1] ?? 0) || 0,
      farmerName,
      aadharNo: dashToEmpty(row[headerIndex.get('Aadhaar no.') ?? -1]),
      mobileNo: dashToEmpty(row[headerIndex.get('Mobile no.') ?? -1]),
      cropsName: dashToEmpty(row[headerIndex.get('Crops') ?? -1]),
      address: dashToEmpty(row[headerIndex.get('Address') ?? -1]),
      paymentRemark: dashToEmpty(row[headerIndex.get('Payment remark') ?? -1]),
      fertilizers: buckets.fertilizers,
      pesticides: buckets.pesticides,
      seeds: buckets.seeds,
      cscProducts: buckets.cscProducts,
      remarks: dashToEmpty(row[headerIndex.get('Remarks') ?? -1]),
    });
  }

  return farmers;
}

async function main() {
  const { filePath, apply, drop } = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL in .env');
    process.exit(1);
  }

  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(abs, { cellDates: true });
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}${drop ? ' + DROP' : ''}`);
  console.log(`File: ${abs}`);
  console.log(`Sheets: ${wb.SheetNames.join(', ')}\n`);

  const catalog: Record<CategoryKey, CatalogLine[]> = {
    fertilizers: [],
    pesticides: [],
    seeds: [],
    cscProducts: [],
  };

  for (const { sheet, key } of CATALOG_SHEETS) {
    const actual = findSheet(wb, sheet) ?? sheet;
    catalog[key] = parseCatalogSheet(sheetRows(wb, actual));
    console.log(`${actual}: ${catalog[key].length} product(s)`);
  }

  const crops = parseNamedSheet(sheetRows(wb, 'Crops'));
  const villages = parseNamedSheet(sheetRows(wb, 'Villages'));
  const remarks = parseNamedSheet(sheetRows(wb, 'Remarks'));
  const users = parseUsersSheet(sheetRows(wb, 'Users'));
  const appSettings = parseAppSettings(sheetRows(wb, 'App settings'));
  const farmers = parseFarmersSheet(sheetRows(wb, 'Farmers'), catalog);

  console.log(`Crops: ${crops.length}, Villages: ${villages.length}, Remarks: ${remarks.length}`);
  console.log(`Users: ${users.length}, Farmers: ${farmers.length}\n`);

  const prisma = new PrismaClient();

  try {
    if (apply && drop) {
      await clearRegistryData(prisma);
      console.log('Cleared registry tables.\n');
    }

    if (apply) {
      await upsertCatalogTables(prisma, catalog, crops, villages, remarks);
      console.log('Catalog tables updated.');

      await prisma.settingsApp.upsert({
        where: { id: 'app' },
        create: { id: 'app', ...appSettings },
        update: appSettings,
      });
      console.log('settings_app updated.');

      for (const user of users) {
        await prisma.registryUser.upsert({
          where: { firebaseUid: user.firebaseUid },
          create: user,
          update: {
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            active: user.active,
          },
        });
      }
      console.log(`registry_users: ${users.length} row(s) upserted.`);

      let farmerCount = 0;
      for (const f of farmers) {
        await createFarmerWithLines(prisma, f);
        farmerCount += 1;
        if (farmerCount <= 2 || farmerCount % 300 === 0) {
          console.log(`  farmer SL ${f.slNo} — ${f.farmerName}`);
        }
      }
      console.log(`farmers: ${farmerCount} row(s) imported.`);
    }

    const counts = apply
      ? {
          farmers: await prisma.farmer.count(),
          users: await prisma.registryUser.count(),
          fertilizerLines: await prisma.farmerFertilizerLine.count(),
          seedLines: await prisma.farmerSeedLine.count(),
          catalogFertilizers: await prisma.catalogFertilizer.count(),
          catalogSeeds: await prisma.catalogSeed.count(),
        }
      : null;

    if (counts) {
      console.log(
        `\nPostgreSQL totals: farmers=${counts.farmers}, registry_users=${counts.users}, ` +
          `fertilizer_lines=${counts.fertilizerLines}, seed_lines=${counts.seedLines}, ` +
          `catalog_fertilizers=${counts.catalogFertilizers}, catalog_seeds=${counts.catalogSeeds}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\nDone.');
  if (!apply) {
    console.log('Re-run with --apply to write to PostgreSQL.');
    if (!drop) {
      console.log('Tip: use --apply --drop to replace existing farmers/users before import.');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
