import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconCheck,
  IconPlus,
  IconTrash,
  toolbarIconDangerBtn,
  toolbarIconPrimaryBtn,
} from "../components/ActionIcons";
import { AdminLayout } from "../components/AdminLayout";
import { useCropCatalog } from "../hooks/useCropCatalog";
import { saveCropCatalog } from "../lib/cropCatalogCrud";
import type { CropCatalogItem } from "../types/cropCatalog";

export function CropCatalogPage() {
  const { items: remoteItems, loading, error } = useCropCatalog();
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<CropCatalogItem[]>([]);

  useEffect(() => {
    if (!dirty) setItems(remoteItems);
  }, [remoteItems, dirty]);

  const [draftName, setDraftName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addItem(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = draftName.trim();
    if (!name) {
      setFormError("Enter a crop name.");
      return;
    }
    const dup = items.some((x) => x.name.toLowerCase() === name.toLowerCase());
    if (dup) {
      setFormError("That crop is already in the list.");
      return;
    }
    const row: CropCatalogItem = { id: crypto.randomUUID(), name };
    setItems((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
    setDirty(true);
    setDraftName("");
  }

  function updateRow(id: string, name: string) {
    const trimmed = name.trim();
    const next = items.map((row) =>
      row.id === id ? { ...row, name: trimmed === "" ? row.name : trimmed } : row,
    );
    const lowerKeys = next.map((x) => x.name.toLowerCase());
    const uniq = new Set(lowerKeys);
    if (uniq.size !== lowerKeys.length && trimmed !== "") {
      setFormError("Duplicate crop name.");
      return;
    }
    setFormError(null);
    setItems(next.sort((a, b) => a.name.localeCompare(b.name)));
    setDirty(true);
  }

  function removeRow(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    setDirty(true);
  }

  async function persist() {
    setFormError(null);
    for (const r of items) {
      if (!r.name.trim()) {
        setFormError("Every row needs a crop name.");
        return;
      }
    }
    const seen = new Set<string>();
    for (const r of items) {
      const key = r.name.toLowerCase();
      if (seen.has(key)) {
        setFormError("Crop names must be unique (case-insensitive).");
        return;
      }
      seen.add(key);
    }
    setSaving(true);
    try {
      await saveCropCatalog(items);
      setDirty(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={page} className="page-responsive-padding">
        <div style={headRow}>
          <div>
            <h1 style={h1}>Crop catalog</h1>
            <p style={sub}>
              Add crops that appear in the dropdown on farmer forms — the list updates live after you
              save (no hardcoded values in the app). Fertilizer catalog is on the{" "}
              <Link to="/catalog/fertilizers" style={{ color: "var(--primary)", fontWeight: 800 }}>
                Fertilizers
              </Link>{" "}
              page.
            </p>
          </div>
          <button
            type="button"
            style={{
              ...toolbarIconPrimaryBtn,
              ...(!dirty && !saving ? { opacity: 0.55 } : {}),
            }}
            disabled={saving || !dirty}
            aria-label={dirty ? "Save catalog changes" : "All changes saved"}
            title={dirty ? "Save changes" : "Saved"}
            onClick={() => void persist()}
          >
            {saving ? "…" : <IconCheck />}
          </button>
        </div>

        {error ? (
          <div style={errBox} role="alert">
            Couldn’t subscribe to catalog: {error}
          </div>
        ) : null}

        {formError ? (
          <div style={errBox} role="alert">
            {formError}
          </div>
        ) : null}

        <section style={card}>
          <h2 style={h2}>Add crop</h2>
          <form onSubmit={addItem} style={addRow}>
            <label style={{ ...label, flex: "1 1 280px" }}>
              Crop name *
              <input
                style={input}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Paddy"
                required
              />
            </label>
            <div style={{ alignSelf: "end" }}>
              <button
                type="submit"
                style={toolbarIconPrimaryBtn}
                aria-label="Add to list"
                title="Add to list"
              >
                <IconPlus />
              </button>
            </div>
          </form>
        </section>

        <section style={card}>
          <h2 style={h2}>Crops ({items.length})</h2>
          {loading && items.length === 0 && !dirty ? (
            <p style={muted}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={muted}>No crops yet — farmer forms won’t show a preset dropdown until you add rows.</p>
          ) : (
            <div className="touch-scroll">
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Name</th>
                    <th style={thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td style={td}>
                        <input
                          style={inputSm}
                          value={row.name}
                          onChange={(e) => updateRow(row.id, e.target.value)}
                        />
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <button
                          type="button"
                          style={toolbarIconDangerBtn}
                          aria-label={`Remove ${row.name}`}
                          title="Remove"
                          onClick={() => removeRow(row.id)}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

const page: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "24px 20px 48px",
};

const headRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};

const h1: CSSProperties = { margin: "0 0 8px", fontSize: "1.45rem", fontWeight: 900 };
const sub: CSSProperties = { margin: 0, color: "var(--muted)", fontWeight: 600, fontSize: "0.95rem" };

const h2: CSSProperties = { margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 800 };

const card: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 20,
  marginBottom: 18,
};

const addRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  alignItems: "end",
};

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
  padding: "10px 12px",
  background: "#fafafa",
};

const inputSm: CSSProperties = { ...input, width: "100%", minWidth: 100 };

const errBox: CSSProperties = {
  background: "var(--danger-soft)",
  color: "var(--danger)",
  padding: "12px 14px",
  borderRadius: 10,
  marginBottom: 16,
  fontWeight: 600,
};

const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };

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

const td: CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
};
