import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { parseUserProfile } from "../lib/appUsersFirestore";
import { getDb, getFirebaseAuth } from "../lib/firebase";
import type { AppUserProfile } from "../types/appUser";

type AuthContextValue = {
  ready: boolean;
  /** Firebase Auth signed-in user; only admins pass the gate below. */
  user: User | null;
  /** Loaded Firestore profile for the signed-in user (admin gate already passed when set non-null alongside user). */
  profile: AppUserProfile | null;
  /** Explicit false while signed in but failing admin/active checks handled through sign-out. */
  bootstrapMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearBootstrapMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setBootstrapMessage(null);
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setReady(true);
        return;
      }

      setUser(nextUser);
      setProfile(null);
      setReady(false);

      const snap = await getDoc(doc(getDb(), "users", nextUser.uid));
      if (cancelled) return;

      if (!snap.exists()) {
        await signOut(auth);
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setBootstrapMessage(
            "This account has no user profile yet. Ask an administrator to finish setup in Firebase Console.",
          );
          setReady(true);
        }
        return;
      }

      const parsed = parseUserProfile(nextUser.uid, snap.data() as Record<string, unknown>);
      if (!parsed) {
        await signOut(auth);
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setBootstrapMessage("User profile document is invalid. Contact support.");
          setReady(true);
        }
        return;
      }

      if (parsed.role !== "admin" || !parsed.active) {
        await signOut(auth);
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setBootstrapMessage(
            parsed.role !== "admin"
              ? "This dashboard is for administrators only. Client accounts cannot sign in here."
              : "This administrator account has been deactivated.",
          );
          setReady(true);
        }
        return;
      }

      setProfile(parsed);
      setReady(true);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    setBootstrapMessage(null);
    await signOut(getFirebaseAuth());
  }, []);

  const clearBootstrapMessage = useCallback(() => setBootstrapMessage(null), []);

  const value = useMemo(
    () => ({
      ready,
      user,
      profile,
      bootstrapMessage,
      signIn,
      signOutUser,
      clearBootstrapMessage,
    }),
    [
      bootstrapMessage,
      clearBootstrapMessage,
      profile,
      ready,
      signIn,
      signOutUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
