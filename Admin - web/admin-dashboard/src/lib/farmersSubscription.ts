import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
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
let firestoreUnsub: Unsubscribe | undefined;

function emit() {
  for (const l of listeners) l();
}

function attachFirestore() {
  try {
    const db = getDb();
    const q = query(collection(db, "farmers"), orderBy("slNo"));
    firestoreUnsub = onSnapshot(
      q,
      (snap) => {
        state = {
          farmers: snap.docs.map((d) =>
            docToFarmer(d.id, d.data() as Record<string, unknown>),
          ),
          loading: false,
          error: null,
        };
        emit();
      },
      (e) => {
        state = {
          farmers: [],
          loading: false,
          error: e.message,
        };
        emit();
      },
    );
  } catch (e) {
    state = {
      farmers: [],
      loading: false,
      error: e instanceof Error ? e.message : String(e),
    };
    emit();
  }
}

/**
 * Shared listener for the `farmers` collection — one Firestore subscription per app session.
 */
export function subscribeFarmers(listener: () => void): () => void {
  listeners.add(listener);
  refCount += 1;
  if (refCount === 1) {
    state = { farmers: [], loading: true, error: null };
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

export function getFarmersState(): FarmersState {
  return state;
}
