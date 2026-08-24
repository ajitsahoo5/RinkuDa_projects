import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { docToFarmer } from "./firestoreFarmer";
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
let loadPromise: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

async function loadFarmersFromFirestore(): Promise<void> {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"), orderBy("slNo"));
    const snap = await getDocs(q);
    state = {
      farmers: snap.docs.map((d) =>
        docToFarmer(d.id, d.data() as Record<string, unknown>),
      ),
      loading: false,
      error: null,
    };
  } catch (e) {
    state = {
      farmers: [],
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  emit();
}

function startLoad() {
  if (!loadPromise) {
    state = { farmers: state.farmers, loading: true, error: null };
    emit();
    loadPromise = loadFarmersFromFirestore().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

/**
 * One-time fetch for the `farmers` collection — no live Firestore listener (avoids reconnect read storms).
 */
export function subscribeFarmers(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = { farmers: [], loading: true, error: null };
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

/** Re-fetch farmers from Firestore (e.g. after save or manual refresh). */
export function refreshFarmers(): Promise<void> {
  if (refCount === 0) return Promise.resolve();
  return startLoad();
}

export function getFarmersState(): FarmersState {
  return state;
}

export async function fetchFarmerById(id: string): Promise<Farmer | null> {
  const snap = await getDoc(doc(getDb(), "farmers", id));
  if (!snap.exists()) return null;
  return docToFarmer(snap.id, snap.data() as Record<string, unknown>);
}

/** Reads at most one document to compute the next SL number. */
export async function fetchNextSlNo(): Promise<number> {
  const q = query(collection(getDb(), "farmers"), orderBy("slNo", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return 1;
  const raw = snap.docs[0].data().slNo;
  const max = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(max) ? max + 1 : 1;
}
