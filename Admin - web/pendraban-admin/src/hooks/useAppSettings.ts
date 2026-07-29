import { useEffect, useState } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { emptyAppSettings, parseAppSettings, type AppSettings } from "../types/appSettings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(emptyAppSettings);
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
          setSettings(parseAppSettings(snap.data() as Record<string, unknown> | undefined));
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

  return { settings, loading, error };
}

/** @deprecated Use `useAppSettings` — kept for any legacy imports. */
export function useGoogleSheetLink() {
  const { settings, loading, error } = useAppSettings();
  return { link: settings.googleSheetLink, loading, error };
}
