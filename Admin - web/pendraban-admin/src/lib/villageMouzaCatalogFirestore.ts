import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

function parseItem(raw: unknown): VillageMouzaCatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const id = String(j.id ?? "").trim();
  const name = String(j.name ?? "").trim();
  if (!id || !name) return null;
  return { id, name };
}

/** Read `settings/catalog` villageMouzas array → sorted list by name. */
export function parseVillageMouzasFromCatalogDoc(
  data: Record<string, unknown> | undefined,
): VillageMouzaCatalogItem[] {
  const raw = data?.villageMouzas;
  if (!Array.isArray(raw)) return [];
  const list = raw.map(parseItem).filter(Boolean) as VillageMouzaCatalogItem[];
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
