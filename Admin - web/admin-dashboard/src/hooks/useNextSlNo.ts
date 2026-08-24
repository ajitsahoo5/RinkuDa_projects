import { useEffect, useState } from "react";
import { fetchNextSlNo } from "../lib/farmersSubscription";

export function useNextSlNo() {
  const [nextSlNo, setNextSlNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNextSlNo()
      .then((n) => {
        if (cancelled) return;
        setNextSlNo(n);
        setError(null);
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
  }, []);

  return { nextSlNo, loading, error };
}
