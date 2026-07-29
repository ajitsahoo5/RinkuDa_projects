import type { CatalogLineItem } from "../types/fertilizerCatalog";

export function parseCatalogLineItem(raw: unknown): CatalogLineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const id = String(j.id ?? "").trim();
  const name = String(j.name ?? "").trim();
  if (!id || !name) return null;
  const unit = String(j.unit ?? "kg").trim() || "kg";
  const price = Number(j.price ?? 0);
  const stock = Number(j.stock ?? 0);
  return {
    id,
    name,
    unit,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
  };
}

/** Read a named array from `settings/catalog` → sorted list by name. */
export function parseCatalogLinesFromDoc(
  data: Record<string, unknown> | undefined,
  field: string,
): CatalogLineItem[] {
  const raw = data?.[field];
  if (!Array.isArray(raw)) return [];
  const list = raw.map(parseCatalogLineItem).filter(Boolean) as CatalogLineItem[];
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/**
 * CSC Products catalog: reads `cscProducts`; if missing, falls back to legacy `otherPecsItems`.
 */
export function parseCscProductsCatalogLines(
  data: Record<string, unknown> | undefined,
): CatalogLineItem[] {
  if (!data) return [];
  if (Array.isArray(data.cscProducts)) {
    return parseCatalogLinesFromDoc(data, "cscProducts");
  }
  return parseCatalogLinesFromDoc(data, "otherPecsItems");
}
