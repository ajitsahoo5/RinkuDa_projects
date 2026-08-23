import XLSX from "xlsx-js-style";
import type { AppSettings } from "../types/appSettings";
import type { AppUserProfile } from "../types/appUser";
import type { CropCatalogItem } from "../types/cropCatalog";
import type { CatalogLineItem } from "../types/fertilizerCatalog";
import type { Farmer, FertilizerType } from "../types/farmer";
import { omitZeroAmountLines, totalPrice } from "../types/farmer";
import type { RemarkCatalogItem } from "../types/remarkCatalog";
import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

export type DataRegistryExportInput = {
  farmers: Farmer[];
  fertilizers: CatalogLineItem[];
  pesticides: CatalogLineItem[];
  seeds: CatalogLineItem[];
  cscProducts: CatalogLineItem[];
  crops: CropCatalogItem[];
  villageMouzas: VillageMouzaCatalogItem[];
  remarkPresets: RemarkCatalogItem[];
  users: AppUserProfile[];
  appSettings?: AppSettings;
};

type CategoryBlock = {
  key: "fertilizers" | "pesticides" | "seeds" | "cscProducts";
  label: string;
  products: CatalogLineItem[];
};

type CellStyle = {
  fill?: { fgColor: { rgb: string } };
  font?: { bold?: boolean; sz?: number; color?: { rgb: string } };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
};

const BASE_HEADERS = [
  "SL",
  "Date of purchase",
  "Farmer name",
  "Land owner name",
  "Village / mouza",
  "Khata no.",
  "Area (acre)",
  "Aadhaar no.",
  "Mobile no.",
  "Crops",
  "Address",
  "Payment remark",
] as const;

const TAIL_HEADERS = ["Remarks", "Total inputs (₹)"] as const;

const CATEGORY_COLORS: Record<CategoryBlock["key"], string> = {
  fertilizers: "DCFCE7",
  pesticides: "FEF3C7",
  seeds: "DBEAFE",
  cscProducts: "FCE7F3",
};

const CATEGORY_HEADER_COLORS: Record<CategoryBlock["key"], string> = {
  fertilizers: "166534",
  pesticides: "92400E",
  seeds: "1E40AF",
  cscProducts: "9D174D",
};

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function dash(value: string): string {
  const t = value.trim();
  return t ? t : "—";
}

function qtyMap(lines: FertilizerType[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of omitZeroAmountLines(lines)) {
    const name = line.name.trim();
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + line.amount);
  }
  return map;
}

function mergeCatalogWithFarmerProducts(
  catalog: CatalogLineItem[],
  farmerLines: FertilizerType[],
): CatalogLineItem[] {
  const names = new Set(catalog.map((x) => x.name.trim()));
  const extra: CatalogLineItem[] = [];
  for (const line of omitZeroAmountLines(farmerLines)) {
    const name = line.name.trim();
    if (!name || names.has(name)) continue;
    names.add(name);
    extra.push({
      id: line.id || name.toLowerCase().replace(/\s+/g, "-"),
      name,
      unit: line.unit ?? "kg",
      price: line.price ?? 0,
      stock: 0,
    });
  }
  return [...catalog, ...extra];
}

function buildCategoryBlocks(input: DataRegistryExportInput): CategoryBlock[] {
  const allFarmers = input.farmers;
  const farmerLines = (key: CategoryBlock["key"]) =>
    allFarmers.flatMap((f) => f[key]);

  return [
    {
      key: "fertilizers",
      label: "FERTILIZERS",
      products: mergeCatalogWithFarmerProducts(input.fertilizers, farmerLines("fertilizers")),
    },
    {
      key: "pesticides",
      label: "PESTICIDES",
      products: mergeCatalogWithFarmerProducts(input.pesticides, farmerLines("pesticides")),
    },
    {
      key: "seeds",
      label: "SEEDS",
      products: mergeCatalogWithFarmerProducts(input.seeds, farmerLines("seeds")),
    },
    {
      key: "cscProducts",
      label: "CSC PRODUCTS",
      products: mergeCatalogWithFarmerProducts(input.cscProducts, farmerLines("cscProducts")),
    },
  ];
}

function setCellStyle(ws: XLSX.WorkSheet, row: number, col: number, style: CellStyle): void {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[ref];
  if (!cell) return;
  cell.s = style;
}

function addSimpleSheet(
  wb: XLSX.WorkBook,
  name: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.min(Math.max(h.length + 2, 12), 36) }));
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

function buildOverviewSheet(input: DataRegistryExportInput, blocks: CategoryBlock[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["Farmer registry — full data export"],
    [`Generated ${dateStamp()}`],
    [],
    ["Data relationships"],
    ["Source", "Type", "Links to", "Record count"],
    ["farmers", "Collection", "settings/catalog (product lines)", input.farmers.length],
    ["settings/catalog", "Document", "farmers.* purchase arrays", 1],
    ["  fertilizers[]", "Catalog array", "farmers.fertilizers[]", input.fertilizers.length],
    ["  pesticides[]", "Catalog array", "farmers.pesticides[]", input.pesticides.length],
    ["  seeds[]", "Catalog array", "farmers.seeds[]", input.seeds.length],
    ["  cscProducts[]", "Catalog array", "farmers.cscProducts[]", input.cscProducts.length],
    ["  crops[]", "Catalog array", "farmers.cropsName", input.crops.length],
    ["  villageMouzas[]", "Catalog array", "farmers.villageOrMouza", input.villageMouzas.length],
    ["  remarkPresets[]", "Catalog array", "farmers.remarks", input.remarkPresets.length],
    ["users", "Collection", "Firebase Auth profiles", input.users.length],
    ["settings/app", "Document", "Mobile + admin settings", 1],
    [],
    ["Excel sheets in this workbook"],
    ["Sheet", "Purpose"],
    ["Overview", "This summary and data map"],
    ["Farmers", "All farmer rows — product qty columns grouped by category"],
    ...blocks.map((b) => [`Catalog — ${b.label}`, `${b.products.length} product(s) — edit name, unit, price, stock`]),
    ["Crops", "Crop name presets for farmer form"],
    ["Villages", "Village / mouza presets"],
    ["Remarks", "Remark presets"],
    ["Users", "Admin and client login profiles"],
    ["App settings", "Shared app configuration"],
    [],
    ["How to enter farmer data in Excel"],
    ["1. Open the Farmers sheet."],
    ["2. Each product category has its own column group (Fertilizers, Pesticides, Seeds, CSC Products)."],
    ["3. Enter quantity purchased in the cell under the product name; leave blank if not purchased."],
    ["4. Fill farmer details in the left columns (SL, date, name, village, etc.)."],
    ["5. Use Catalog sheets to add or update products before filling farmer quantities."],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 34 }, { wch: 14 }];
  setCellStyle(ws, 0, 0, { font: { bold: true, sz: 14, color: { rgb: "111827" } } });
  setCellStyle(ws, 3, 0, { font: { bold: true, sz: 12, color: { rgb: "111827" } } });
  setCellStyle(ws, 17, 0, { font: { bold: true, sz: 12, color: { rgb: "111827" } } });
  setCellStyle(ws, 28, 0, { font: { bold: true, sz: 12, color: { rgb: "111827" } } });
  for (let c = 0; c < 4; c += 1) {
    setCellStyle(ws, 4, c, {
      fill: { fgColor: { rgb: "111827" } },
      font: { bold: true, color: { rgb: "F9FAFB" } },
    });
    setCellStyle(ws, 18, c, {
      fill: { fgColor: { rgb: "111827" } },
      font: { bold: true, color: { rgb: "F9FAFB" } },
    });
  }
  return ws;
}

function buildFarmersSheet(input: DataRegistryExportInput, blocks: CategoryBlock[]): XLSX.WorkSheet {
  const categoryRow: string[] = ["FARMER DETAILS"];
  const headerRow: string[] = [...BASE_HEADERS];
  const merges: XLSX.Range[] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: BASE_HEADERS.length - 1 } }];

  let col = BASE_HEADERS.length;
  for (const block of blocks) {
    if (!block.products.length) continue;
    categoryRow.push(block.label);
    for (let i = 1; i < block.products.length; i += 1) categoryRow.push("");
    merges.push({
      s: { r: 0, c: col },
      e: { r: 0, c: col + block.products.length - 1 },
    });
    for (const product of block.products) {
      headerRow.push(product.name);
    }
    col += block.products.length;
  }

  categoryRow.push("SUMMARY");
  for (let i = 1; i < TAIL_HEADERS.length; i += 1) categoryRow.push("");
  merges.push({
    s: { r: 0, c: col },
    e: { r: 0, c: col + TAIL_HEADERS.length - 1 },
  });
  headerRow.push(...TAIL_HEADERS);

  const dataRows = input.farmers.map((f) => {
    const row: (string | number)[] = [
      f.slNo,
      dash(f.dateOfPurchase),
      f.farmerName,
      dash(f.landOwnerName),
      dash(f.villageOrMouza),
      dash(f.khataNo),
      f.area,
      dash(f.aadharNo),
      dash(f.mobileNo),
      dash(f.cropsName),
      dash(f.address),
      dash(f.paymentRemark),
    ];

    for (const block of blocks) {
      const quantities = qtyMap(f[block.key]);
      for (const product of block.products) {
        row.push(quantities.get(product.name.trim()) ?? "");
      }
    }

    row.push(dash(f.remarks), totalPrice(f));
    return row;
  });

  const ws = XLSX.utils.aoa_to_sheet([categoryRow, headerRow, ...dataRows]);
  ws["!merges"] = merges;
  ws["!cols"] = headerRow.map((h, idx) => {
    if (idx < BASE_HEADERS.length) return { wch: idx === 0 ? 5 : 14 };
    if (idx >= headerRow.length - TAIL_HEADERS.length) return { wch: 18 };
    return { wch: Math.min(Math.max(h.length + 2, 10), 22) };
  });
  ws["!freeze"] = { xSplit: BASE_HEADERS.length, ySplit: 2, topLeftCell: "A3", activePane: "bottomRight" };

  for (let c = 0; c < BASE_HEADERS.length; c += 1) {
    setCellStyle(ws, 0, c, {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true, color: { rgb: "111827" } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    setCellStyle(ws, 1, c, {
      fill: { fgColor: { rgb: "111827" } },
      font: { bold: true, color: { rgb: "F9FAFB" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    });
  }

  col = BASE_HEADERS.length;
  for (const block of blocks) {
    if (!block.products.length) continue;
    const bg = CATEGORY_COLORS[block.key];
    const fg = CATEGORY_HEADER_COLORS[block.key];
    for (let i = 0; i < block.products.length; i += 1) {
      setCellStyle(ws, 0, col + i, {
        fill: { fgColor: { rgb: bg } },
        font: { bold: true, color: { rgb: fg } },
        alignment: { horizontal: "center", vertical: "center" },
      });
      setCellStyle(ws, 1, col + i, {
        fill: { fgColor: { rgb: bg } },
        font: { bold: true, color: { rgb: "111827" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      });
    }
    col += block.products.length;
  }

  for (let c = col; c < col + TAIL_HEADERS.length; c += 1) {
    setCellStyle(ws, 0, c, {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true, color: { rgb: "111827" } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    setCellStyle(ws, 1, c, {
      fill: { fgColor: { rgb: "111827" } },
      font: { bold: true, color: { rgb: "F9FAFB" } },
      alignment: { horizontal: "center", vertical: "center" },
    });
  }

  return ws;
}

function buildCatalogSheet(block: CategoryBlock): XLSX.WorkSheet {
  const headers = ["ID", "Name", "Unit", "Price (₹)", "Stock"];
  const rows = block.products.map((p) => [p.id, p.name, p.unit, p.price, p.stock]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
  const bg = CATEGORY_COLORS[block.key];
  for (let c = 0; c < headers.length; c += 1) {
    setCellStyle(ws, 0, c, {
      fill: { fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: "111827" } },
    });
  }
  return ws;
}

/** Full registry workbook: overview, farmers (by product category), catalog sheets, lookups, users. */
export function downloadDataRegistryExcel(input: DataRegistryExportInput): void {
  const blocks = buildCategoryBlocks(input);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildOverviewSheet(input, blocks), "Overview");
  XLSX.utils.book_append_sheet(wb, buildFarmersSheet(input, blocks), "Farmers");

  for (const block of blocks) {
    if (!block.products.length) continue;
    XLSX.utils.book_append_sheet(wb, buildCatalogSheet(block), `Catalog — ${block.label}`.slice(0, 31));
  }

  addSimpleSheet(
    wb,
    "Crops",
    ["ID", "Name"],
    input.crops.map((c) => [c.id, c.name]),
  );
  addSimpleSheet(
    wb,
    "Villages",
    ["ID", "Name"],
    input.villageMouzas.map((v) => [v.id, v.name]),
  );
  addSimpleSheet(
    wb,
    "Remarks",
    ["ID", "Name"],
    input.remarkPresets.map((r) => [r.id, r.name]),
  );
  addSimpleSheet(
    wb,
    "Users",
    ["UID", "Email", "Display name", "Role", "Active"],
    input.users.map((u) => [u.uid, u.email, u.displayName ?? "", u.role, u.active ? "Yes" : "No"]),
  );

  const settings = input.appSettings;
  addSimpleSheet(
    wb,
    "App settings",
    ["Google Sheet link", "Address", "GST number", "Mobile number"],
    [[
      settings?.googleSheetLink ?? "",
      settings?.address ?? "",
      settings?.gstNumber ?? "",
      settings?.mobileNumber ?? "",
    ]],
  );

  XLSX.writeFile(wb, `data-registry-full-${dateStamp()}.xlsx`);
}

export function summarizeDataRegistry(input: DataRegistryExportInput) {
  const blocks = buildCategoryBlocks(input);
  return {
    farmers: input.farmers.length,
    fertilizers: blocks.find((b) => b.key === "fertilizers")?.products.length ?? 0,
    pesticides: blocks.find((b) => b.key === "pesticides")?.products.length ?? 0,
    seeds: blocks.find((b) => b.key === "seeds")?.products.length ?? 0,
    cscProducts: blocks.find((b) => b.key === "cscProducts")?.products.length ?? 0,
    crops: input.crops.length,
    villages: input.villageMouzas.length,
    remarks: input.remarkPresets.length,
    users: input.users.length,
  };
}
