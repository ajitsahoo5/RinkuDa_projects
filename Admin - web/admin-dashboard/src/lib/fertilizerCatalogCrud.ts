import { patchCatalog } from "./api/registry/catalogApi";
import { invalidateCatalog } from "./api/invalidate";
import type { FertilizerCatalogItem } from "../types/fertilizerCatalog";

function payloadFrom(items: FertilizerCatalogItem[]) {
  return items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
    unit: x.unit.trim() || "kg",
    price: typeof x.price === "number" && Number.isFinite(x.price) ? x.price : 0,
    stock: typeof x.stock === "number" && Number.isFinite(x.stock) && x.stock >= 0 ? x.stock : 0,
  }));
}

export async function saveFertilizerCatalog(items: FertilizerCatalogItem[]): Promise<void> {
  await patchCatalog({ fertilizers: payloadFrom(items) });
  invalidateCatalog();
}
