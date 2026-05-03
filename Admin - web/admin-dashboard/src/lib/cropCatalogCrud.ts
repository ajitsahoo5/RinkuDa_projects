import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { CropCatalogItem } from "../types/cropCatalog";

/** Writes `crops` array under `settings/catalog` (merge — keeps fertilizers, pesticides, other PECS items, seeds). */
export async function saveCropCatalog(items: CropCatalogItem[]): Promise<void> {
  const db = getDb();
  const payload = items.map((x) => ({
    id: x.id,
    name: x.name.trim(),
  }));
  await setDoc(
    doc(db, "settings", "catalog"),
    { crops: payload },
    { merge: true },
  );
}
