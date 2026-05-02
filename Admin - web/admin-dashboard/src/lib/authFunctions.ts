import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import { getFirebaseApp } from "./firebase";

function functionsInstance(): Functions {
  const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || "us-central1";
  return getFunctions(getFirebaseApp(), region);
}

export async function callableAdminCreateUser(payload: {
  email: string;
  password: string;
  displayName?: string | null;
  role: "admin" | "client";
}): Promise<{ uid: string }> {
  const fn = httpsCallable(functionsInstance(), "adminCreateUser");
  const res = await fn(payload);
  return res.data as { uid: string };
}

export async function callableAdminDeleteUser(payload: {
  uid: string;
}): Promise<{ ok: true }> {
  const fn = httpsCallable(functionsInstance(), "adminDeleteUser");
  const res = await fn(payload);
  return res.data as { ok: true };
}
