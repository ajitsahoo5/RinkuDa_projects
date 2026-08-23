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
    <div className="login-page-wrap">
      <div className="admin-bg-ambient" aria-hidden />
      <div className="admin-bg-orbs" aria-hidden>
        <div className="admin-bg-orb admin-bg-orb--1" />
        <div className="admin-bg-orb admin-bg-orb--2" />
        <div className="admin-bg-orb admin-bg-orb--3" />
      </div>
      <div className="glass-card login-glass-card">
        <div style={loginLogoWrap}>
          <div className="login-logo-ring">
            <img src={APP_ICON_PATH} alt={APP_ICON_ALT} width={72} height={72} style={loginLogoImg} />
          </div>
        </div>
        <p style={appBrand}>{APP_NAME}</p>
        <h1 style={h1}>Welcome back</h1>
        <p style={p}>Sign in to your admin account</p>
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
        <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: 16 }}>
          <label style={label}>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              className="glass-input"
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
              className="glass-input"
            />
          </label>
          <button type="submit" className="glass-btn-primary" style={btn} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const loginLogoWrap: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 20,
};

const appBrand: CSSProperties = {
  margin: "0 0 6px",
  textAlign: "center",
  fontSize: "1.2rem",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  background: "linear-gradient(135deg, #1e293b, #4f46e5)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const loginLogoImg: CSSProperties = {
  borderRadius: 16,
  objectFit: "contain",
  display: "block",
};

const h1: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "1.05rem",
  fontWeight: 600,
  textAlign: "center",
  color: "var(--text-secondary)",
};

const p: CSSProperties = {
  margin: "0 0 24px",
  color: "var(--muted)",
  fontSize: "0.875rem",
  textAlign: "center",
};

const label: CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--muted)",
};

const input: CSSProperties = { width: "100%" };

const btn: CSSProperties = { width: "100%", marginTop: 4 };

const banner: CSSProperties = {
  background: "rgba(251, 146, 60, 0.1)",
  border: "1px solid rgba(251, 146, 60, 0.3)",
  color: "#c2410c",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 500,
  fontSize: "0.875rem",
  marginBottom: 14,
};

const bannerErr: CSSProperties = {
  ...banner,
  background: "var(--danger-soft)",
  border: "1px solid rgba(225, 29, 72, 0.2)",
  color: "var(--danger)",
};
