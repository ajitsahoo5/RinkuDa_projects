import { useEffect, useState } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { parseFertilizersFromCatalogDoc } from "../lib/fertilizerCatalogFirestore";
import type { FertilizerCatalogItem } from "../types/fertilizerCatalog";

export function useFertilizerCatalog() {
  const [items, setItems] = useState<FertilizerCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    try {
      const db = getDb();
      const ref = doc(db, "settings", "catalog");
      unsub = onSnapshot(
        ref,
        (snap) => {
          const data = snap.exists()
            ? (snap.data() as Record<string, unknown>)
            : undefined;
          setItems(parseFertilizersFromCatalogDoc(data));
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

  return { items, loading, error };
}
