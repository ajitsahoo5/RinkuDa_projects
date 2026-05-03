import { deleteField } from "firebase/firestore";
import type { Farmer, FertilizerType } from "../types/farmer";
import type { CatalogLineItem } from "../types/fertilizerCatalog";
import { parseCatalogLinesFromDoc, parseCscProductsCatalogLines } from "./catalogLineFirestore";
import { parseFertilizersFromCatalogDoc } from "./fertilizerCatalogFirestore";

/** Sum `amount` per line id (handles duplicate ids if present). */
function sumAmountsById(lines: FertilizerType[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of lines) {
    const id = row.id.trim();
    if (!id) continue;
    const a = Number(row.amount);
    const amt = Number.isFinite(a) && a >= 0 ? a : 0;
    m.set(id, (m.get(id) ?? 0) + amt);
  }
  return m;
}

/** Positive delta = more sold vs previous → subtract more from stock; negative = return to stock. */
function amountDeltaMaps(prev: FertilizerType[], next: FertilizerType[]): Map<string, number> {
  const prevM = sumAmountsById(prev);
  const nextM = sumAmountsById(next);
  const ids = new Set<string>([...prevM.keys(), ...nextM.keys()]);
  const delta = new Map<string, number>();
  for (const id of ids) {
    const d = (nextM.get(id) ?? 0) - (prevM.get(id) ?? 0);
    if (d !== 0) delta.set(id, d);
  }
  return delta;
}

export type CatalogPurchaseStockDeltas = {
  fertilizers: Map<string, number>;
  pesticides: Map<string, number>;
  seeds: Map<string, number>;
  cscProducts: Map<string, number>;
};

export function computePurchaseStockDeltas(previous: Farmer | null, next: Farmer): CatalogPurchaseStockDeltas {
  const p = previous;
  return {
    fertilizers: amountDeltaMaps(p?.fertilizers ?? [], next.fertilizers),
    pesticides: amountDeltaMaps(p?.pesticides ?? [], next.pesticides),
    seeds: amountDeltaMaps(p?.seeds ?? [], next.seeds),
    cscProducts: amountDeltaMaps(p?.cscProducts ?? [], next.cscProducts),
  };
}

export function hasAnyStockDelta(d: CatalogPurchaseStockDeltas): boolean {
  for (const m of [d.fertilizers, d.pesticides, d.seeds, d.cscProducts]) {
    if (m.size > 0) return true;
  }
  return false;
}

function applyDeltaToCatalogLines(items: CatalogLineItem[], deltaById: Map<string, number>): CatalogLineItem[] {
  return items.map((row) => {
    const d = deltaById.get(row.id);
    if (d == null || d === 0) return row;
    const nextStock = row.stock - d;
    return {
      ...row,
      stock: Number.isFinite(nextStock) ? Math.max(0, nextStock) : row.stock,
    };
  });
}

/** Firestore payload for catalog line arrays (matches pecs/fertilizer catalog CRUD). */
export function serializeCatalogStockLines(items: CatalogLineItem[]): Array<{
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
}> {
  return items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
    unit: x.unit.trim() || "kg",
    price: typeof x.price === "number" && Number.isFinite(x.price) ? x.price : 0,
    stock: typeof x.stock === "number" && Number.isFinite(x.stock) && x.stock >= 0 ? x.stock : 0,
  }));
}

/**
 * Builds `settings/catalog` merge fields after applying purchase deltas.
 * Only touches array fields that already exist so we never wipe missing keys with `[]`.
 */
export function buildCatalogStockMergePatch(
  catalogData: Record<string, unknown>,
  deltas: CatalogPurchaseStockDeltas,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (Array.isArray(catalogData.fertilizers)) {
    patch.fertilizers = serializeCatalogStockLines(
      applyDeltaToCatalogLines(parseFertilizersFromCatalogDoc(catalogData), deltas.fertilizers),
    );
  }

  if (Array.isArray(catalogData.pesticides)) {
    patch.pesticides = serializeCatalogStockLines(
      applyDeltaToCatalogLines(parseCatalogLinesFromDoc(catalogData, "pesticides"), deltas.pesticides),
    );
  }

  if (Array.isArray(catalogData.seeds)) {
    patch.seeds = serializeCatalogStockLines(
      applyDeltaToCatalogLines(parseCatalogLinesFromDoc(catalogData, "seeds"), deltas.seeds),
    );
  }

  const hasCsc =
    Array.isArray(catalogData.cscProducts) || Array.isArray(catalogData.otherPecsItems);
  if (hasCsc) {
    patch.cscProducts = serializeCatalogStockLines(
      applyDeltaToCatalogLines(parseCscProductsCatalogLines(catalogData), deltas.cscProducts),
    );
    if (Array.isArray(catalogData.otherPecsItems)) {
      patch.otherPecsItems = deleteField();
    }
  }

  return patch;
}
