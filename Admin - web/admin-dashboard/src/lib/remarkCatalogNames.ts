import type { RemarkCatalogItem } from "../types/remarkCatalog";

/** Deduped preset labels sorted for `<select>` — from Firestore remark catalog only. */
export function remarkPresetNamesFromCatalog(items: RemarkCatalogItem[]): string[] {
  return [...new Set(items.map((x) => x.name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
