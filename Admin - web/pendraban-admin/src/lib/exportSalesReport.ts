import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";
import type { Farmer, FertilizerType } from "../types/farmer";
import { omitZeroAmountLines, totalPrice } from "../types/farmer";
import { APP_SHORT_NAME } from "./branding";
import {
  filterFarmersByPurchaseDate,
  normalizePurchaseDate,
  salesFilterLabel,
  type SalesDateFilter,
} from "./salesReportDates";

type SalesLineRow = {
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

type ProductAggregate = {
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  lineTotal: number;
};

type RemarkSalesRow = {
  remark: string;
  totalSales: number;
};

type ReportSummary = {
  period: string;
  buyerCount: number;
  productsSoldCount: number;
  totalSales: number;
};

type CellStyle = {
  fill?: { fgColor: { rgb: string } };
  font?: { bold?: boolean; sz?: number; color?: { rgb: string } };
  alignment?: { horizontal?: string; vertical?: string };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
  numFmt?: string;
};

const TABLE_HEADERS = [
  "Product Name",
  "Category",
  "Quantity",
  "Unit",
  "Unit Price",
  "Line Total",
] as const;

const COL_COUNT = TABLE_HEADERS.length;

const REMARK_TABLE_HEADERS = ["Remark", "Total Sales"] as const;
const REMARK_COL_COUNT = REMARK_TABLE_HEADERS.length;

const TITLE_STYLE: CellStyle = {
  font: { bold: true, sz: 14, color: { rgb: "111827" } },
  alignment: { horizontal: "left", vertical: "center" },
};

const SUMMARY_LABEL_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: "374151" } },
  fill: { fgColor: { rgb: "F3F4F6" } },
  border: {
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  },
};

const SUMMARY_VALUE_STYLE: CellStyle = {
  font: { color: { rgb: "111827" } },
  fill: { fgColor: { rgb: "F9FAFB" } },
  border: {
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  },
};

const HEADER_STYLE: CellStyle = {
  fill: { fgColor: { rgb: "111827" } },
  font: { bold: true, color: { rgb: "F9FAFB" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    bottom: { style: "medium", color: { rgb: "000000" } },
  },
};

const TOTAL_STYLE: CellStyle = {
  fill: { fgColor: { rgb: "D1D5DB" } },
  font: { bold: true, color: { rgb: "111827" } },
  border: {
    top: { style: "medium", color: { rgb: "374151" } },
  },
};

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function summaryHeading(pacsName: string): string {
  return `${pacsName} Sales report summary`;
}

function productKey(category: string, productName: string): string {
  return `${category.trim().toLowerCase()}|${productName.trim().toLowerCase()}`;
}

function aggregateKey(category: string, productName: string): string {
  return productKey(category, productName);
}

function farmersForReport(allFarmers: Farmer[], filter: SalesDateFilter): Farmer[] {
  return filterFarmersByPurchaseDate(allFarmers, filter).sort((a, b) => {
    const da = normalizePurchaseDate(a.dateOfPurchase) ?? "";
    const db = normalizePurchaseDate(b.dateOfPurchase) ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.slNo - b.slNo;
  });
}

/** One row per unique product across the selected period. */
function collectProductAggregates(farmers: Farmer[]): ProductAggregate[] {
  const byProduct = new Map<string, ProductAggregate>();

  const addLine = (line: FertilizerType, category: string) => {
    const productName = line.name.trim();
    if (!productName) return;

    const key = aggregateKey(category, productName);
    const quantity = line.amount;
    const lineTotal = quantity * line.price;
    const unit = (line.unit ?? "").trim() || "kg";
    const existing = byProduct.get(key);

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal += lineTotal;
      if (!existing.unit && unit) existing.unit = unit;
      return;
    }

    byProduct.set(key, {
      productName,
      category,
      quantity,
      unit,
      lineTotal,
    });
  };

  for (const f of farmers) {
    const pushLines = (items: FertilizerType[], category: string) => {
      for (const line of omitZeroAmountLines(items)) {
        addLine(line, category);
      }
    };
    pushLines(f.fertilizers, "Fertilizer");
    pushLines(f.pesticides, "Pesticide");
    pushLines(f.seeds, "Seed");
    pushLines(f.cscProducts, "CSC product");
  }

  return [...byProduct.values()].sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    return a.productName.localeCompare(b.productName);
  });
}

function toSalesRows(aggregates: ProductAggregate[]): SalesLineRow[] {
  return aggregates.map((p) => ({
    productName: p.productName,
    category: p.category,
    quantity: p.quantity,
    unit: p.unit,
    unitPrice: p.quantity > 0 ? p.lineTotal / p.quantity : 0,
    lineTotal: p.lineTotal,
  }));
}

function grossSale(lines: SalesLineRow[]): number {
  return lines.reduce((s, r) => s + r.lineTotal, 0);
}

function farmerHasProductPurchase(f: Farmer): boolean {
  return (
    omitZeroAmountLines(f.fertilizers).length > 0 ||
    omitZeroAmountLines(f.pesticides).length > 0 ||
    omitZeroAmountLines(f.seeds).length > 0 ||
    omitZeroAmountLines(f.cscProducts).length > 0
  );
}

function countFarmersWhoPurchased(farmers: Farmer[]): number {
  return farmers.filter(farmerHasProductPurchase).length;
}

function remarkLabel(f: Farmer): string {
  const t = f.remarks.trim();
  return t || "(No remark)";
}

/** Total purchase value grouped by farmer remark for the selected period. */
function collectRemarkSales(farmers: Farmer[]): RemarkSalesRow[] {
  const byRemark = new Map<string, number>();

  for (const f of farmers) {
    if (!farmerHasProductPurchase(f)) continue;
    const label = remarkLabel(f);
    const sale = totalPrice(f);
    byRemark.set(label, (byRemark.get(label) ?? 0) + sale);
  }

  return [...byRemark.entries()]
    .map(([remark, totalSales]) => ({ remark, totalSales }))
    .sort((a, b) => a.remark.localeCompare(b.remark));
}

function remarkSalesSubTotal(rows: RemarkSalesRow[]): number {
  return rows.reduce((s, r) => s + r.totalSales, 0);
}

function buildReportSummary(
  filter: SalesDateFilter,
  lines: SalesLineRow[],
  farmerCount: number,
): ReportSummary {
  return {
    period: salesFilterLabel(filter),
    buyerCount: farmerCount,
    productsSoldCount: lines.length,
    totalSales: grossSale(lines),
  };
}

function fileSuffix(filter: SalesDateFilter): string {
  if (filter.mode === "single") return filter.date;
  return `${filter.from}_to_${filter.to}`;
}

export function summarizeSalesReport(
  allFarmers: Farmer[],
  filter: SalesDateFilter,
): { lineCount: number; grossSale: number; farmerCount: number } {
  const farmers = farmersForReport(allFarmers, filter);
  const lines = toSalesRows(collectProductAggregates(farmers));
  return {
    lineCount: lines.length,
    grossSale: grossSale(lines),
    farmerCount: countFarmersWhoPurchased(farmers),
  };
}

function linesForExport(
  allFarmers: Farmer[],
  filter: SalesDateFilter,
): {
  lines: SalesLineRow[];
  remarkLines: RemarkSalesRow[];
  farmerCount: number;
  summary: ReportSummary;
} {
  const farmers = farmersForReport(allFarmers, filter);
  const aggregates = collectProductAggregates(farmers);
  if (aggregates.length === 0) {
    throw new Error("No product sales found for the selected date(s).");
  }
  const lines = toSalesRows(aggregates);
  const remarkLines = collectRemarkSales(farmers);
  const farmerCount = countFarmersWhoPurchased(farmers);
  return {
    lines,
    remarkLines,
    farmerCount,
    summary: buildReportSummary(filter, lines, farmerCount),
  };
}

function colLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

function cellRef(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}

function setCellStyle(ws: XLSX.WorkSheet, row: number, col: number, style: CellStyle): void {
  const ref = cellRef(row, col);
  const cell = ws[ref];
  if (!cell) return;
  cell.s = style;
}

function bodyRowStyle(rowIndex: number): CellStyle {
  const shade = rowIndex % 2 === 0 ? "F9FAFB" : "E5E7EB";
  return {
    fill: { fgColor: { rgb: shade } },
    font: { color: { rgb: "111827" } },
    border: {
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    },
  };
}

function styleSummarySection(ws: XLSX.WorkSheet, pacsName: string): void {
  setCellStyle(ws, 0, 0, TITLE_STYLE);
  for (let row = 1; row <= 4; row++) {
    setCellStyle(ws, row, 0, SUMMARY_LABEL_STYLE);
    setCellStyle(ws, row, 1, SUMMARY_VALUE_STYLE);
  }
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } }];
  if (!ws.A1) ws.A1 = { t: "s", v: summaryHeading(pacsName) };
}

function styleSalesExcelSheet(ws: XLSX.WorkSheet, headerRow: number, dataRows: number): void {
  for (let c = 0; c < COL_COUNT; c++) {
    setCellStyle(ws, headerRow, c, HEADER_STYLE);
  }

  for (let r = 0; r < dataRows; r++) {
    const row = headerRow + 1 + r;
    const style = bodyRowStyle(r);
    for (let c = 0; c < COL_COUNT; c++) {
      setCellStyle(ws, row, c, style);
    }
  }

  const totalRow = headerRow + 1 + dataRows;
  for (let c = 0; c < COL_COUNT; c++) {
    setCellStyle(ws, totalRow, c, TOTAL_STYLE);
  }
}

function styleRemarkExcelSheet(
  ws: XLSX.WorkSheet,
  headerRow: number,
  dataRows: number,
): void {
  for (let c = 0; c < REMARK_COL_COUNT; c++) {
    setCellStyle(ws, headerRow, c, HEADER_STYLE);
  }

  for (let r = 0; r < dataRows; r++) {
    const row = headerRow + 1 + r;
    const style = bodyRowStyle(r);
    for (let c = 0; c < REMARK_COL_COUNT; c++) {
      setCellStyle(ws, row, c, style);
    }
  }

  const subTotalRow = headerRow + 1 + dataRows;
  for (let c = 0; c < REMARK_COL_COUNT; c++) {
    setCellStyle(ws, subTotalRow, c, TOTAL_STYLE);
  }
}

export function downloadSalesReportExcel(allFarmers: Farmer[], filter: SalesDateFilter): void {
  const { lines, remarkLines, summary } = linesForExport(allFarmers, filter);
  const pacsName = APP_SHORT_NAME;
  const title = summaryHeading(pacsName);
  const remarkSubTotal = remarkSalesSubTotal(remarkLines);

  const detailRows: (string | number)[][] = lines.map((r) => [
    r.productName,
    r.category,
    r.quantity,
    r.unit,
    r.unitPrice,
    r.lineTotal,
  ]);

  const remarkDetailRows: (string | number)[][] = remarkLines.map((r) => [
    r.remark,
    r.totalSales,
  ]);

  const headerRowIndex = 6;
  const productTotalRowIndex = headerRowIndex + 1 + lines.length;
  const remarkHeaderRowIndex = productTotalRowIndex + 2;

  const sheetRows: (string | number)[][] = [
    [title],
    ["Period", summary.period],
    ["No. of Buyers", summary.buyerCount],
    ["No. of Products Sold", summary.productsSoldCount],
    ["Total Sales", summary.totalSales],
    [],
    [...TABLE_HEADERS],
    ...detailRows,
    ["", "", "", "", "Total Sales", summary.totalSales],
    [],
    [...REMARK_TABLE_HEADERS],
    ...remarkDetailRows,
    ["Sub Total", remarkSubTotal],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
  ];

  styleSummarySection(ws, pacsName);
  styleSalesExcelSheet(ws, headerRowIndex, lines.length);
  styleRemarkExcelSheet(ws, remarkHeaderRowIndex, remarkLines.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  XLSX.writeFile(wb, `sales-report-${fileSuffix(filter)}.xlsx`);
}

function drawPdfSummary(
  doc: jsPDF,
  margin: number,
  startY: number,
  pacsName: string,
  summary: ReportSummary,
): number {
  let y = startY;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(summaryHeading(pacsName), margin, y);
  y += 8;

  doc.setFontSize(10);
  const summaryLines: [string, string][] = [
    ["Period", summary.period],
    ["No. of Buyers", String(summary.buyerCount)],
    ["No. of Products Sold", String(summary.productsSoldCount)],
    ["Total Sales", formatInr(summary.totalSales)],
  ];

  for (const [label, value] of summaryLines) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 46, y);
    y += 6;
  }

  doc.setTextColor(0);
  return y + 4;
}

export function downloadSalesReportPdf(allFarmers: Farmer[], filter: SalesDateFilter): void {
  const { lines, remarkLines, summary } = linesForExport(allFarmers, filter);
  const pacsName = APP_SHORT_NAME;
  const remarkSubTotal = remarkSalesSubTotal(remarkLines);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated ${dateStamp()}`, margin, 10);
  doc.setTextColor(0);

  const tableStartY = drawPdfSummary(doc, margin, 16, pacsName, summary);

  autoTable(doc, {
    startY: tableStartY,
    head: [[...TABLE_HEADERS]],
    body: lines.map((r) => [
      r.productName,
      r.category,
      String(r.quantity),
      r.unit,
      r.unitPrice.toFixed(2),
      r.lineTotal.toFixed(2),
    ]),
    foot: [[
      "",
      "",
      "",
      "",
      "Total Sales",
      summary.totalSales.toFixed(2),
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 249, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [229, 231, 235] },
    footStyles: { fillColor: [209, 213, 219], fontStyle: "bold", textColor: [17, 24, 39] },
    margin: { left: margin, right: margin },
  });

  const remarkTableStartY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: remarkTableStartY,
    head: [[...REMARK_TABLE_HEADERS]],
    body: remarkLines.map((r) => [r.remark, r.totalSales.toFixed(2)]),
    foot: [["Sub Total", remarkSubTotal.toFixed(2)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 249, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [229, 231, 235] },
    footStyles: { fillColor: [209, 213, 219], fontStyle: "bold", textColor: [17, 24, 39] },
    margin: { left: margin, right: margin },
    tableWidth: 120,
  });

  doc.save(`sales-report-${fileSuffix(filter)}.pdf`);
}
