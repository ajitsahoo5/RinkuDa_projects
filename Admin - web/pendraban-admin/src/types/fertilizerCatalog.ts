/** Admin-managed catalog synced to Firestore `settings/catalog.fertilizers`. */
export type FertilizerCatalogItem = {
  id: string;
  name: string;
  /** Quantity unit sold or applied (kg, bag, liter, quintal, etc.). */
  unit: string;
  /** Price per single unit above (₹). */
  price: number;
  /** Inventory / quantity on hand for this SKU (same unit as above). */
  stock: number;
};

/** Same row shape for fertilizer, pesticide, CSC Products, and seed line-item catalogs. */
export type CatalogLineItem = FertilizerCatalogItem;

/** Presets for unit dropdown — custom strings are allowed via “Other”. */
export const FERTILIZER_UNIT_PRESETS = [
  "kg",
  "bag",
  "liter",
  "quintal",
  "packet",
  "tonne",
  "piece",
  "gram",
  "dose",
  "spray drum",
  "bundle",
  "other",
] as const;
