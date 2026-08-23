import XLSX from "xlsx-js-style";
import type { Farmer } from "../types/farmer";
import { totalPrice } from "../types/farmer";
import { APP_SHORT_NAME } from "./branding";
import { formatPurchaseDate, formatReportDateTime } from "./formatReportDate";
import { bankDocsFilterLabel, type BankDocsDateFilter } from "./salesReportDates";

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
};

const TABLE_HEADERS = [
  "SL",
  "Farmer",
  "Aadhaar",
  "Mobile",
  "Village",
  "Khata",
  "Purchase date",
  "Amount ₹",
  "Remarks",
  "Sent on",
] as const;

const COL_COUNT = TABLE_HEADERS.length;

const TITLE_STYLE: CellStyle = {
  font: { bold: true, sz: 14, color: { rgb: "111827" } },
};

const SUMMARY_LABEL_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: "374151" } },
  fill: { fgColor: { rgb: "F3F4F6" } },
  border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } },
};

const SUMMARY_VALUE_STYLE: CellStyle = {
  font: { color: { rgb: "111827" } },
  fill: { fgColor: { rgb: "F9FAFB" } },
  border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } },
};

const HEADER_STYLE: CellStyle = {
  fill: { fgColor: { rgb: "111827" } },
  font: { bold: true, color: { rgb: "F9FAFB" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: { bottom: { style: "medium", color: { rgb: "000000" } } },
};

const TOTAL_STYLE: CellStyle = {
  fill: { fgColor: { rgb: "D1D5DB" } },
  font: { bold: true, color: { rgb: "111827" } },
  border: { top: { style: "medium", color: { rgb: "374151" } } },
};

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
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
    border: { bottom: { style: "thin", color: { rgb: "CBD5E1" } } },
  };
}

function fileSuffix(filter: BankDocsDateFilter): string {
  if (filter.mode === "all") return "all-dates";
  if (filter.mode === "single") return filter.date;
  return `${filter.from}_to_${filter.to}`;
}

export function downloadBankDocsExcel(
  farmers: Farmer[],
  filter: BankDocsDateFilter,
): void {
  if (farmers.length === 0) {
    throw new Error("No bank docs records to export for the selected filter.");
  }

  const pacsName = APP_SHORT_NAME;
  const title = `${pacsName} Bank Docs`;
  const period = bankDocsFilterLabel(filter);
  const subTotal = farmers.reduce((s, f) => s + totalPrice(f), 0);

  const detailRows: (string | number)[][] = farmers.map((f) => [
    f.slNo,
    f.farmerName,
    f.aadharNo || "",
    f.mobileNo || "",
    f.villageOrMouza || "",
    f.khataNo || "",
    formatPurchaseDate(f.dateOfPurchase),
    totalPrice(f),
    f.remarks || "",
    formatReportDateTime(f.sentToBankAt),
  ]);

  const headerRowIndex = 4;
  const sheetRows: (string | number)[][] = [
    [title],
    ["Period", period],
    ["Records", farmers.length],
    [],
    [...TABLE_HEADERS],
    ...detailRows,
    ["", "", "", "", "", "", "", "Sub Total", subTotal, ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 24 },
    { wch: 22 },
  ];

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } }];
  setCellStyle(ws, 0, 0, TITLE_STYLE);
  for (let row = 1; row <= 2; row++) {
    setCellStyle(ws, row, 0, SUMMARY_LABEL_STYLE);
    setCellStyle(ws, row, 1, SUMMARY_VALUE_STYLE);
  }

  for (let c = 0; c < COL_COUNT; c++) {
    setCellStyle(ws, headerRowIndex, c, HEADER_STYLE);
  }
  for (let r = 0; r < farmers.length; r++) {
    const row = headerRowIndex + 1 + r;
    const style = bodyRowStyle(r);
    for (let c = 0; c < COL_COUNT; c++) {
      setCellStyle(ws, row, c, style);
    }
  }
  const totalRow = headerRowIndex + 1 + farmers.length;
  for (let c = 0; c < COL_COUNT; c++) {
    setCellStyle(ws, totalRow, c, TOTAL_STYLE);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bank Docs");
  XLSX.writeFile(wb, `bank-docs-${fileSuffix(filter)}-${dateStamp()}.xlsx`);
}
