import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { UserRole } from "../types/appUser";

/** Admin edits another user profile (Firestore). Auth email changes are out of scope. */
export async function adminUpdateFirestoreUser(
  uid: string,
  patch: { displayName?: string | null; role?: UserRole; active?: boolean },
): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
