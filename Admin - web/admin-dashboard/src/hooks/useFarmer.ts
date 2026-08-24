import { useEffect, useState } from "react";
import { fetchFarmerById } from "../lib/farmersSubscription";
import type { Farmer } from "../types/farmer";

export function useFarmer(id: string | undefined) {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setFarmer(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFarmerById(id)
      .then((f) => {
        if (cancelled) return;
        setFarmer(f);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { farmer, loading, error };
}
