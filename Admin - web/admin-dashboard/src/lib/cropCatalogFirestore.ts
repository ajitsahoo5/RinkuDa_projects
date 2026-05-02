import type { CropCatalogItem } from "../types/cropCatalog";

function parseItem(raw: unknown): CropCatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const id = String(j.id ?? "").trim();
  const name = String(j.name ?? "").trim();
  if (!id || !name) return null;
  return { id, name };
}

/** Read `settings/catalog` crops array → sorted list by name. */
export function parseCropsFromCatalogDoc(
  data: Record<string, unknown> | undefined,
): CropCatalogItem[] {
  const raw = data?.crops;
  if (!Array.isArray(raw)) return [];
  const list = raw.map(parseItem).filter(Boolean) as CropCatalogItem[];
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
