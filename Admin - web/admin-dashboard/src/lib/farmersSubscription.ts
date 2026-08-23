import { listFarmers } from "./api/registry/farmersApi";
import { onFarmersInvalidate } from "./api/invalidate";
import type { Farmer } from "../types/farmer";

export type FarmersState = {
  farmers: Farmer[];
  loading: boolean;
  error: string | null;
};

const initialState: FarmersState = {
  farmers: [],
  loading: true,
  error: null,
};

let state: FarmersState = initialState;
const listeners = new Set<() => void>();
let refCount = 0;
let invalidateUnsub: (() => void) | undefined;

function emit() {
  for (const l of listeners) l();
}

async function fetchFarmers() {
  state = { ...state, loading: true, error: null };
  emit();
  try {
    const farmers = await listFarmers();
    state = { farmers, loading: false, error: null };
  } catch (e) {
    state = {
      farmers: [],
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  emit();
}

function attachApi() {
  invalidateUnsub = onFarmersInvalidate(() => {
    void fetchFarmers();
  });
  void fetchFarmers();
}

/**
 * Shared farmers list — one REST fetch cycle per app session, refetch after mutations.
 */
export function subscribeFarmers(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = { farmers: [], loading: true, error: null };
    attachApi();
  }
  listener();
  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0) {
      invalidateUnsub?.();
      invalidateUnsub = undefined;
      state = initialState;
    }
  };
}

export function getFarmersState(): FarmersState {
  return state;
}
