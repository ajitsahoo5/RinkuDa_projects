import type { Timestamp } from "firebase/firestore";
import type { AppUserProfile, UserRole } from "../types/appUser";

export function parseUserProfile(uid: string, data: Record<string, unknown>): AppUserProfile | null {
  const email = String(data.email ?? "").trim();
  const roleRaw = String(data.role ?? "").toLowerCase();
  const role: UserRole = roleRaw === "admin" ? "admin" : "client";
  if (!email) return null;
  return {
    uid,
    email,
    displayName: data.displayName != null ? String(data.displayName).trim() || null : null,
    role,
    active: data.active !== false,
  };
}

/** Firestore field types for admins creating/updating docs (omit server timestamps here). */
export type UserDocPayload = {
  email: string;
  displayName: string | null;
  role: UserRole;
  active: boolean;
  createdAt?: Timestamp;
};
