import { deleteDoc, deleteField, doc, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import {
  buildCatalogStockMergePatch,
  computePurchaseStockDeltas,
  hasAnyStockDelta,
} from "./catalogPurchaseStock";
import { docToFarmer, farmerToFirestorePayload } from "./firestoreFarmer";
import { getDb } from "./firebase";
import type { Farmer } from "../types/farmer";

/**
 * Saves the farmer and adjusts `settings/catalog` stock by purchase line amounts
 * (create: subtract all sold qty; edit: net change vs previous save).
 */
export async function upsertFarmer(farmer: Farmer): Promise<void> {
  const db = getDb();
  const farmerRef = doc(db, "farmers", farmer.id);
  const catalogRef = doc(db, "settings", "catalog");

  await runTransaction(db, async (transaction) => {
    const farmerSnap = await transaction.get(farmerRef);
    const catalogSnap = await transaction.get(catalogRef);

    const previous: Farmer | null = farmerSnap.exists()
      ? docToFarmer(farmer.id, farmerSnap.data() as Record<string, unknown>)
      : null;

    const deltas = computePurchaseStockDeltas(previous, farmer);

    transaction.set(farmerRef, farmerToFirestorePayload(farmer), { merge: true });

    if (catalogSnap.exists() && hasAnyStockDelta(deltas)) {
      const catalogData = catalogSnap.data() as Record<string, unknown>;
      const patch = buildCatalogStockMergePatch(catalogData, deltas);
      if (Object.keys(patch).length > 0) {
        transaction.set(catalogRef, patch, { merge: true });
      }
    }
  });
}

export async function deleteFarmer(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, "farmers", id));
}

/** Marks a farmer as added to bank docs (dashboard “Send to bank”). */
export async function markFarmerSentToBank(id: string): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, "farmers", id),
    {
      sentToBank: true,
      sentToBankAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** Removes from bank docs list only — farmer record stays; dashboard send is available again. */
export async function removeFarmerFromBankDocs(id: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, "farmers", id), {
    sentToBank: false,
    sentToBankAt: deleteField(),
  });
}

export async function setGoogleSheetLink(link: string | null): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, "settings", "app"),
    { googleSheetLink: link },
    { merge: true },
  );
}
