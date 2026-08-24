import { doc, getDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { parseCatalogLinesFromDoc, parseCscProductsCatalogLines } from "./catalogLineFirestore";
import { parseCropsFromCatalogDoc } from "./cropCatalogFirestore";
import { parseFertilizersFromCatalogDoc } from "./fertilizerCatalogFirestore";
import { parseRemarkPresetsFromCatalogDoc } from "./remarkCatalogFirestore";
import { parseVillageMouzasFromCatalogDoc } from "./villageMouzaCatalogFirestore";
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
let loadPromise: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function parseCatalogState(data: Record<string, unknown> | undefined): SettingsCatalogState {
  return {
    fertilizers: parseFertilizersFromCatalogDoc(data),
    pesticides: parseCatalogLinesFromDoc(data, "pesticides"),
    cscProducts: parseCscProductsCatalogLines(data),
    seeds: parseCatalogLinesFromDoc(data, "seeds"),
    crops: parseCropsFromCatalogDoc(data),
    villageMouzas: parseVillageMouzasFromCatalogDoc(data),
    remarkPresets: parseRemarkPresetsFromCatalogDoc(data),
    loading: false,
    error: null,
  };
}

async function loadCatalogFromFirestore(): Promise<void> {
  try {
    const snap = await getDoc(doc(getDb(), "settings", "catalog"));
    const data = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
    state = parseCatalogState(data);
  } catch (e) {
    state = {
      ...initialState,
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  emit();
}

function startLoad() {
  if (!loadPromise) {
    state = { ...state, loading: true, error: null };
    emit();
    loadPromise = loadCatalogFromFirestore().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

/**
 * One-time fetch for `settings/catalog` — no live listener.
 */
export function subscribeSettingsCatalog(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = { ...initialState, loading: true };
    void startLoad();
  }
  listener();
  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0) {
      loadPromise = null;
      state = initialState;
    }
  };
}

export function refreshSettingsCatalog(): Promise<void> {
  if (refCount === 0) return Promise.resolve();
  return startLoad();
}

export function getSettingsCatalogState(): SettingsCatalogState {
  return state;
}
