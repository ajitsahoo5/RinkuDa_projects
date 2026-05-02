import { useState, type CSSProperties, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../contexts/AuthContext";
import { useAppUsers } from "../hooks/useAppUsers";
import { adminUpdateFirestoreUser } from "../lib/appUsersAdminCrud";
import { callableAdminCreateUser, callableAdminDeleteUser } from "../lib/authFunctions";
import { getFirebaseAuth } from "../lib/firebase";
import type { AppUserProfile, UserRole } from "../types/appUser";

function mapCallableError(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as { code?: unknown; message?: unknown };
    const code = typeof o.code === "string" ? o.code : "";
    if (code === "functions/already-exists") return "That email is already registered.";
    if (code === "functions/invalid-argument") return typeof o.message === "string" ? o.message : "Invalid input.";
    if (code === "functions/permission-denied") return "You are not allowed to do that.";
    if (code === "functions/failed-precondition") return typeof o.message === "string" ? o.message : "Request not allowed.";
    if (typeof o.message === "string" && o.message) return o.message;
  }
  return "Something went wrong. Check Cloud Functions are deployed and you're online.";
}

export function UsersAdminPage() {
  const { user: currentUser } = useAuth();
  const { users, loading, error } = useAppUsers();
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("client");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<AppUserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("client");
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const currentUid = currentUser?.uid ?? "";

  function openEdit(u: AppUserProfile) {
    setEditing(u);
    setEditDisplayName(u.displayName ?? "");
    setEditRole(u.role);
    setEditActive(u.active);
    setFormError(null);
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const email = newEmail.trim();
    const password = newPassword;
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    setCreating(true);
    try {
      await callableAdminCreateUser({
        email,
        password,
        displayName: newDisplayName.trim() || null,
        role: newRole,
      });
      setToast("User created.");
      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      setNewRole("client");
      setTimeout(() => setToast(null), 2800);
    } catch (err) {
      setFormError(mapCallableError(err));
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    setSavingEdit(true);
    try {
      const isSelf = editing.uid === currentUid;
      const patch: Parameters<typeof adminUpdateFirestoreUser>[1] = {
        displayName: editDisplayName.trim() || null,
      };
      if (!isSelf) {
        patch.role = editRole;
        patch.active = editActive;
      }
      await adminUpdateFirestoreUser(editing.uid, patch);
      setEditing(null);
      setToast("Saved changes.");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDelete(u: AppUserProfile) {
    if (u.uid === currentUid) return;
    const ok = window.confirm(
      `Delete "${u.email}"?\nThis removes their sign-in and Firestore profile.`,
    );
    if (!ok) return;
    setFormError(null);
    try {
      await callableAdminDeleteUser({ uid: u.uid });
      setToast("User removed.");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setFormError(mapCallableError(err));
    }
  }

  async function sendReset(u: AppUserProfile) {
    setFormError(null);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), u.email);
      setToast(`Password reset email sent to ${u.email}`);
      setTimeout(() => setToast(null), 2800);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AdminLayout>
      <div style={page}>
        {toast ? (
          <div style={toastBar} role="status">
            {toast}
          </div>
        ) : null}

        <div style={headRow}>
          <div>
            <h1 style={h1}>Users</h1>
            <p style={sub}>Admins can add <strong>Admin</strong> or <strong>Client</strong> accounts. Only admins may use this web app.</p>
          </div>
        </div>

        {formError ? (
          <div style={errBanner} role="alert">
            {formError}
          </div>
        ) : null}

        <section style={card}>
          <h2 style={h2}>Add user</h2>
          <form onSubmit={(e) => void submitCreate(e)} style={grid}>
            <label style={label}>
              Email *
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={input}
                autoComplete="off"
              />
            </label>
            <label style={label}>
              Initial password * (min 6)
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={input}
                autoComplete="new-password"
              />
            </label>
            <label style={label}>
              Display name
              <input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} style={input} />
            </label>
            <label style={label}>
              Role *
              <select
                style={input}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" style={btnPrimary} disabled={creating}>
                {creating ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
          <p style={hint}>
            Creating users requires deployed Cloud Functions (<code style={code}>adminCreateUser</code>). Signing in as
            the new user would sign you out of this session, so creation runs on the server.
          </p>
        </section>

        <section style={card}>
          <h2 style={h2}>All users ({users.length})</h2>
          {loading ? (
            <p style={muted}>Loading…</p>
          ) : error ? (
            <div style={errBanner}>{error}</div>
          ) : users.length === 0 ? (
            <p style={muted}>No user documents found. Seed the first admin profile in Firestore (see project setup).</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Email</th>
                    <th style={th}>Name</th>
                    <th style={th}>Role</th>
                    <th style={th}>Active</th>
                    <th style={thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const self = u.uid === currentUid;
                    return (
                      <tr key={u.uid}>
                        <td style={td}>
                          <span style={{ fontWeight: 800 }}>{u.email}</span>
                          {self ? <span style={badge}>You</span> : null}
                        </td>
                        <td style={td}>{u.displayName ?? "—"}</td>
                        <td style={td}>{u.role}</td>
                        <td style={td}>{u.active ? "Yes" : "No"}</td>
                        <td style={actionCell}>
                          <button type="button" style={linkBtn} onClick={() => openEdit(u)}>
                            Edit
                          </button>
                          <button type="button" style={linkBtn} onClick={() => void sendReset(u)}>
                            Reset password
                          </button>
                          <button
                            type="button"
                            style={dangerLink}
                            disabled={self}
                            title={self ? "You cannot delete your own account" : undefined}
                            onClick={() => void onDelete(u)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editing ? (
        <div style={backdrop} role="presentation" onClick={() => setEditing(null)}>
          <div style={modal} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...h2, marginTop: 0 }}>Edit user</h2>
            <p style={mutedSm}>{editing.email}</p>
            <form onSubmit={(e) => void saveEdit(e)} style={{ display: "grid", gap: 12 }}>
              <label style={label}>
                Display name
                <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={input} />
              </label>
              <label style={label}>
                Role
                <select
                  style={input}
                  value={editRole}
                  disabled={editing.uid === currentUid}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label style={checkRow}>
                <input
                  type="checkbox"
                  checked={editActive}
                  disabled={editing.uid === currentUid}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Active
              </label>
              {editing.uid === currentUid ? (
                <p style={hint}>Your own role and status cannot be changed here (protects accidental lock-out).</p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" style={btnGhost} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimary} disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

const page: CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "24px 20px 48px" };
const headRow: CSSProperties = { marginBottom: 18 };
const h1: CSSProperties = { margin: "0 0 8px", fontSize: "1.45rem", fontWeight: 900 };
const sub: CSSProperties = { margin: 0, color: "var(--muted)", fontWeight: 600, fontSize: "0.95rem", maxWidth: 640 };

const card: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 20,
  marginBottom: 18,
};
const h2: CSSProperties = { margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 800 };
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
  alignItems: "end",
};
const label: CSSProperties = { display: "grid", gap: 6, fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" };
const input: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fafafa",
};
const btnPrimary: CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "var(--shadow)",
};
const btnGhost: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 18px",
  background: "var(--surface)",
  fontWeight: 700,
  cursor: "pointer",
};
const hint: CSSProperties = { margin: "14px 0 0", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 };
const code: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.86em",
  background: "#f1f5f9",
  padding: "1px 5px",
  borderRadius: 4,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.92rem",
};
const th: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid var(--border)",
  color: "var(--muted)",
  fontWeight: 800,
};
const thRight: CSSProperties = { ...th, textAlign: "right" };
const td: CSSProperties = { padding: "10px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };
const actionCell: CSSProperties = {
  ...td,
  textAlign: "right",
  whiteSpace: "nowrap",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "flex-end",
  alignItems: "center",
};
const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };
const mutedSm: CSSProperties = { ...muted, fontSize: "0.88rem", marginTop: "-6px", marginBottom: 12 };

const linkBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--primary)",
  fontWeight: 800,
  cursor: "pointer",
  padding: "4px 0",
};
const dangerLink: CSSProperties = {
  ...linkBtn,
  color: "var(--danger)",
};

const badge: CSSProperties = {
  marginLeft: 8,
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  background: "var(--primary-soft)",
  color: "var(--primary)",
  padding: "2px 7px",
  borderRadius: 999,
};

const errBanner: CSSProperties = {
  background: "var(--danger-soft)",
  color: "var(--danger)",
  padding: "12px 14px",
  borderRadius: 10,
  marginBottom: 14,
  fontWeight: 600,
};
const toastBar: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  background: "var(--text)",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 10,
  fontWeight: 700,
  boxShadow: "var(--shadow)",
  zIndex: 60,
};

const backdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 50,
};
const modal: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  padding: 22,
  width: "min(420px, 100%)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
};

const checkRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 700,
  fontSize: "0.92rem",
  color: "var(--text)",
};
