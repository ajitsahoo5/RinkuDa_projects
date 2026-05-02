import type { FertilizerCatalogItem } from "../types/fertilizerCatalog";

function parseItem(raw: unknown): FertilizerCatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const id = String(j.id ?? "").trim();
  const name = String(j.name ?? "").trim();
  if (!id || !name) return null;
  const unit = String(j.unit ?? "kg").trim() || "kg";
  const price = Number(j.price ?? 0);
  return {
    id,
    name,
    unit,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
  };
}

/** Read `settings/catalog` fertilizers array → sorted list by name. */
export function parseFertilizersFromCatalogDoc(
  data: Record<string, unknown> | undefined,
): FertilizerCatalogItem[] {
  const raw = data?.fertilizers;
  if (!Array.isArray(raw)) return [];
  const list = raw.map(parseItem).filter(Boolean) as FertilizerCatalogItem[];
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
