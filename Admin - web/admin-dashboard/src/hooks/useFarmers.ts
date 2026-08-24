import { useEffect, useReducer } from "react";
import { getFarmersState, refreshFarmers, subscribeFarmers } from "../lib/farmersSubscription";

export function useFarmers() {
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeFarmers(() => force()), []);

  return { ...getFarmersState(), refresh: refreshFarmers };
}
