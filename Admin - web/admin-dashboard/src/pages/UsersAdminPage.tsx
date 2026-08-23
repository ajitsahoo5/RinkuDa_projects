import { useState, type CSSProperties, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  IconCheck,
  IconEdit,
  IconKeyReset,
  IconPlus,
  IconTrash,
  IconX,
  toolbarIconBtn,
  toolbarIconDangerBtn,
  toolbarIconPrimaryBtn,
} from "../components/ActionIcons";
import { GlassBanner, GlassToast } from "../components/GlassAlert";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GlassModal } from "../components/GlassModal";
import { GlassSelect } from "../components/GlassSelect";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../contexts/AuthContext";
import { useAppUsers } from "../hooks/useAppUsers";
import { adminUpdateRegistryUser } from "../lib/appUsersAdminCrud";
import { callableAdminCreateUser, callableAdminDeleteUser } from "../lib/authFunctions";
import { createUser, deleteUser } from "../lib/api/registry/usersApi";
import { invalidateUsers } from "../lib/api/invalidate";
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
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUserProfile | null>(null);

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
      const { uid } = await callableAdminCreateUser({
        email,
        password,
        displayName: newDisplayName.trim() || null,
        role: newRole,
      });
      await createUser({
        email,
        firebaseUid: uid,
        displayName: newDisplayName.trim() || null,
        role: newRole,
      });
      invalidateUsers();
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
      const patch: Parameters<typeof adminUpdateRegistryUser>[1] = {
        displayName: editDisplayName.trim() || null,
      };
      if (!isSelf) {
        patch.role = editRole;
        patch.active = editActive;
      }
      await adminUpdateRegistryUser(editing.uid, patch);
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
    setDeleteConfirmUser(u);
  }

  async function confirmDelete() {
    const u = deleteConfirmUser;
    if (!u || u.uid === currentUid) {
      setDeleteConfirmUser(null);
      return;
    }
    setFormError(null);
    setDeleteConfirmUser(null);
    try {
      await callableAdminDeleteUser({ uid: u.uid });
      await deleteUser(u.uid);
      invalidateUsers();
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
      {toast ? <GlassToast message={toast} onClose={() => setToast(null)} /> : null}
      <div style={page} className="page-responsive-padding">

        <div style={headRow}>
          <div>
            <h1 style={h1}>Users</h1>
            <p style={sub}>Admins can add <strong>Admin</strong> or <strong>Client</strong> accounts. Only admins may use this web app.</p>
          </div>
        </div>

        {formError ? (
          <GlassBanner variant="error">{formError}</GlassBanner>
        ) : null}

        <section className="glass-panel" style={card}>
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
              <GlassSelect
                style={input}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </GlassSelect>
            </label>
            <div style={{ alignSelf: "end" }}>
              <button
                type="submit"
                style={toolbarIconPrimaryBtn}
                disabled={creating}
                aria-label="Create user"
                title="Create user"
              >
                {creating ? "…" : <IconPlus />}
              </button>
            </div>
          </form>
          <p style={hint}>
            Creating users requires deployed Cloud Functions (<code style={code}>adminCreateUser</code>). Signing in as
            the new user would sign you out of this session, so creation runs on the server.
          </p>
        </section>

        <section className="glass-panel" style={card}>
          <h2 style={h2}>All users ({users.length})</h2>
          {loading ? (
            <p style={muted}>Loading…</p>
          ) : error ? (
            <GlassBanner variant="error">{error}</GlassBanner>
          ) : users.length === 0 ? (
            <p style={muted}>No users found in the registry API.</p>
          ) : (
            <div className="touch-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const self = u.uid === currentUid;
                    return (
                      <tr key={u.uid}>
                        <td className="strong">
                          {u.email}
                          {self ? <span style={badge}>You</span> : null}
                        </td>
                        <td>{u.displayName ?? "—"}</td>
                        <td>{u.role}</td>
                        <td>{u.active ? "Yes" : "No"}</td>
                        <td className="actions-cell">
                          <div className="actions-cell-inner">
                          <button
                            type="button"
                            style={toolbarIconBtn}
                            aria-label={`Edit user ${u.email}`}
                            title="Edit user"
                            onClick={() => openEdit(u)}
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            style={toolbarIconBtn}
                            aria-label={`Send password reset email to ${u.email}`}
                            title="Reset password (email)"
                            onClick={() => void sendReset(u)}
                          >
                            <IconKeyReset />
                          </button>
                          <button
                            type="button"
                            style={{
                              ...toolbarIconDangerBtn,
                              ...(self ? { opacity: 0.45, cursor: "not-allowed" as const } : {}),
                            }}
                            disabled={self}
                            aria-label={self ? "Cannot delete your own account" : `Delete user ${u.email}`}
                            title={self ? "You cannot delete your own account" : "Delete user"}
                            onClick={() => void onDelete(u)}
                          >
                            <IconTrash />
                          </button>
                          </div>
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
        <GlassModal
          title="Edit user"
          subtitle={editing.email}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button
                type="button"
                className="glass-btn-secondary"
                aria-label="Cancel"
                title="Cancel"
                onClick={() => setEditing(null)}
              >
                <IconX />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                form="edit-user-form"
                className="glass-btn-primary"
                disabled={savingEdit}
                aria-label="Save user"
                title="Save"
              >
                {savingEdit ? "…" : <IconCheck />}
                <span>Save</span>
              </button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={(e) => void saveEdit(e)} style={{ display: "grid", gap: 12 }}>
            <label className="glass-form-label">
              Display name
              <input className="glass-input" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={input} />
            </label>
            <label className="glass-form-label">
              Role
              <GlassSelect
                style={input}
                value={editRole}
                disabled={editing.uid === currentUid}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </GlassSelect>
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
          </form>
        </GlassModal>
      ) : null}

      {deleteConfirmUser ? (
        <ConfirmDialog
          title="Delete user"
          message={`Delete "${deleteConfirmUser.email}"? This removes their Firebase sign-in and registry profile.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteConfirmUser(null)}
        />
      ) : null}
    </AdminLayout>
  );
}

const page: CSSProperties = { padding: "20px 24px 32px" };
const headRow: CSSProperties = { marginBottom: 18 };
const h1: CSSProperties = { margin: "0 0 8px", fontSize: "1.45rem", fontWeight: 900 };
const sub: CSSProperties = { margin: 0, color: "var(--muted)", fontWeight: 600, fontSize: "0.95rem", maxWidth: 640 };

const card: CSSProperties = {
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
  padding: "10px 12px",
};
const hint: CSSProperties = { margin: "14px 0 0", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 };
const code: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.86em",
  background: "rgba(255, 255, 255, 0.08)",
  padding: "1px 5px",
  borderRadius: 4,
};

const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };

const badge: CSSProperties = {
  marginLeft: 8,
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  background: "var(--primary-soft)",
  color: "var(--accent)",
  padding: "2px 7px",
  borderRadius: 999,
};

const checkRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 700,
  fontSize: "0.92rem",
  color: "var(--text)",
};
