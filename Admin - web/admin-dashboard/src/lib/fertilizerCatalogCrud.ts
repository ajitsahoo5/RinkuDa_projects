import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { FertilizerCatalogItem } from "../types/fertilizerCatalog";

/** Overwrites merged `fertilizers` array under `settings/catalog`. */
export async function saveFertilizerCatalog(items: FertilizerCatalogItem[]): Promise<void> {
  const db = getDb();
  const payload = items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
    unit: x.unit.trim() || "kg",
    price: typeof x.price === "number" && Number.isFinite(x.price) ? x.price : 0,
  }));
  await setDoc(
    doc(db, "settings", "catalog"),
    { fertilizers: payload },
    { merge: true },
  );
}
