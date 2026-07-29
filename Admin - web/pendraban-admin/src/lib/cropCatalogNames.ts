import type { CropCatalogItem } from "../types/cropCatalog";

/** Deduped crop names sorted for `<select>` options — sourced only from Firestore catalog. */
export function cropDropdownNamesFromCatalog(items: CropCatalogItem[]): string[] {
  return [...new Set(items.map((x) => x.name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
