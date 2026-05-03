import { parseCatalogLinesFromDoc } from "./catalogLineFirestore";
import type { FertilizerCatalogItem } from "../types/fertilizerCatalog";

/** Read `settings/catalog` fertilizers array → sorted list by name. */
export function parseFertilizersFromCatalogDoc(
  data: Record<string, unknown> | undefined,
): FertilizerCatalogItem[] {
  return parseCatalogLinesFromDoc(data, "fertilizers");
}
