import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { FertilizerUnitField } from "./FertilizerUnitField";
import type { FertilizerType } from "../types/farmer";

type Props = {
  title: string;
  intro: ReactNode;
  templates: FertilizerType[];
  lines: FertilizerType[];
  onLinesChange: (next: FertilizerType[]) => void;
  /** If false, hide the “Custom item” control (e.g. when you only want catalog SKUs). */
  allowCustomItems?: boolean;
};

function isTemplateRow(id: string, templates: FertilizerType[]): boolean {
  return templates.some((t) => t.id === id);
}

export function FarmerCatalogSection({
  title,
  intro,
  templates,
  lines,
  onLinesChange,
  allowCustomItems = true,
}: Props) {
  const [pickId, setPickId] = useState("");
  const [pendingQty, setPendingQty] = useState("");
  const [pendingPrice, setPendingPrice] = useState("");

  const templatesNotYetAdded = useMemo(() => {
    const have = new Set(lines.map((f) => f.id));
    return templates.filter((t) => !have.has(t.id));
  }, [templates, lines]);

  const pickedTemplate = useMemo(
    () => (pickId ? templates.find((t) => t.id === pickId) : undefined),
    [pickId, templates],
  );

  useEffect(() => {
    if (pickedTemplate) {
      setPendingPrice(
        pickedTemplate.price === 0 ? "" : String(pickedTemplate.price),
      );
    } else {
      setPendingPrice("");
    }
  }, [pickedTemplate]);

  function clearPending() {
    setPickId("");
    setPendingQty("");
    setPendingPrice("");
  }

  function addPickedLine() {
    if (!pickedTemplate) return;
    const qtyRaw = pendingQty.trim() === "" ? "0" : pendingQty.trim();
    const qty = Number.parseFloat(qtyRaw);
    if (!Number.isFinite(qty) || qty < 0) return;
    const priceRaw = pendingPrice.trim() === "" ? "0" : pendingPrice.trim();
    const priceNum = Number.parseFloat(priceRaw);
    const price =
      Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : pickedTemplate.price;
    onLinesChange([
      ...lines,
      { ...pickedTemplate, amount: qty, price },
    ]);
    clearPending();
  }

  function updateLine(id: string, patch: Partial<FertilizerType>) {
    onLinesChange(lines.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeLine(id: string) {
    onLinesChange(lines.filter((f) => f.id !== id));
  }

  function appendCustomRow() {
    onLinesChange([
      ...lines,
      {
        id: crypto.randomUUID(),
        name: "",
        amount: 0,
        price: 0,
        unit: "kg",
      },
    ]);
  }

  return (
    <section style={card}>
      <div style={fertHeader}>
        <div>
          <h2 style={{ ...h2, marginBottom: 4 }}>{title}</h2>
          <p style={fertHint}>{intro}</p>
        </div>
      </div>

      <div style={addFertToolbar}>
        <label style={{ ...label, margin: 0, minWidth: 200, flex: "1 1 200px" }}>
          Add from catalog
          <select
            className="farm-form-select"
            style={{ ...input, marginTop: 6, cursor: "pointer" }}
            value={pickId}
            onChange={(e) => {
              setPickId(e.target.value);
              setPendingQty("");
            }}
          >
            <option value="">Choose product…</option>
            {templatesNotYetAdded.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {allowCustomItems ? (
          <div style={{ alignSelf: "end" }}>
            <button type="button" style={btnOutlineSm} onClick={appendCustomRow}>
              Custom item…
            </button>
          </div>
        ) : null}
      </div>

      {pickId && pickedTemplate ? (
        <div style={pendingPanel}>
          <div style={pendingTitle}>
            <strong>{pickedTemplate.name}</strong>
            <span style={pendingUnit}> — {pickedTemplate.unit ?? "—"}</span>
          </div>
          <div style={pendingGrid}>
            <label style={labelSm}>
              Quantity
              <input
                style={input}
                inputMode="decimal"
                value={pendingQty}
                onChange={(e) => setPendingQty(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </label>
            <label style={labelSm}>
              ₹ / unit
              <input
                style={input}
                inputMode="decimal"
                value={pendingPrice}
                onChange={(e) => setPendingPrice(e.target.value)}
                placeholder="0"
              />
            </label>
            <div style={pendingActions}>
              <button type="button" style={btnPrimarySm} onClick={addPickedLine}>
                Add line
              </button>
              <button type="button" style={btnGhostSm} onClick={clearPending}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Item</th>
              <th style={th}>Unit</th>
              <th style={th}>Qty</th>
              <th style={th}>₹ / unit</th>
              <th style={th}>Line total</th>
              <th style={thActions}>Edit / delete</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((f) => {
              const line = f.amount * f.price;
              const templateRow = isTemplateRow(f.id, templates);
              return (
                <tr key={f.id}>
                  <td style={tdName}>
                    {templateRow ? (
                      <span>{f.name}</span>
                    ) : (
                      <input
                        style={{ ...input, width: "100%", maxWidth: 220 }}
                        placeholder="Product name (custom)"
                        value={f.name}
                        onChange={(e) => updateLine(f.id, { name: e.target.value })}
                      />
                    )}
                  </td>
                  {templateRow ? (
                    <td style={tdMuted}>{f.unit ?? "—"}</td>
                  ) : (
                    <td style={{ ...td, verticalAlign: "top" }}>
                      <FertilizerUnitField
                        stableKey={f.id}
                        dense
                        value={f.unit ?? ""}
                        onChange={(unit) => updateLine(f.id, { unit })}
                      />
                    </td>
                  )}
                  <td style={td}>
                    <input
                      style={inputSm}
                      inputMode="decimal"
                      value={f.amount === 0 ? "" : String(f.amount)}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (v === "") {
                          updateLine(f.id, { amount: 0 });
                          return;
                        }
                        const n = Number.parseFloat(v);
                        updateLine(f.id, { amount: Number.isFinite(n) ? n : 0 });
                      }}
                      aria-label="Edit quantity"
                    />
                  </td>
                  <td style={td}>
                    <input
                      style={inputSm}
                      inputMode="decimal"
                      value={f.price === 0 ? "" : String(f.price)}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (v === "") {
                          updateLine(f.id, { price: 0 });
                          return;
                        }
                        const n = Number.parseFloat(v);
                        updateLine(f.id, { price: Number.isFinite(n) ? n : 0 });
                      }}
                      aria-label="Edit price per unit"
                    />
                  </td>
                  <td style={tdMuted}>₹{line.toFixed(2)}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <button
                      type="button"
                      style={dangerBtnGhost}
                      onClick={() => removeLine(f.id)}
                      aria-label="Delete line"
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
      {lines.length === 0 ? (
        <p style={fertHint}>
          No lines yet. Choose a product above, enter quantity, then “Add line”. You can edit qty and
          price in the table, or delete a line.
        </p>
      ) : null}
    </section>
  );
}

const card: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 20,
  marginBottom: 18,
};

const h2: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.05rem",
  fontWeight: 800,
};

const fertHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const fertHint: CSSProperties = {
  margin: 0,
  fontSize: "0.85rem",
  color: "var(--muted)",
  fontWeight: 600,
  maxWidth: 560,
};

const addFertToolbar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: 12,
  marginBottom: 14,
};

const btnOutlineSm: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 14px",
  background: "var(--surface)",
  fontWeight: 700,
  fontSize: "0.88rem",
  cursor: "pointer",
};

const pendingPanel: CSSProperties = {
  background: "var(--primary-soft)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "14px 16px",
  marginBottom: 16,
};

const pendingTitle: CSSProperties = {
  fontSize: "0.95rem",
  marginBottom: 10,
};

const pendingUnit: CSSProperties = { color: "var(--muted)", fontWeight: 600 };

const pendingGrid: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: 12,
};

const pendingActions: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const label: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "var(--muted)",
};

const labelSm: CSSProperties = {
  ...label,
  minWidth: 120,
};

const input: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fafafa",
};

const btnPrimarySm: CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.88rem",
};

const btnGhostSm: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 14px",
  background: "var(--surface)",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.88rem",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid var(--border)",
  color: "var(--muted)",
  fontWeight: 700,
};

const thActions: CSSProperties = {
  ...th,
  textAlign: "center",
  minWidth: 120,
};

const td: CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid var(--border)",
};

const tdName: CSSProperties = {
  ...td,
  fontWeight: 600,
};

const tdMuted: CSSProperties = {
  ...td,
  color: "var(--muted)",
  fontWeight: 600,
};

const inputSm: CSSProperties = {
  ...input,
  width: "100%",
  maxWidth: 120,
};

const dangerBtnGhost: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--danger)",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
  padding: "4px 6px",
};
