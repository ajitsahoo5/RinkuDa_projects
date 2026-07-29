import { doc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { AppSettings } from "../types/appSettings";

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<void> {
  const db = getDb();
  const payload: Record<string, string | null> = {};
  if ("googleSheetLink" in patch) payload.googleSheetLink = patch.googleSheetLink ?? null;
  if ("address" in patch) payload.address = patch.address ?? null;
  if ("gstNumber" in patch) payload.gstNumber = patch.gstNumber ?? null;
  if ("mobileNumber" in patch) payload.mobileNumber = patch.mobileNumber ?? null;
  await setDoc(doc(db, "settings", "app"), payload, { merge: true });
}
