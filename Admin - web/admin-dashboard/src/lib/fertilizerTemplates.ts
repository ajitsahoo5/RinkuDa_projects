import { getDefaultFertilizers } from "./defaultFertilizers";
import type { CatalogLineItem, FertilizerCatalogItem } from "../types/fertilizerCatalog";
import type { FertilizerType } from "../types/farmer";

/** Convert catalog docs to fertilizer lines (amount zero) for farmer forms. */
export function catalogItemsToFarmerTemplates(
  items: CatalogLineItem[] | FertilizerCatalogItem[],
): FertilizerType[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    amount: 0,
    price: c.price,
    unit: c.unit,
  }));
}

/** When catalog is empty, keep legacy default list so existing flows still work. */
export function fertilizerTemplatesFallback(): FertilizerType[] {
  return getDefaultFertilizers().map((f) => ({ ...f, unit: "kg" }));
}

export function resolveFarmerTemplates(
  catalogItems: FertilizerCatalogItem[],
): FertilizerType[] {
  return catalogItems.length > 0
    ? catalogItemsToFarmerTemplates(catalogItems)
    : fertilizerTemplatesFallback();
}

/** Pesticides, seeds, CSC Products — no legacy fallback when the catalog is empty. */
export function resolveCatalogLineTemplates(items: CatalogLineItem[]): FertilizerType[] {
  return items.length > 0 ? catalogItemsToFarmerTemplates(items) : [];
}
