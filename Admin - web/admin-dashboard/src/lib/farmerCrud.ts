import {
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { farmerToFirestorePayload } from "./firestoreFarmer";
import type { Farmer } from "../types/farmer";

export async function upsertFarmer(farmer: Farmer): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, "farmers", farmer.id), farmerToFirestorePayload(farmer), {
    merge: true,
  });
}

export async function deleteFarmer(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, "farmers", id));
}

export async function setGoogleSheetLink(link: string | null): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, "settings", "app"),
    { googleSheetLink: link },
    { merge: true },
  );
}
