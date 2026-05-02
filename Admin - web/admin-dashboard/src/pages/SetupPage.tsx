import type { CSSProperties } from "react";

export function SetupPage() {
  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={h1}>Connect Firebase</h1>
        <p style={p}>
          This admin dashboard uses the same <strong>Cloud Firestore</strong> as the Flutter app:
          <code style={code}>farmers</code> and <code style={code}>settings/app</code> (
          <code style={code}>googleSheetLink</code>).
        </p>
        <ol style={ol}>
          <li>
            In the{" "}
            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
              Firebase console
            </a>
            , open the same project as the mobile app.
          </li>
          <li>Add a <strong>Web</strong> app and copy the config object.</li>
          <li>
            Create <code style={code}>.env</code> in <code style={code}>admin-dashboard/</code> from{" "}
            <code style={code}>.env.example</code> and paste the six <code style={code}>VITE_FIREBASE_*</code> values.
          </li>
          <li>Restart <code style={code}>npm run dev</code>.</li>
        </ol>
        <p style={p}>
          <strong>Administrators &amp; login</strong> — after env is set, enable{" "}
          <strong>Firebase Authentication → Email/Password</strong>, deploy{" "}
          <code style={code}>firestore.rules</code> and Cloud Functions in <code style={code}>functions/</code> (
          <code style={code}>adminCreateUser</code>, <code style={code}>adminDeleteUser</code>
          ), then create the first admin: add a user in Auth, and a matching document{" "}
          <code style={code}>users/&lt;their-uid&gt;</code> with{" "}
          <code style={code}>role: &quot;admin&quot;</code>, <code style={code}>active: true</code>, and{" "}
          <code style={code}>email</code>. If the Flutter app relied on open Firestore rules, update it to use
          authenticated access or relax the <code style={code}>farmers</code> / <code style={code}>settings</code>
          rules accordingly.
        </p>
        <p style={muted}>
          Deploy example: <code style={code}>firebase deploy --only firestore:rules,functions</code> from this folder.
        </p>
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

const card: CSSProperties = {
  maxWidth: 640,
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 28,
};

const h1: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: "1.35rem",
  fontWeight: 900,
};

const p: CSSProperties = {
  margin: "0 0 16px",
  color: "var(--text)",
  lineHeight: 1.6,
};

const muted: CSSProperties = {
  margin: "16px 0 0",
  fontSize: "0.9rem",
  color: "var(--muted)",
};

const ol: CSSProperties = {
  margin: "0 0 8px",
  paddingLeft: 22,
  lineHeight: 1.7,
};

const code: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.88em",
  background: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: 6,
};
