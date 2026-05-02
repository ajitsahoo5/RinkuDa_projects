import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analyticsInit: Promise<Analytics | null> | null = null;

function readEnv(name: string): string | undefined {
  const v = import.meta.env[name as keyof ImportMetaEnv];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function requireEnv(name: string): string {
  const v = readEnv(name);
  if (!v) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and add Firebase Web App config from the Firebase console.`,
    );
  }
  return v;
}

const ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export function isFirebaseConfigured(): boolean {
  return ENV_KEYS.every((k) => readEnv(k) != null);
}

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const measurementId = readEnv("VITE_FIREBASE_MEASUREMENT_ID");
  app = initializeApp({
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID"),
    ...(measurementId ? { measurementId } : {}),
  });
  return app;
}

/** Enables Google Analytics when `VITE_FIREBASE_MEASUREMENT_ID` is set and the browser supports it. */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (!isFirebaseConfigured() || !readEnv("VITE_FIREBASE_MEASUREMENT_ID")) {
    return Promise.resolve(null);
  }
  if (!analyticsInit) {
    analyticsInit = (async () => {
      if (!(await isSupported())) return null;
      return getAnalytics(getFirebaseApp());
    })();
  }
  return analyticsInit;
}

export function getDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  return auth;
}
