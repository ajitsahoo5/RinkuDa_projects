import type { Farmer } from "../types/farmer";

/** Normalise Firestore / ISO purchase dates to `YYYY-MM-DD` (local calendar). */
export function normalizePurchaseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type SalesDateMode = "single" | "range";

export type SalesDateFilter =
  | { mode: "single"; date: string }
  | { mode: "range"; from: string; to: string };

export function salesFilterLabel(filter: SalesDateFilter): string {
  if (filter.mode === "single") return filter.date;
  return `${filter.from} to ${filter.to}`;
}

export function filterFarmersByPurchaseDate(
  farmers: Farmer[],
  filter: SalesDateFilter,
): Farmer[] {
  if (filter.mode === "single") {
    const target = filter.date.trim();
    if (!target) return [];
    return farmers.filter((f) => normalizePurchaseDate(f.dateOfPurchase) === target);
  }

  const from = filter.from.trim();
  const to = filter.to.trim();
  if (!from || !to) return [];
  if (from > to) return [];

  return farmers.filter((f) => {
    const key = normalizePurchaseDate(f.dateOfPurchase);
    if (!key) return false;
    return key >= from && key <= to;
  });
}

export type BankDocsDateFilter =
  | { mode: "all" }
  | SalesDateFilter;

export function bankDocsFilterLabel(filter: BankDocsDateFilter): string {
  if (filter.mode === "all") return "All dates";
  return salesFilterLabel(filter);
}

/** Filter bank-doc rows by calendar date they were sent (sentToBankAt). */
export function filterFarmersBySentToBankDate(
  farmers: Farmer[],
  filter: BankDocsDateFilter,
): Farmer[] {
  if (filter.mode === "all") return farmers;

  if (filter.mode === "single") {
    const target = filter.date.trim();
    if (!target) return [];
    return farmers.filter(
      (f) => normalizePurchaseDate(f.sentToBankAt ?? "") === target,
    );
  }

  const from = filter.from.trim();
  const to = filter.to.trim();
  if (!from || !to) return [];
  if (from > to) return [];

  return farmers.filter((f) => {
    const key = normalizePurchaseDate(f.sentToBankAt ?? "");
    if (!key) return false;
    return key >= from && key <= to;
  });
}
