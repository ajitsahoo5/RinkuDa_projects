import type { RemarkCatalogItem } from "../types/remarkCatalog";

function parseItem(raw: unknown): RemarkCatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const id = String(j.id ?? "").trim();
  const name = String(j.name ?? "").trim();
  if (!id || !name) return null;
  return { id, name };
}

/** Read `settings/catalog.remarkPresets` → sorted list by name. */
export function parseRemarkPresetsFromCatalogDoc(
  data: Record<string, unknown> | undefined,
): RemarkCatalogItem[] {
  const raw = data?.remarkPresets;
  if (!Array.isArray(raw)) return [];
  const list = raw.map(parseItem).filter(Boolean) as RemarkCatalogItem[];
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
