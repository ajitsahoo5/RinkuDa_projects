import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

/** Deduped village/mouza names sorted for `<select>` options — catalog only. */
export function villageMouzaDropdownNamesFromCatalog(items: VillageMouzaCatalogItem[]): string[] {
  return [...new Set(items.map((x) => x.name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
