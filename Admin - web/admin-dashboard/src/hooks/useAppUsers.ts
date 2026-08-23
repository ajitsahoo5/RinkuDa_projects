import { useEffect, useState } from "react";
import { listUsers } from "../lib/api/registry/usersApi";
import { onUsersInvalidate } from "../lib/api/invalidate";
import type { AppUserProfile } from "../types/appUser";

export function useAppUsers() {
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await listUsers();
        if (!cancelled) {
          setUsers(next);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    void load();
    return onUsersInvalidate(() => {
      void load();
    });
  }, []);

  return { users, loading, error };
}
