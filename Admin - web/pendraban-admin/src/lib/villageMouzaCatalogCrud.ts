import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

/** Writes `villageMouzas` array under `settings/catalog` (merge). */
export async function saveVillageMouzaCatalog(items: VillageMouzaCatalogItem[]): Promise<void> {
  const db = getDb();
  const payload = items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
  }));
  await setDoc(
    doc(db, "settings", "catalog"),
    { villageMouzas: payload },
    { merge: true },
  );
}
