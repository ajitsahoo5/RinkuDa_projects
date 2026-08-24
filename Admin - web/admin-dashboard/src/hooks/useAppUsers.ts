import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { parseUserProfile } from "../lib/appUsersFirestore";
import { getDb } from "../lib/firebase";
import type { AppUserProfile } from "../types/appUser";

export function useAppUsers() {
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const db = getDb();
        const q = query(collection(db, "users"), orderBy("email"));
        const snap = await getDocs(q);
        if (cancelled) return;
        const list: AppUserProfile[] = [];
        for (const d of snap.docs) {
          const p = parseUserProfile(d.id, d.data() as Record<string, unknown>);
          if (p) list.push(p);
        }
        setUsers(list);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { users, loading, error };
}
