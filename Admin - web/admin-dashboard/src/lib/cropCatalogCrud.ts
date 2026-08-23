import { patchCatalog } from "./api/registry/catalogApi";
import { invalidateCatalog } from "./api/invalidate";
import type { CropCatalogItem } from "../types/cropCatalog";

export async function saveCropCatalog(items: CropCatalogItem[]): Promise<void> {
  await patchCatalog({
    crops: items.map((x) => ({
      id: x.id,
      name: x.name.trim(),
    })),
  });
  invalidateCatalog();
}
