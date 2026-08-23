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
import { ApiError } from "../lib/api/client";
import { getMe } from "../lib/api/registry/usersApi";
import { getFirebaseAuth } from "../lib/firebase";
import type { AppUserProfile } from "../types/appUser";

type AuthContextValue = {
  ready: boolean;
  user: User | null;
  profile: AppUserProfile | null;
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

      try {
        const parsed = await getMe();
        if (cancelled) return;

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
      } catch (e) {
        await signOut(auth);
        if (cancelled) return;
        setUser(null);
        setProfile(null);
        const message =
          e instanceof ApiError && e.status === 404
            ? "This account has no registry profile yet. Ask an administrator to add you in Users."
            : e instanceof Error
              ? e.message
              : "Could not load your profile from the API.";
        setBootstrapMessage(message);
        setReady(true);
      }
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
