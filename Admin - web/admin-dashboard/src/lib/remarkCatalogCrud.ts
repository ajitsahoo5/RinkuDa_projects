import { patchCatalog } from "./api/registry/catalogApi";
import { invalidateCatalog } from "./api/invalidate";
import type { RemarkCatalogItem } from "../types/remarkCatalog";

export async function saveRemarkCatalog(items: RemarkCatalogItem[]): Promise<void> {
  await patchCatalog({
    remarkPresets: items.map((x) => ({
      id: x.id,
      name: x.name.trim(),
    })),
  });
  invalidateCatalog();
}
