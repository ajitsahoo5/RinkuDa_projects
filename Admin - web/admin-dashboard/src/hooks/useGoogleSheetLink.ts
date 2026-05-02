import { useEffect, useState } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getDb } from "../lib/firebase";

export function useGoogleSheetLink() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    try {
      const db = getDb();
      const ref = doc(db, "settings", "app");
      unsub = onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as Record<string, unknown> | undefined;
          const v = data?.googleSheetLink;
          if (v == null) setLink(null);
          else setLink(String(v));
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

  return { link, loading, error };
}
