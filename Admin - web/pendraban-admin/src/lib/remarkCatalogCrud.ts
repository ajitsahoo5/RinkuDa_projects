import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { RemarkCatalogItem } from "../types/remarkCatalog";

/** Writes `remarkPresets` array under `settings/catalog` (merge). */
export async function saveRemarkCatalog(items: RemarkCatalogItem[]): Promise<void> {
  const db = getDb();
  const payload = items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
  }));
  await setDoc(doc(db, "settings", "catalog"), { remarkPresets: payload }, { merge: true });
}
