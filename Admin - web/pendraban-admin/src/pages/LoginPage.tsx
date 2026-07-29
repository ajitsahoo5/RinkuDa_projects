import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { APP_ICON_ALT, APP_ICON_PATH, APP_NAME } from "../lib/branding";

function mapAuthErr(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Could not sign in. Check your credentials and try again.";
  }
}

export function LoginPage() {
  const { signIn, bootstrapMessage, clearBootstrapMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearBootstrapMessage();
    setError(null);
    const em = email.trim();
    if (!em) {
      setError("Enter your email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(em, password);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
      setError(mapAuthErr(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap} className="login-page-wrap">
      <div style={card}>
        <div style={loginLogoWrap}>
          <img src={APP_ICON_PATH} alt={APP_ICON_ALT} width={88} height={88} style={loginLogoImg} />
        </div>
        <p style={appBrand}>{APP_NAME}</p>
        <h1 style={h1}>Administrator sign-in</h1>
        <p style={p}>Only accounts with role <strong>Admin</strong> can open this dashboard.</p>
        {bootstrapMessage ? (
          <div style={banner} role="alert">
            {bootstrapMessage}
          </div>
        ) : null}
        {error ? (
          <div style={bannerErr} role="alert">
            {error}
          </div>
        ) : null}
        <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: 14 }}>
          <label style={label}>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
          </label>
          <label style={label}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
          </label>
          <button type="submit" style={btn} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={muted}>Client accounts cannot access this panel.</p>
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "var(--bg)",
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 28,
};

const loginLogoWrap: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 14,
};

const appBrand: CSSProperties = {
  margin: "0 0 12px",
  textAlign: "center",
  fontSize: "1.35rem",
  fontWeight: 900,
  color: "var(--primary)",
  lineHeight: 1.25,
};

const loginLogoImg: CSSProperties = {
  borderRadius: "50%",
  objectFit: "contain",
  border: "2px solid var(--border)",
  background: "#fff",
  boxShadow: "var(--shadow)",
};

const h1: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1.1rem",
  fontWeight: 800,
  textAlign: "center",
  color: "var(--text)",
};
const p: CSSProperties = {
  margin: "0 0 16px",
  color: "var(--text)",
  lineHeight: 1.55,
  textAlign: "center",
};
const muted: CSSProperties = { margin: "16px 0 0", fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600 };

const label: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "var(--muted)",
};

const input: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "12px 14px",
  background: "#fafafa",
};

const btn: CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "var(--shadow)",
};

const banner: CSSProperties = {
  background: "rgba(251, 146, 60, 0.12)",
  border: "1px solid rgba(251, 146, 60, 0.45)",
  color: "#c2410c",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: "0.9rem",
  marginBottom: 14,
};

const bannerErr: CSSProperties = {
  ...banner,
  background: "var(--danger-soft)",
  border: `1px solid var(--danger)`,
  color: "var(--danger)",
};
