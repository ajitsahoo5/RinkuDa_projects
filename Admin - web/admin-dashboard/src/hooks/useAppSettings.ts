import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { emptyAppSettings, parseAppSettings, type AppSettings } from "../types/appSettings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(emptyAppSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const snap = await getDoc(doc(getDb(), "settings", "app"));
        if (cancelled) return;
        setSettings(parseAppSettings(snap.data() as Record<string, unknown> | undefined));
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

  return { settings, loading, error };
}

/** @deprecated Use `useAppSettings` — kept for any legacy imports. */
export function useGoogleSheetLink() {
  const { settings, loading, error } = useAppSettings();
  return { link: settings.googleSheetLink, loading, error };
}
