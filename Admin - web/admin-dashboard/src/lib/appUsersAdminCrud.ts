import { invalidateUsers } from "./api/invalidate";
import { updateUser } from "./api/registry/usersApi";
import type { UserRole } from "../types/appUser";

export async function adminUpdateRegistryUser(
  uid: string,
  patch: { displayName?: string | null; role?: UserRole; active?: boolean },
): Promise<void> {
  await updateUser(uid, patch);
  invalidateUsers();
}
