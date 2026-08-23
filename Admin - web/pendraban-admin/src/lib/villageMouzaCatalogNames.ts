import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";
import type { Farmer } from "../types/farmer";

/** Deduped village/mouza names sorted for `<select>` options. */
export function villageMouzaDropdownNamesFromCatalog(items: VillageMouzaCatalogItem[]): string[] {
  return [...new Set(items.map((x) => x.name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/** Catalog names plus any villages already used on farmer records. */
export function mergeVillageMouzaOptions(
  catalogItems: VillageMouzaCatalogItem[],
  farmers: Farmer[],
): string[] {
  const names = new Set<string>();
  for (const item of catalogItems) {
    const name = item.name.trim();
    if (name) names.add(name);
  }
  for (const farmer of farmers) {
    const name = farmer.villageOrMouza.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
