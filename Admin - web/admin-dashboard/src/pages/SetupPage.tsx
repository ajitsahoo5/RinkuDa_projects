import type { CSSProperties } from "react";

export function SetupPage() {
  return (
    <div style={wrap}>
      <div className="glass-card" style={card}>
        <h1 style={h1}>Connect Firebase &amp; API</h1>
        <p style={p}>
          This admin dashboard uses <strong>Firebase Authentication</strong> for sign-in and the{" "}
          <strong>Farmer Registry REST API</strong> (PostgreSQL) for farmers, catalog, users, and settings.
        </p>
        <ol style={ol}>
          <li>
            In the{" "}
            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
              Firebase console
            </a>
            , open project <strong>farmer-management-a5b32</strong> (same as Flutter).
          </li>
          <li>Add a <strong>Web</strong> app and copy the config object.</li>
          <li>
            Create <code style={code}>.env</code> in <code style={code}>admin-dashboard/</code> from{" "}
            <code style={code}>.env.example</code> and set:
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>
                Six <code style={code}>VITE_FIREBASE_*</code> values
              </li>
              <li>
                <code style={code}>VITE_API_BASE_URL=http://localhost:3000/api/v1</code> (or your deployed API)
              </li>
            </ul>
          </li>
          <li>
            Start the API: <code style={code}>npm run start:dev</code> in{" "}
            <code style={code}>Backend/farmer-business-api</code>
          </li>
          <li>
            Restart this app: <code style={code}>npm run dev</code>
          </li>
        </ol>
        <p style={p}>
          <strong>First admin login</strong> — your Firebase account must exist in{" "}
          <code style={code}>registry_users</code> (PostgreSQL) with{" "}
          <code style={code}>role: admin</code> and <code style={code}>active: true</code>. User create/delete
          still uses Cloud Functions for Firebase Auth accounts; profiles are stored in the API.
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
  padding: 28,
};

const h1: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "1.5rem",
  fontWeight: 900,
};

const p: CSSProperties = {
  margin: "0 0 14px",
  lineHeight: 1.55,
  color: "var(--text)",
  fontWeight: 600,
};

const ol: CSSProperties = {
  margin: "0 0 16px",
  paddingLeft: 22,
  lineHeight: 1.65,
  fontWeight: 600,
};

const code: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.9em",
  background: "rgba(255, 255, 255, 0.08)",
  padding: "1px 5px",
  borderRadius: 4,
};
