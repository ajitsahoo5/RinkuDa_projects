import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { CatalogLineItem } from "../types/fertilizerCatalog";

function payloadFrom(items: CatalogLineItem[]) {
  return items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
    unit: x.unit.trim() || "kg",
    price: typeof x.price === "number" && Number.isFinite(x.price) ? x.price : 0,
  }));
}

/** Overwrites `pesticides` array under `settings/catalog` (merge). */
export async function savePesticideCatalog(items: CatalogLineItem[]): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, "settings", "catalog"), { pesticides: payloadFrom(items) }, { merge: true });
}

/** Overwrites `otherPecsItems` array under `settings/catalog` (merge). */
export async function saveOtherPecsCatalog(items: CatalogLineItem[]): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, "settings", "catalog"),
    { otherPecsItems: payloadFrom(items) },
    { merge: true },
  );
}

/** Overwrites `seeds` array under `settings/catalog` (merge). */
export async function saveSeedsCatalog(items: CatalogLineItem[]): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, "settings", "catalog"), { seeds: payloadFrom(items) }, { merge: true });
}
