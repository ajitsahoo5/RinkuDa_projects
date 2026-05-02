/** Admin-managed catalog synced to Firestore `settings/catalog.fertilizers`. */
export type FertilizerCatalogItem = {
  id: string;
  name: string;
  /** Quantity unit sold or applied (kg, bag, liter, quintal, etc.). */
  unit: string;
  /** Price per single unit above (₹). */
  price: number;
};

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
