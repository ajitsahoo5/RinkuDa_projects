import { getCatalog } from "./api/registry/catalogApi";
import { onCatalogInvalidate } from "./api/invalidate";
import type { CropCatalogItem } from "../types/cropCatalog";
import type { CatalogLineItem, FertilizerCatalogItem } from "../types/fertilizerCatalog";
import type { RemarkCatalogItem } from "../types/remarkCatalog";
import type { VillageMouzaCatalogItem } from "../types/villageMouzaCatalog";

export type SettingsCatalogState = {
  fertilizers: FertilizerCatalogItem[];
  pesticides: CatalogLineItem[];
  cscProducts: CatalogLineItem[];
  seeds: CatalogLineItem[];
  crops: CropCatalogItem[];
  villageMouzas: VillageMouzaCatalogItem[];
  remarkPresets: RemarkCatalogItem[];
  loading: boolean;
  error: string | null;
};

const initialState: SettingsCatalogState = {
  fertilizers: [],
  pesticides: [],
  cscProducts: [],
  seeds: [],
  crops: [],
  villageMouzas: [],
  remarkPresets: [],
  loading: true,
  error: null,
};

let state: SettingsCatalogState = initialState;
const listeners = new Set<() => void>();
let refCount = 0;
let invalidateUnsub: (() => void) | undefined;

function emit() {
  for (const l of listeners) l();
}

async function fetchCatalog() {
  state = { ...state, loading: true, error: null };
  emit();
  try {
    const catalog = await getCatalog();
    state = { ...catalog, loading: false, error: null };
  } catch (e) {
    state = {
      fertilizers: [],
      pesticides: [],
      cscProducts: [],
      seeds: [],
      crops: [],
      villageMouzas: [],
      remarkPresets: [],
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  emit();
}

function attachApi() {
  invalidateUnsub = onCatalogInvalidate(() => {
    void fetchCatalog();
  });
  void fetchCatalog();
}

/**
 * Shared catalog state — one REST fetch cycle per app session, refetch after mutations.
 */
export function subscribeSettingsCatalog(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = {
      fertilizers: [],
      pesticides: [],
      cscProducts: [],
      seeds: [],
      crops: [],
      villageMouzas: [],
      remarkPresets: [],
      loading: true,
      error: null,
    };
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

export function getSettingsCatalogState(): SettingsCatalogState {
  return state;
}
