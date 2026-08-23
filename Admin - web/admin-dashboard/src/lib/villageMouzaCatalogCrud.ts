import { patchCatalog } from "./api/registry/catalogApi";
import { invalidateCatalog } from "./api/invalidate";
import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

export async function saveVillageMouzaCatalog(items: VillageMouzaCatalogItem[]): Promise<void> {
  await patchCatalog({
    villageMouzas: items.map((x) => ({
      id: x.id,
      name: x.name.trim(),
    })),
  });
  invalidateCatalog();
}
