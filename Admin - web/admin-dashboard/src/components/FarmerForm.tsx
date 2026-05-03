import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { FarmerCatalogSection } from "./FarmerCatalogSection";
import { duplicateFarmerMessage } from "../lib/farmerDuplicates";
import type { Farmer, FertilizerType } from "../types/farmer";
import { totalPrice } from "../types/farmer";

type Props = {
  mode: "create" | "edit";
  initial: Farmer | null;
  nextSlNo: number;
  existingFarmers: Farmer[];
  fertilizerTemplates: FertilizerType[];
  pesticideTemplates: FertilizerType[];
  seedTemplates: FertilizerType[];
  cscProductTemplates: FertilizerType[];
  cropOptions: string[];
  remarkPresetOptions: string[];
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

function mergeWithTemplates(base: FertilizerType[], fromFarmer: FertilizerType[]): FertilizerType[] {
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

function initLines(
  templates: FertilizerType[],
  saved: FertilizerType[] | undefined,
): FertilizerType[] {
  return appendExtrasFromFarmer(mergeWithTemplates(templates, saved ?? []), saved ?? []);
}

function syncTemplateLabels(prev: FertilizerType[], templates: FertilizerType[]): FertilizerType[] {
  const tById = new Map(templates.map((t) => [t.id, t]));
  return prev.map((row) => {
    const t = tById.get(row.id);
    if (!t) return row;
    return { ...row, name: t.name, unit: t.unit ?? row.unit };
  });
}

function finalizeLines(lines: FertilizerType[], templates: FertilizerType[]): FertilizerType[] {
  const tById = new Map(templates.map((t) => [t.id, t]));
  return lines
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
}

export function FarmerForm({
  mode,
  initial,
  nextSlNo,
  existingFarmers,
  fertilizerTemplates,
  pesticideTemplates,
  seedTemplates,
  cscProductTemplates,
  cropOptions,
  remarkPresetOptions,
  onSubmit,
  onCancel,
}: Props) {
  const [slNo, setSlNo] = useState(String(initial?.slNo ?? nextSlNo));
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
  const [cropPickedOther, setCropPickedOther] = useState(() => {
    const t = (initial?.cropsName ?? "").trim();
    if (t === "") return false;
    return !cropOptions.includes(t);
  });
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [remarkPickedOther, setRemarkPickedOther] = useState(() => {
    const t = (initial?.remarks ?? "").trim();
    if (t === "") return false;
    return !remarkPresetOptions.includes(t);
  });
  const [fertilizers, setFertilizers] = useState<FertilizerType[]>(() =>
    initLines(fertilizerTemplates, initial?.fertilizers),
  );
  const [pesticides, setPesticides] = useState<FertilizerType[]>(() =>
    initLines(pesticideTemplates, initial?.pesticides),
  );
  const [seeds, setSeeds] = useState<FertilizerType[]>(() =>
    initLines(seedTemplates, initial?.seeds),
  );
  const [cscProducts, setCscProducts] = useState<FertilizerType[]>(() =>
    initLines(cscProductTemplates, initial?.cscProducts),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFertilizers((prev) => syncTemplateLabels(prev, fertilizerTemplates));
  }, [fertilizerTemplates]);
  useEffect(() => {
    setPesticides((prev) => syncTemplateLabels(prev, pesticideTemplates));
  }, [pesticideTemplates]);
  useEffect(() => {
    setSeeds((prev) => syncTemplateLabels(prev, seedTemplates));
  }, [seedTemplates]);
  useEffect(() => {
    setCscProducts((prev) => syncTemplateLabels(prev, cscProductTemplates));
  }, [cscProductTemplates]);

  const cropsSelectKey = useMemo(() => {
    const t = cropsName.trim();
    if (t === "") return cropPickedOther ? "__other__" : "";
    return cropOptions.includes(t) ? t : "__other__";
  }, [cropsName, cropOptions, cropPickedOther]);

  const remarksSelectKey = useMemo(() => {
    const t = remarks.trim();
    if (t === "") return remarkPickedOther ? "__other__" : "";
    return remarkPresetOptions.includes(t) ? t : "__other__";
  }, [remarks, remarkPresetOptions, remarkPickedOther]);

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
        address: "",
        paymentRemark: "",
        fertilizers,
        pesticides,
        seeds,
        cscProducts,
        remarks: "",
      }),
    [fertilizers, pesticides, seeds, cscProducts],
  );

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

    const fertLines = finalizeLines(fertilizers, fertilizerTemplates);
    const pestLines = finalizeLines(pesticides, pesticideTemplates);
    const seedLines = finalizeLines(seeds, seedTemplates);
    const cscLines = finalizeLines(cscProducts, cscProductTemplates);

    const allForValidation = [...fertLines, ...pestLines, ...seedLines, ...cscLines];
    for (const x of allForValidation) {
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
      address: (initial?.address ?? "").trim(),
      paymentRemark: (initial?.paymentRemark ?? "").trim(),
      fertilizers: fertLines,
      pesticides: pestLines,
      seeds: seedLines,
      cscProducts: cscLines,
      remarks: remarks.trim(),
    };
    const dupMsg = duplicateFarmerMessage(existingFarmers, farmer, initial?.id ?? null);
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
          <label style={label}>
            Village / Mouza
            <input
              value={villageOrMouza}
              onChange={(e) => setVillageOrMouza(e.target.value)}
              style={input}
              autoComplete="address-level2"
            />
          </label>
          <label style={label}>
            Khata No
            <input value={khataNo} onChange={(e) => setKhataNo(e.target.value)} style={input} />
          </label>
          <label style={{ ...label, gridColumn: "1 / -1" }}>
            Remarks
            <p style={paymentHelp}>
              Presets from the{" "}
              <Link to="/catalog/remarks" style={{ color: "var(--primary)", fontWeight: 800 }}>
                Remark presets
              </Link>{" "}
              catalog.
            </p>
            <div style={cropPickStack}>
              <select
                className="farm-form-select"
                style={{ ...input, marginTop: 6, cursor: "pointer" }}
                value={remarksSelectKey}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setRemarkPickedOther(false);
                    setRemarks("");
                  } else if (v === "__other__") {
                    setRemarkPickedOther(true);
                    if (remarkPresetOptions.includes(remarks.trim())) setRemarks("");
                  } else {
                    setRemarkPickedOther(false);
                    setRemarks(v);
                  }
                }}
              >
                <option value="">Select remark…</option>
                {remarkPresetOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="__other__">Other (type below)</option>
              </select>
              {remarksSelectKey === "__other__" ? (
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    const next = e.target.value;
                    setRemarks(next);
                    const nt = next.trim();
                    setRemarkPickedOther(nt === "" || !remarkPresetOptions.includes(nt));
                  }}
                  style={{ ...textarea, marginTop: 10 }}
                  rows={3}
                  placeholder="Free-text remarks"
                />
              ) : null}
            </div>
          </label>
        </div>
      </section>

      <div style={totalSummary}>
        <span style={totalSummaryLabel}>Total (all inputs)</span>
        <span style={totalSummaryValue}>₹{computedTotal.toFixed(2)}</span>
      </div>

      <FarmerCatalogSection
        title="Fertilizers"
        intro={
          <>
            Pick a product from the list, enter quantity and price per unit, then add the line. Names and
            units come from the{" "}
            <Link to="/catalog/fertilizers" style={{ color: "var(--primary)", fontWeight: 800 }}>
              Fertilizers
            </Link>{" "}
            catalog. Edit qty or ₹/unit in the table; delete removes a line.
          </>
        }
        templates={fertilizerTemplates}
        lines={fertilizers}
        onLinesChange={setFertilizers}
      />

      <FarmerCatalogSection
        title="Pesticides"
        intro={
          <>
            Same flow as fertilizers. Manage products under{" "}
            <Link to="/catalog/pesticides" style={{ color: "var(--primary)", fontWeight: 800 }}>
              Pesticides
            </Link>
            .
          </>
        }
        templates={pesticideTemplates}
        lines={pesticides}
        onLinesChange={setPesticides}
      />

      <FarmerCatalogSection
        title="Seeds"
        intro={
          <>
            Seed SKUs from the{" "}
            <Link to="/catalog/seeds" style={{ color: "var(--primary)", fontWeight: 800 }}>
              Seeds
            </Link>{" "}
            catalog.
          </>
        }
        templates={seedTemplates}
        lines={seeds}
        onLinesChange={setSeeds}
      />

      <FarmerCatalogSection
        title="CSC Products"
        intro={
          <>
            Products from the{" "}
            <Link to="/catalog/csc-products" style={{ color: "var(--primary)", fontWeight: 800 }}>
              CSC Products
            </Link>{" "}
            catalog.
          </>
        }
        templates={cscProductTemplates}
        lines={cscProducts}
        onLinesChange={setCscProducts}
      />
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

const paymentHelp: CSSProperties = {
  margin: "4px 0 8px",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--muted)",
  lineHeight: 1.45,
};

const totalSummary: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 18px",
  marginBottom: 18,
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--primary-soft)",
};

const totalSummaryLabel: CSSProperties = {
  fontWeight: 800,
  fontSize: "0.95rem",
};

const totalSummaryValue: CSSProperties = {
  fontWeight: 900,
  fontSize: "1.1rem",
  color: "var(--primary)",
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
  fontFamily: "inherit",
};
