import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { FertilizerUnitField } from "../components/FertilizerUnitField";
import type { CatalogLineItem } from "../types/fertilizerCatalog";

export type CatalogItemsPageProps = {
  title: string;
  intro: ReactNode;
  remoteItems: CatalogLineItem[];
  loading: boolean;
  error: string | null;
  saveCatalog: (items: CatalogLineItem[]) => Promise<void>;
  nameRequiredMessage: string;
  catalogEmptyHint: string;
  /** Placeholder for the product name field (add form). */
  namePlaceholder?: string;
};

export function CatalogItemsPage({
  title,
  intro,
  remoteItems,
  loading,
  error,
  saveCatalog,
  nameRequiredMessage,
  catalogEmptyHint,
  namePlaceholder = "e.g. Urea",
}: CatalogItemsPageProps) {
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<CatalogLineItem[]>([]);

  useEffect(() => {
    if (!dirty) setItems(remoteItems);
  }, [remoteItems, dirty]);

  const [draftName, setDraftName] = useState("");
  const [draftUnit, setDraftUnit] = useState("kg");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftStock, setDraftStock] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addItem(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = draftName.trim();
    if (!name) {
      setFormError(nameRequiredMessage);
      return;
    }
    const unit = draftUnit.trim();
    if (!unit) {
      setFormError("Choose a preset or Other and type the unit.");
      return;
    }
    const price = Number.parseFloat(draftPrice.trim() === "" ? "0" : draftPrice.trim());
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Enter a valid price per unit.");
      return;
    }
    const stock = Number.parseFloat(draftStock.trim() === "" ? "0" : draftStock.trim());
    if (!Number.isFinite(stock) || stock < 0) {
      setFormError("Enter a valid stock quantity (0 or more).");
      return;
    }
    const row: CatalogLineItem = {
      id: crypto.randomUUID(),
      name,
      unit,
      price,
      stock,
    };
    setItems((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
    setDirty(true);
    setDraftName("");
    setDraftPrice("");
    setDraftStock("");
    setDraftUnit("kg");
  }

  function updateRow(id: string, patch: Partial<CatalogLineItem>) {
    setItems((prev) =>
      prev
        .map((row) => (row.id === id ? { ...row, ...patch } : row))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
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
        setFormError("Every row needs a product name.");
        return;
      }
      if (!(r.unit ?? "").trim()) {
        setFormError("Every row needs a unit.");
        return;
      }
    }
    setSaving(true);
    try {
      await saveCatalog(items);
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
            <h1 style={h1}>{title}</h1>
            <p style={sub}>{intro}</p>
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
          <h2 style={h2}>Add item</h2>
          <form onSubmit={addItem} style={addGrid}>
            <label style={label}>
              Product name *
              <input
                style={input}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={namePlaceholder}
                required
              />
            </label>
            <label style={label}>
              Unit *
              <div style={{ marginTop: 6 }}>
                <FertilizerUnitField stableKey="add" value={draftUnit} onChange={setDraftUnit} />
              </div>
            </label>
            <label style={label}>
              Price per unit (₹) *
              <input
                style={input}
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                placeholder="0"
                required
              />
            </label>
            <label style={label}>
              Stock on hand *
              <input
                style={input}
                inputMode="decimal"
                value={draftStock}
                onChange={(e) => setDraftStock(e.target.value)}
                placeholder="0"
                title="Quantity in inventory (same unit as above)"
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
          <h2 style={h2}>Catalog ({items.length})</h2>
          {loading && items.length === 0 && !dirty ? (
            <p style={muted}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={muted}>{catalogEmptyHint}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Name</th>
                    <th style={th}>Unit</th>
                    <th style={th}>Price / unit (₹)</th>
                    <th style={th}>Stock</th>
                    <th style={thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <CatalogEditRow key={row.id} row={row} onChange={updateRow} onRemove={removeRow} />
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

function CatalogEditRow({
  row,
  onChange,
  onRemove,
}: {
  row: CatalogLineItem;
  onChange: (id: string, patch: Partial<CatalogLineItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <tr>
      <td style={td}>
        <input
          style={inputSm}
          value={row.name}
          onChange={(e) => onChange(row.id, { name: e.target.value })}
        />
      </td>
      <td style={{ ...td, verticalAlign: "top" }}>
        <FertilizerUnitField
          stableKey={row.id}
          dense
          value={row.unit}
          onChange={(unit) => onChange(row.id, { unit })}
        />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          inputMode="decimal"
          value={row.price === 0 ? "" : String(row.price)}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (v === "") {
              onChange(row.id, { price: 0 });
              return;
            }
            const n = Number.parseFloat(v);
            onChange(row.id, { price: Number.isFinite(n) && n >= 0 ? n : 0 });
          }}
        />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          inputMode="decimal"
          value={(row.stock ?? 0) === 0 ? "" : String(row.stock ?? 0)}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (v === "") {
              onChange(row.id, { stock: 0 });
              return;
            }
            const n = Number.parseFloat(v);
            onChange(row.id, { stock: Number.isFinite(n) && n >= 0 ? n : 0 });
          }}
          aria-label="Stock on hand"
        />
      </td>
      <td style={{ ...td, textAlign: "right" }}>
        <button type="button" style={dangerBtn} onClick={() => onRemove(row.id)}>
          Remove
        </button>
      </td>
    </tr>
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

const addGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
