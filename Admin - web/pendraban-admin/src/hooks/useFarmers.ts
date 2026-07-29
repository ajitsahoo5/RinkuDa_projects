import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { docToFarmer } from "../lib/firestoreFarmer";
import type { Farmer } from "../types/farmer";

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    try {
      const db = getDb();
      const q = query(collection(db, "farmers"), orderBy("slNo"));
      unsub = onSnapshot(
        q,
        (snap) => {
          const list: Farmer[] = snap.docs.map((d) =>
            docToFarmer(d.id, d.data() as Record<string, unknown>),
          );
          setFarmers(list);
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

  return { farmers, loading, error };
}
