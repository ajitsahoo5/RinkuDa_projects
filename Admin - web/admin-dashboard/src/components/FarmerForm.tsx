import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { FertilizerUnitField } from "./FertilizerUnitField";
import { duplicateFarmerMessage } from "../lib/farmerDuplicates";
import type { Farmer, FertilizerType } from "../types/farmer";
import { totalPrice } from "../types/farmer";

type Props = {
  mode: "create" | "edit";
  initial: Farmer | null;
  nextSlNo: number;
  /** All farmers from Firestore — used to block duplicate SL No / Aadhaar / mobile. */
  existingFarmers: Farmer[];
  /** Catalog lines (zeros) + legacy defaults merged in parent from Firestore catalog. */
  fertilizerTemplates: FertilizerType[];
  /** Crop names from live `settings/catalog.crops` (parent derives from subscription). */
  cropOptions: string[];
  onSubmit: (farmer: Farmer) => Promise<void>;
  onCancel: () => void;
};

function isoDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function dateOnlyToIso(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/** Quantities/prices carry over from farmer; product name/unit for catalogue IDs always come from `base`. */
function mergeFertilizers(base: FertilizerType[], fromFarmer: FertilizerType[]): FertilizerType[] {
  const byId = new Map(fromFarmer.map((f) => [f.id, f]));
  return base.map((b) => {
    const x = byId.get(b.id);
    return x ? { ...b, amount: x.amount, price: x.price } : { ...b };
  });
}

function appendExtrasFromFarmer(
  merged: FertilizerType[],
  fromFarmer: FertilizerType[],
): FertilizerType[] {
  const ids = new Set(merged.map((x) => x.id));
  const extras = fromFarmer.filter((f) => !ids.has(f.id));
  return [...merged, ...extras];
}

/** Catalogue-linked rows always show labels from Firestore fertilizer catalog — edit products under Fertilizers. */
function syncTemplateLabels(prev: FertilizerType[], templates: FertilizerType[]): FertilizerType[] {
  const tById = new Map(templates.map((t) => [t.id, t]));
  return prev.map((row) => {
    const t = tById.get(row.id);
    if (!t) return row;
    return { ...row, name: t.name, unit: t.unit ?? row.unit };
  });
}

function isTemplateRow(id: string, templates: FertilizerType[]): boolean {
  return templates.some((t) => t.id === id);
}

export function FarmerForm({
  mode,
  initial,
  nextSlNo,
  existingFarmers,
  fertilizerTemplates,
  cropOptions,
  onSubmit,
  onCancel,
}: Props) {
  const baseFerts = fertilizerTemplates;
  const [slNo, setSlNo] = useState(
    String(initial?.slNo ?? nextSlNo),
  );
  const [dateOfPurchase, setDateOfPurchase] = useState(
    isoDateOnly(initial?.dateOfPurchase ?? new Date().toISOString()),
  );
  const [landOwnerName, setLandOwnerName] = useState(initial?.landOwnerName ?? "");
  const [villageOrMouza, setVillageOrMouza] = useState(initial?.villageOrMouza ?? "");
  const [khataNo, setKhataNo] = useState(initial?.khataNo ?? "");
  const [area, setArea] = useState(initial != null && initial.area !== 0 ? String(initial.area) : "");
  const [farmerName, setFarmerName] = useState(initial?.farmerName ?? "");
  const [aadharNo, setAadharNo] = useState(initial?.aadharNo ?? "");
  const [mobileNo, setMobileNo] = useState(initial?.mobileNo ?? "");
  const [cropsName, setCropsName] = useState(initial?.cropsName ?? "");
  /** Lets the select show “Other” when the value is still empty but the user chose that option. */
  const [cropPickedOther, setCropPickedOther] = useState(() => {
    const t = (initial?.cropsName ?? "").trim();
    if (t === "") return false;
    return !cropOptions.includes(t);
  });
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [fertilizers, setFertilizers] = useState<FertilizerType[]>(() =>
    appendExtrasFromFarmer(
      mergeFertilizers(baseFerts, initial?.fertilizers ?? []),
      initial?.fertilizers ?? [],
    ),
  );
  const [addSku, setAddSku] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFertilizers((prev) => syncTemplateLabels(prev, fertilizerTemplates));
  }, [fertilizerTemplates]);

  const templatesNotYetAdded = useMemo(() => {
    const have = new Set(fertilizers.map((f) => f.id));
    return fertilizerTemplates.filter((t) => !have.has(t.id));
  }, [fertilizerTemplates, fertilizers]);

  const cropsSelectKey = useMemo(() => {
    const t = cropsName.trim();
    if (t === "") return cropPickedOther ? "__other__" : "";
    return cropOptions.includes(t) ? t : "__other__";
  }, [cropsName, cropOptions, cropPickedOther]);

  const computedTotal = useMemo(
    () =>
      totalPrice({
        id: "",
        slNo: 0,
        dateOfPurchase: "",
        landOwnerName: "",
        villageOrMouza: "",
        khataNo: "",
        area: 0,
        farmerName: "",
        aadharNo: "",
        mobileNo: "",
        cropsName: "",
        fertilizers,
        remarks: "",
      }),
    [fertilizers],
  );

  function updateFert(id: string, patch: Partial<FertilizerType>) {
    setFertilizers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  function appendTemplateRow(templateId: string) {
    const t = fertilizerTemplates.find((x) => x.id === templateId);
    if (!t) return;
    setFertilizers((prev) => {
      if (prev.some((x) => x.id === templateId)) return prev;
      return [...prev, { ...t, amount: 0, price: t.price }];
    });
    setAddSku("");
  }

  function appendCustomRow() {
    setFertilizers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        amount: 0,
        price: 0,
        unit: "kg",
      },
    ]);
  }

  function removeFert(id: string) {
    setFertilizers((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const sl = Number.parseInt(slNo.trim(), 10);
    if (!Number.isFinite(sl) || sl < 0) {
      setError("Serial number must be a valid number.");
      return;
    }
    const areaNum = Number.parseFloat(area.trim() || "0");
    if (!Number.isFinite(areaNum) || areaNum < 0) {
      setError("Land area must be a valid number.");
      return;
    }
    const tById = new Map(fertilizerTemplates.map((t) => [t.id, t]));
    const fertLines = fertilizers
      .map((x) => {
        const tpl = tById.get(x.id);
        if (tpl) {
          return {
            ...x,
            name: tpl.name.trim(),
            unit: (tpl.unit ?? "kg").trim(),
          };
        }
        return {
          ...x,
          name: x.name.trim(),
          unit: (x.unit ?? "").trim(),
        };
      })
      .filter((x) => x.name !== "");
    for (const x of fertLines) {
      if (!(x.unit ?? "").trim()) {
        setError(`"${x.name}" needs a unit.`);
        return;
      }
    }

    const farmer: Farmer = {
      id: initial?.id ?? crypto.randomUUID(),
      slNo: sl,
      dateOfPurchase: dateOnlyToIso(dateOfPurchase),
      landOwnerName: landOwnerName.trim(),
      villageOrMouza: villageOrMouza.trim(),
      khataNo: khataNo.trim(),
      area: areaNum,
      farmerName: farmerName.trim(),
      aadharNo: aadharNo.trim(),
      mobileNo: mobileNo.trim(),
      cropsName: cropsName.trim(),
      fertilizers: fertLines,
      remarks: remarks.trim(),
    };
    const dupMsg = duplicateFarmerMessage(
      existingFarmers,
      farmer,
      initial?.id ?? null,
    );
    if (dupMsg) {
      setError(dupMsg);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(farmer);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formWrap}>
      <div style={headerRow}>
        <h1 style={h1}>{mode === "create" ? "New farmer" : "Edit farmer"}</h1>
        <div style={actions}>
          <button type="button" onClick={onCancel} style={btnSecondary} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" style={btnPrimary} disabled={submitting}>
            {submitting ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={errBox} role="alert">
          {error}
        </div>
      ) : null}

      <section style={card}>
        <h2 style={h2}>Registration</h2>
        <div style={grid2}>
          <label style={label}>
            SL No
            <input
              required
              value={slNo}
              onChange={(e) => setSlNo(e.target.value)}
              style={input}
              inputMode="numeric"
            />
          </label>
          <label style={label}>
            Date of purchase
            <input
              type="date"
              required
              value={dateOfPurchase}
              onChange={(e) => setDateOfPurchase(e.target.value)}
              style={input}
            />
          </label>
          <label style={label}>
            Land owner name
            <input value={landOwnerName} onChange={(e) => setLandOwnerName(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Village / Mouza
            <input value={villageOrMouza} onChange={(e) => setVillageOrMouza(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Khata No
            <input value={khataNo} onChange={(e) => setKhataNo(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Area (acre)
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={input}
              inputMode="decimal"
            />
          </label>
          <label style={label}>
            Farmer name
            <input required value={farmerName} onChange={(e) => setFarmerName(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Aadhaar
            <input value={aadharNo} onChange={(e) => setAadharNo(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Mobile
            <input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} style={input} />
          </label>
          <label style={{ ...label, gridColumn: "1 / -1" }}>
            Crops
            <div style={cropPickStack}>
              <select
                className="farm-form-select"
                style={{ ...input, marginTop: 6, cursor: "pointer" }}
                value={cropsSelectKey}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setCropPickedOther(false);
                    setCropsName("");
                  } else if (v === "__other__") {
                    setCropPickedOther(true);
                    if (cropOptions.includes(cropsName.trim())) setCropsName("");
                  } else {
                    setCropPickedOther(false);
                    setCropsName(v);
                  }
                }}
              >
                <option value="">Select crop…</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__other__">Other (type below)</option>
              </select>
              {cropsSelectKey === "__other__" ? (
                <input
                  value={cropsName}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCropsName(next);
                    const nt = next.trim();
                    setCropPickedOther(nt === "" || !cropOptions.includes(nt));
                  }}
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Crop name(s)"
                />
              ) : null}
            </div>
          </label>
          <label style={{ ...label, gridColumn: "1 / -1" }}>
            Remarks
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} style={textarea} rows={3} />
          </label>
        </div>
      </section>

      <section style={card}>
        <div style={fertHeader}>
          <div>
            <h2 style={{ ...h2, marginBottom: 4 }}>Fertilizers</h2>
            <p style={fertHint}>
              Crop choices come from the{" "}
              <Link to="/catalog/crops" style={{ color: "var(--primary)", fontWeight: 800 }}>
                Crops
              </Link>{" "}
              catalog. Fertilizer names and units come from{" "}
              <Link to="/catalog/fertilizers" style={{ color: "var(--primary)", fontWeight: 800 }}>
                Fertilizers
              </Link>
              ; here you only set quantities and price per farmer.
            </p>
          </div>
          <span style={totalPill}>Total ₹{computedTotal.toFixed(2)}</span>
        </div>
        <div style={addFertToolbar}>
          <label style={{ ...label, margin: 0, minWidth: 200 }}>
            Add from catalog
            <select
              className="farm-form-select"
              style={{ ...input, marginTop: 6, cursor: "pointer" }}
              value={addSku}
              onChange={(e) => {
                const v = e.target.value;
                setAddSku(v);
                if (v) {
                  appendTemplateRow(v);
                }
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
          <div style={{ alignSelf: "end" }}>
            <button type="button" style={btnOutlineSm} onClick={appendCustomRow}>
              Custom item…
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Item</th>
                <th style={th}>Unit</th>
                <th style={th}>Qty</th>
                <th style={th}>₹ / unit</th>
                <th style={th}>Line total</th>
                <th style={thActions} aria-label="Remove row" />
              </tr>
            </thead>
            <tbody>
              {fertilizers.map((f) => {
                const line = f.amount * f.price;
                const templateRow = isTemplateRow(f.id, fertilizerTemplates);
                return (
                  <tr key={f.id}>
                    <td style={tdName}>
                      {templateRow ? (
                        <span>{f.name}</span>
                      ) : (
                        <input
                          style={{ ...input, width: "100%", maxWidth: 220 }}
                          placeholder="Product name (extra item)"
                          value={f.name}
                          onChange={(e) => updateFert(f.id, { name: e.target.value })}
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
                          onChange={(unit) => updateFert(f.id, { unit })}
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
                            updateFert(f.id, { amount: 0 });
                            return;
                          }
                          const n = Number.parseFloat(v);
                          updateFert(f.id, { amount: Number.isFinite(n) ? n : 0 });
                        }}
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
                            updateFert(f.id, { price: 0 });
                            return;
                          }
                          const n = Number.parseFloat(v);
                          updateFert(f.id, { price: Number.isFinite(n) ? n : 0 });
                        }}
                      />
                    </td>
                    <td style={tdMuted}>₹{line.toFixed(2)}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <button type="button" style={dangerBtnGhost} onClick={() => removeFert(f.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {fertilizers.length === 0 ? (
          <p style={fertHint}>No fertilizer lines yet. Add from catalog or choose “Custom item”.</p>
        ) : null}
      </section>
    </form>
  );
}

const cropPickStack: CSSProperties = {
  display: "grid",
  gap: 0,
  marginTop: 6,
};

const formWrap: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "24px 20px 48px",
};

const headerRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};

const h1: CSSProperties = {
  margin: 0,
  fontSize: "1.5rem",
  fontWeight: 800,
};

const h2: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.05rem",
  fontWeight: 800,
};

const actions: CSSProperties = {
  display: "flex",
  gap: 10,
};

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
  padding: "10px 18px",
  background: "var(--surface)",
  fontWeight: 600,
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

const card: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)",
  padding: 20,
  marginBottom: 18,
};

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
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

const textarea: CSSProperties = {
  ...input,
  resize: "vertical",
  minHeight: 72,
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
  maxWidth: 520,
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

const totalPill: CSSProperties = {
  background: "var(--primary-soft)",
  color: "var(--primary)",
  padding: "6px 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: "0.85rem",
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
  width: 88,
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
