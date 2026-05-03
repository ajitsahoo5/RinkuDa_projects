import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Farmer, FertilizerType } from "../types/farmer";
import { totalPrice } from "../types/farmer";

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dash(s: string): string {
  const t = s.trim();
  return t ? t : "—";
}

function formatProductLines(items: FertilizerType[]): string {
  if (!items.length) return "—";
  return items
    .map((l) => {
      const u = (l.unit ?? "").trim() || "kg";
      const lineTotal = l.amount * l.price;
      return `${l.name}: ${l.amount} ${u} × ₹${l.price} = ₹${lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    })
    .join("\n");
}

function kvRows(f: Farmer): [string, string][] {
  return [
    ["Serial no.", String(f.slNo)],
    ["Date of purchase", dash(f.dateOfPurchase)],
    ["Farmer name", f.farmerName],
    ["Land owner name", dash(f.landOwnerName)],
    ["Village / mouza", dash(f.villageOrMouza)],
    ["Khata no.", dash(f.khataNo)],
    ["Area (acre)", String(f.area)],
    ["Aadhaar no.", dash(f.aadharNo)],
    ["Mobile no.", dash(f.mobileNo)],
    ["Crops", dash(f.cropsName)],
    ["Address", dash(f.address)],
    ["Payment remark", dash(f.paymentRemark)],
    ["Fertilizers", formatProductLines(f.fertilizers)],
    ["Pesticides", formatProductLines(f.pesticides)],
    ["Seeds", formatProductLines(f.seeds)],
    ["CSC products", formatProductLines(f.cscProducts)],
    ["Remarks", dash(f.remarks)],
    ["Total inputs (₹)", totalPrice(f).toLocaleString("en-IN", { maximumFractionDigits: 2 })],
  ];
}

/** Full-detail PDF: one section per farmer (key/value + line-item inputs). */
export function downloadFarmersListPdf(farmers: Farmer[], title = "Farmer registry — full details"): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Generated ${dateStamp()} · ${farmers.length} record(s)`, margin, y);
  doc.setTextColor(0);
  y += 10;

  farmers.forEach((f, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`SL ${f.slNo} — ${f.farmerName}`, margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: kvRows(f),
      styles: { fontSize: 8.5, cellPadding: 2, valign: "top", overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold", fillColor: [241, 245, 249] },
        1: { cellWidth: pageW - margin * 2 - 42 },
      },
      headStyles: { fillColor: [41, 98, 165], textColor: 255, fontStyle: "bold" },
      margin: { left: margin, right: margin },
      tableWidth: pageW - margin * 2,
    });

    y = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y;
  });

  doc.save(`farmers-registry-full-${dateStamp()}.pdf`);
}

function farmerRecordHtml(f: Farmer): string {
  const kv = kvRows(f)
    .map(
      ([k, v]) =>
        `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v).replaceAll("\n", "<br/>")}</td></tr>`,
    )
    .join("");
  return `<section class="record">
<h3>${escapeHtml(`SL ${f.slNo} — ${f.farmerName}`)}</h3>
<table class="kv"><tbody>${kv}</tbody></table>
</section>`;
}

/**
 * Word-compatible document — full farmer fields plus line-item tables for inputs.
 */
export function downloadFarmersListWord(farmers: Farmer[], title = "Farmer registry — full details"): void {
  const records = farmers.map(farmerRecordHtml).join('<hr style="margin:24px 0"/>');
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
 body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
 h2 { font-size: 16pt; }
 h3 { font-size: 13pt; margin: 16px 0 8px; }
 table.kv { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
 table.kv th, table.kv td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; text-align: left; }
 table.kv th { width: 28%; background: #e8eef4; font-weight: bold; }
 section.record { page-break-after: always; }
 section.record:last-child { page-break-after: auto; }
</style></head><body>
<h2>${escapeHtml(title)}</h2>
<p>Generated ${escapeHtml(dateStamp())} — ${farmers.length} record(s)</p>
${records}
</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `farmers-registry-full-${dateStamp()}.doc`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EXCEL_HEADERS = [
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
  "Fertilizers",
  "Pesticides",
  "Seeds",
  "CSC products",
  "Remarks",
  "Total inputs (₹)",
] as const;

/** One row per farmer; same full-detail columns as PDF/Word (.xlsx for Excel / Sheets). */
export function downloadFarmersListExcel(farmers: Farmer[]): void {
  const rows: (string | number)[][] = farmers.map((f) => [
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
    formatProductLines(f.fertilizers),
    formatProductLines(f.pesticides),
    formatProductLines(f.seeds),
    formatProductLines(f.cscProducts),
    dash(f.remarks),
    totalPrice(f),
  ]);
  const aoa: (string | number)[][] = [[...EXCEL_HEADERS], ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 11 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 36 },
    { wch: 16 },
    { wch: 44 },
    { wch: 44 },
    { wch: 44 },
    { wch: 44 },
    { wch: 22 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Farmers");
  XLSX.writeFile(wb, `farmers-registry-full-${dateStamp()}.xlsx`);
}
