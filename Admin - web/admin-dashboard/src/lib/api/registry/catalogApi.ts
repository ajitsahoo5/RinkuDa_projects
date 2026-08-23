import type { CropCatalogItem } from "../../../types/cropCatalog";
import type { CatalogLineItem, FertilizerCatalogItem } from "../../../types/fertilizerCatalog";
import type { RemarkCatalogItem } from "../../../types/remarkCatalog";
import type { VillageMouzaCatalogItem } from "../../../types/villageMouzaCatalog";
import { parseCatalogLinesFromDoc, parseCscProductsCatalogLines } from "../../catalogLineFirestore";
import { parseCropsFromCatalogDoc } from "../../cropCatalogFirestore";
import { parseFertilizersFromCatalogDoc } from "../../fertilizerCatalogFirestore";
import { parseRemarkPresetsFromCatalogDoc } from "../../remarkCatalogFirestore";
import { parseVillageMouzasFromCatalogDoc } from "../../villageMouzaCatalogFirestore";
import { apiRequest } from "../client";

export type CatalogSnapshot = {
  fertilizers: FertilizerCatalogItem[];
  pesticides: CatalogLineItem[];
  cscProducts: CatalogLineItem[];
  seeds: CatalogLineItem[];
  crops: CropCatalogItem[];
  villageMouzas: VillageMouzaCatalogItem[];
  remarkPresets: RemarkCatalogItem[];
};

function parseCatalogResponse(data: Record<string, unknown>): CatalogSnapshot {
  return {
    fertilizers: parseFertilizersFromCatalogDoc(data),
    pesticides: parseCatalogLinesFromDoc(data, "pesticides"),
    cscProducts: parseCscProductsCatalogLines(data),
    seeds: parseCatalogLinesFromDoc(data, "seeds"),
    crops: parseCropsFromCatalogDoc(data),
    villageMouzas: parseVillageMouzasFromCatalogDoc(data),
    remarkPresets: parseRemarkPresetsFromCatalogDoc(data),
  };
}

export async function getCatalog(): Promise<CatalogSnapshot> {
  const data = await apiRequest<Record<string, unknown>>("/registry/catalog");
  return parseCatalogResponse(data);
}

export async function patchCatalog(
  patch: Partial<Record<keyof CatalogSnapshot, unknown>>,
): Promise<CatalogSnapshot> {
  const data = await apiRequest<Record<string, unknown>>("/registry/catalog", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseCatalogResponse(data);
}
