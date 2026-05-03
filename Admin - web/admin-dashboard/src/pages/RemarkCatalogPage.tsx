import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { useRemarkCatalog } from "../hooks/useRemarkCatalog";
import { saveRemarkCatalog } from "../lib/remarkCatalogCrud";
import type { RemarkCatalogItem } from "../types/remarkCatalog";

export function RemarkCatalogPage() {
  const { items: remoteItems, loading, error } = useRemarkCatalog();
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<RemarkCatalogItem[]>([]);

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
      setFormError("Enter a remark preset.");
      return;
    }
    const dup = items.some((x) => x.name.toLowerCase() === name.toLowerCase());
    if (dup) {
      setFormError("That preset is already in the list.");
      return;
    }
    const row: RemarkCatalogItem = { id: crypto.randomUUID(), name };
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
      setFormError("Duplicate preset name.");
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
        setFormError("Every row needs a preset name.");
        return;
      }
    }
    const seen = new Set<string>();
    for (const r of items) {
      const key = r.name.toLowerCase();
      if (seen.has(key)) {
        setFormError("Preset names must be unique (case-insensitive).");
        return;
      }
      seen.add(key);
    }
    setSaving(true);
    try {
      await saveRemarkCatalog(items);
      setDirty(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={page}>
        <div style={headRow}>
          <div>
            <h1 style={h1}>Remark presets</h1>
            <p style={sub}>
              Add short lines that appear in the remarks dropdown on farmer forms — the list updates
              live after you save. Crops are on the{" "}
              <Link to="/catalog/crops" style={{ color: "var(--primary)", fontWeight: 800 }}>
                Crops
              </Link>{" "}
              page.
            </p>
          </div>
          <button
            type="button"
            style={btnPrimary}
            disabled={saving || !dirty}
            onClick={() => void persist()}
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
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
          <h2 style={h2}>Add preset</h2>
          <form onSubmit={addItem} style={addRow}>
            <label style={{ ...label, flex: "1 1 280px" }}>
              Preset text *
              <input
                style={input}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Urgent follow-up"
                required
              />
            </label>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" style={btnSecondary}>
                Add to list
              </button>
            </div>
          </form>
        </section>

        <section style={card}>
          <h2 style={h2}>Presets ({items.length})</h2>
          {loading && items.length === 0 && !dirty ? (
            <p style={muted}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={muted}>
              No presets yet — only &quot;Other (type below)&quot; will show on farmer forms until you
              add rows.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Text</th>
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
                        <button type="button" style={dangerBtn} onClick={() => removeRow(row.id)}>
                          Remove
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

const btnPrimary: CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow)",
};

const btnSecondary: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 16px",
  background: "var(--surface)",
  fontWeight: 700,
  cursor: "pointer",
};

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

const dangerBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--danger)",
  fontWeight: 800,
  cursor: "pointer",
};
