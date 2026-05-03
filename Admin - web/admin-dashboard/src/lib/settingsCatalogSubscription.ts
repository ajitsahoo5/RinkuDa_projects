import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getDb } from "./firebase";
import { parseCatalogLinesFromDoc } from "./catalogLineFirestore";
import { parseCropsFromCatalogDoc } from "./cropCatalogFirestore";
import { parseFertilizersFromCatalogDoc } from "./fertilizerCatalogFirestore";
import type { CropCatalogItem } from "../types/cropCatalog";
import type { CatalogLineItem, FertilizerCatalogItem } from "../types/fertilizerCatalog";

export type SettingsCatalogState = {
  fertilizers: FertilizerCatalogItem[];
  pesticides: CatalogLineItem[];
  otherPecsItems: CatalogLineItem[];
  seeds: CatalogLineItem[];
  crops: CropCatalogItem[];
  loading: boolean;
  error: string | null;
};

const initialState: SettingsCatalogState = {
  fertilizers: [],
  pesticides: [],
  otherPecsItems: [],
  seeds: [],
  crops: [],
  loading: true,
  error: null,
};

let state: SettingsCatalogState = initialState;
const listeners = new Set<() => void>();
let refCount = 0;
let firestoreUnsub: Unsubscribe | undefined;

function emit() {
  for (const l of listeners) l();
}

function attachFirestore() {
  try {
    const db = getDb();
    firestoreUnsub = onSnapshot(
      doc(db, "settings", "catalog"),
      (snap) => {
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
        state = {
          fertilizers: parseFertilizersFromCatalogDoc(data),
          pesticides: parseCatalogLinesFromDoc(data, "pesticides"),
          otherPecsItems: parseCatalogLinesFromDoc(data, "otherPecsItems"),
          seeds: parseCatalogLinesFromDoc(data, "seeds"),
          crops: parseCropsFromCatalogDoc(data),
          loading: false,
          error: null,
        };
        emit();
      },
      (e) => {
        state = {
          fertilizers: [],
          pesticides: [],
          otherPecsItems: [],
          seeds: [],
          crops: [],
          loading: false,
          error: e.message,
        };
        emit();
      },
    );
  } catch (e) {
    state = {
      fertilizers: [],
      pesticides: [],
      otherPecsItems: [],
      seeds: [],
      crops: [],
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
    emit();
  }
}

/**
 * Shared listener for `settings/catalog` — one Firestore subscription per app session no matter how many hooks mount.
 */
export function subscribeSettingsCatalog(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = {
      fertilizers: [],
      pesticides: [],
      otherPecsItems: [],
      seeds: [],
      crops: [],
      loading: true,
      error: null,
    };
    attachFirestore();
  }
  listener();
  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0 && firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = undefined;
      state = initialState;
    }
  };
}

export function getSettingsCatalogState(): SettingsCatalogState {
  return state;
}
