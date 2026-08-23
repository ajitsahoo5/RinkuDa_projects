import { useEffect, useState } from "react";
import { getAppSettings } from "../lib/api/registry/settingsApi";
import { onSettingsInvalidate } from "../lib/api/invalidate";
import { emptyAppSettings, type AppSettings } from "../types/appSettings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(emptyAppSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await getAppSettings();
        if (!cancelled) {
          setSettings(next);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setSettings(emptyAppSettings());
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    void load();
    return onSettingsInvalidate(() => {
      void load();
    });
  }, []);

  return { settings, loading, error };
}

/** @deprecated Use `useAppSettings` — kept for any legacy imports. */
export function useGoogleSheetLink() {
  const { settings, loading, error } = useAppSettings();
  return { link: settings.googleSheetLink, loading, error };
}
