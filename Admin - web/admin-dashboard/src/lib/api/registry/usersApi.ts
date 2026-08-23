import { parseUserProfile } from "../../appUsersFirestore";
import type { AppUserProfile, UserRole } from "../../../types/appUser";
import { apiRequest } from "../client";

type ApiRegistryUser = {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  active: boolean;
};

function toProfile(row: ApiRegistryUser): AppUserProfile {
  return parseUserProfile(row.uid, row) as AppUserProfile;
}

export async function getMe(): Promise<AppUserProfile> {
  const row = await apiRequest<ApiRegistryUser>("/registry/users/me");
  const profile = toProfile(row);
  if (!profile) throw new Error("Invalid user profile from API.");
  return profile;
}

export async function listUsers(): Promise<AppUserProfile[]> {
  const rows = await apiRequest<ApiRegistryUser[]>("/registry/users");
  return rows
    .map((row) => toProfile(row))
    .filter((p): p is AppUserProfile => p != null)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function createUser(payload: {
  email: string;
  firebaseUid: string;
  displayName?: string | null;
  role?: UserRole;
}): Promise<AppUserProfile> {
  const row = await apiRequest<ApiRegistryUser>("/registry/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const profile = toProfile(row);
  if (!profile) throw new Error("Invalid user profile from API.");
  return profile;
}

export async function updateUser(
  uid: string,
  patch: { displayName?: string | null; role?: UserRole; active?: boolean },
): Promise<AppUserProfile> {
  const row = await apiRequest<ApiRegistryUser>(`/registry/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const profile = toProfile(row);
  if (!profile) throw new Error("Invalid user profile from API.");
  return profile;
}

export async function deleteUser(uid: string): Promise<void> {
  await apiRequest<void>(`/registry/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
}
