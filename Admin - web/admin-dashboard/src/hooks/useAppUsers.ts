import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { parseUserProfile } from "../lib/appUsersFirestore";
import { getDb } from "../lib/firebase";
import type { AppUserProfile } from "../types/appUser";

export function useAppUsers() {
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    try {
      const db = getDb();
      const q = query(collection(db, "users"), orderBy("email"));
      unsub = onSnapshot(
        q,
        (snap) => {
          const list: AppUserProfile[] = [];
          for (const d of snap.docs) {
            const p = parseUserProfile(d.id, d.data() as Record<string, unknown>);
            if (p) list.push(p);
          }
          setUsers(list);
          setError(null);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  return { users, loading, error };
}
