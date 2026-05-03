import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  IconCheck,
  IconDownload,
  IconEdit,
  IconRotateCcw,
  IconSliders,
  IconTrash,
  toolbarIconDangerBtn,
  toolbarIconOutlineBtn,
  toolbarIconPrimaryBtn,
  toolbarIconBtn,
} from "../components/ActionIcons";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { deleteFarmer } from "../lib/farmerCrud";
import {
  downloadFarmersListExcel,
  downloadFarmersListPdf,
  downloadFarmersListWord,
} from "../lib/exportFarmersList";
import type { Farmer } from "../types/farmer";
import { filterEmpty, totalPrice, type FarmerFilter } from "../types/farmer";

function matchesQuery(f: Farmer, q: string): boolean {
  if (!q) return true;
  const ql = q.toLowerCase();
  return (
    f.farmerName.toLowerCase().includes(ql) ||
    f.landOwnerName.toLowerCase().includes(ql) ||
    f.aadharNo.toLowerCase().includes(ql) ||
    f.khataNo.toLowerCase().includes(ql) ||
    f.villageOrMouza.toLowerCase().includes(ql) ||
    f.mobileNo.toLowerCase().includes(ql) ||
    f.cropsName.toLowerCase().includes(ql) ||
    f.address.toLowerCase().includes(ql) ||
    f.paymentRemark.toLowerCase().includes(ql) ||
    f.remarks.toLowerCase().includes(ql)
  );
}

function matchesFilter(f: Farmer, filter: FarmerFilter): boolean {
  if (filterEmpty(filter)) return true;
  const moujaOk =
    filter.mouja == null || filter.mouja.trim() === ""
      ? true
      : f.villageOrMouza.toLowerCase() === filter.mouja.trim().toLowerCase();
  const minOk = filter.minAcre == null ? true : f.area >= filter.minAcre;
  const maxOk = filter.maxAcre == null ? true : f.area <= filter.maxAcre;
  return moujaOk && minOk && maxOk;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { farmers, loading, error } = useFarmers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FarmerFilter>({
    mouja: null,
    minAcre: null,
    maxAcre: null,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return farmers.filter((f) => matchesQuery(f, q) && matchesFilter(f, filter));
  }, [farmers, search, filter]);

  const stats = useMemo(() => {
    const totalAcres = farmers.reduce((s, f) => s + f.area, 0);
    const totalInputsValue = farmers.reduce((s, f) => s + totalPrice(f), 0);
    return {
      count: farmers.length,
      shown: filtered.length,
      totalAcres,
      totalInputsValue,
    };
  }, [farmers, filtered]);

  const nextSlNo = useMemo(() => {
    if (farmers.length === 0) return 1;
    return Math.max(...farmers.map((f) => f.slNo)) + 1;
  }, [farmers]);

  async function onDelete(f: Farmer) {
    const ok = window.confirm(`Delete "${f.farmerName}" permanently?`);
    if (!ok) return;
    await deleteFarmer(f.id);
  }

  const canExport = !loading && !error && filtered.length > 0;

  return (
    <AdminLayout>
      <div style={page} className="page-responsive-padding">
        <div style={topGrid}>
          <div style={statCard}>
            <div style={statLabel}>Total farmers</div>
            <div style={statValue}>{stats.count}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Listed (filters)</div>
            <div style={statValue}>
              {stats.shown}
              <span style={statHint}> / {stats.count}</span>
            </div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Land (acre)</div>
            <div style={statValue}>{stats.totalAcres.toFixed(2)}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Inputs total (sum)</div>
            <div style={statValue}>₹{stats.totalInputsValue.toFixed(0)}</div>
          </div>
        </div>

        <section style={panel}>
          <div style={row}>
            <input
              style={searchInput}
              placeholder="Search by name, Aadhaar, khata, village, mobile, crops…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              style={toolbarIconOutlineBtn}
              aria-label="Open filters"
              title="Filters"
              onClick={() => setFilterOpen(true)}
            >
              <IconSliders />
            </button>
            <Link to="/farmers/new" style={{ textDecoration: "none" }}>
              <span style={btnPrimary}>New farmer</span>
            </Link>
          </div>
          <div style={chipRow}>
            {search.trim() ? (
              <button type="button" style={chip} onClick={() => setSearch("")}>
                Clear search ×
              </button>
            ) : null}
            {!filterEmpty(filter) ? (
              <button
                type="button"
                style={chip}
                onClick={() => setFilter({ mouja: null, minAcre: null, maxAcre: null })}
              >
                Clear filters ×
              </button>
            ) : null}
          </div>
        </section>

        {/* Google Sheet link UI removed — use PDF / Word export below. `googleSheetLink` in Firestore may still be used by the mobile app. */}
        <section style={panel}>
          <div style={exportRow}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={exportTitle}>Download registry</div>
              <div style={exportHint}>
                Full record for each farmer (identity, land, crops, address, payment, all input lines, remarks,
                totals). Uses the current list — search and filters apply. PDF: one farmer per
                section; Word: .doc; Excel: .xlsx (one row per farmer — open in Excel, LibreOffice, or import in
                Google Sheets).
              </div>
            </div>
            <div style={exportActions}>
              <button
                type="button"
                style={exportActionBtn}
                disabled={!canExport}
                aria-label="Download PDF"
                title="Download PDF"
                onClick={() => {
                  try {
                    downloadFarmersListPdf(filtered);
                  } catch (e) {
                    alert(String(e));
                  }
                }}
              >
                <IconDownload />
                <span>PDF</span>
              </button>
              <button
                type="button"
                style={exportActionBtn}
                disabled={!canExport}
                aria-label="Download Word document"
                title="Download Word (.doc)"
                onClick={() => {
                  try {
                    downloadFarmersListWord(filtered);
                  } catch (e) {
                    alert(String(e));
                  }
                }}
              >
                <IconDownload />
                <span>Word</span>
              </button>
              <button
                type="button"
                style={exportActionBtn}
                disabled={!canExport}
                aria-label="Download Excel spreadsheet"
                title="Download Excel (.xlsx)"
                onClick={() => {
                  try {
                    downloadFarmersListExcel(filtered);
                  } catch (e) {
                    alert(String(e));
                  }
                }}
              >
                <IconDownload />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <p style={muted}>Loading farmers…</p>
        ) : error ? (
          <div style={errPanel}>
            <strong>Couldn’t load Firestore</strong>
            <pre style={pre}>{error}</pre>
          </div>
        ) : filtered.length === 0 ? (
          <div style={empty}>
            <p>No farmers match the current search or filters.</p>
            <Link to="/farmers/new">Create a farmer</Link>
          </div>
        ) : (
          <div className="touch-scroll">
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>SL</th>
                  <th style={th}>Farmer</th>
                  <th style={th}>Village</th>
                  <th style={th}>Area</th>
                  <th style={th}>Inputs ₹</th>
                  <th style={thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td style={td}>{f.slNo}</td>
                    <td style={tdStrong}>{f.farmerName}</td>
                    <td style={td}>{f.villageOrMouza || "—"}</td>
                    <td style={td}>{f.area}</td>
                    <td style={td}>₹{totalPrice(f).toFixed(0)}</td>
                    <td style={farmerActionsCell}>
                      <button
                        type="button"
                        style={toolbarIconBtn}
                        aria-label={`Edit farmer ${f.farmerName}`}
                        title="Edit farmer"
                        onClick={() => navigate(`/farmers/${f.id}/edit`)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        style={toolbarIconDangerBtn}
                        aria-label={`Delete farmer ${f.farmerName}`}
                        title="Delete farmer"
                        onClick={() => void onDelete(f)}
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

        <p style={footNote}>
          Next serial number when creating a record: <strong>{nextSlNo}</strong>
        </p>
      </div>

      {filterOpen ? (
        <FilterModal
          initial={filter}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => {
            setFilter(f);
            setFilterOpen(false);
          }}
        />
      ) : null}

    </AdminLayout>
  );
}

function FilterModal({
  initial,
  onClose,
  onApply,
}: {
  initial: FarmerFilter;
  onClose: () => void;
  onApply: (f: FarmerFilter) => void;
}) {
  const [mouja, setMouja] = useState(initial.mouja ?? "");
  const [minAcre, setMinAcre] = useState(initial.minAcre != null ? String(initial.minAcre) : "");
  const [maxAcre, setMaxAcre] = useState(initial.maxAcre != null ? String(initial.maxAcre) : "");

  return (
    <div style={modalBackdrop} role="presentation" onClick={onClose}>
      <div style={modal} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h2 style={modalH2}>Filters</h2>
        <label style={lbl}>
          Mouza (exact match, case-insensitive)
          <input style={searchInput} value={mouja} onChange={(e) => setMouja(e.target.value)} />
        </label>
        <div style={row}>
          <label style={{ ...lbl, flex: 1 }}>
            Min land (acre)
            <input style={searchInput} value={minAcre} onChange={(e) => setMinAcre(e.target.value)} />
          </label>
          <label style={{ ...lbl, flex: 1 }}>
            Max land (acre)
            <input style={searchInput} value={maxAcre} onChange={(e) => setMaxAcre(e.target.value)} />
          </label>
        </div>
        <div style={modalActions}>
          <button
            type="button"
            style={toolbarIconOutlineBtn}
            aria-label="Clear all filters"
            title="Clear filters"
            onClick={() => onApply({ mouja: null, minAcre: null, maxAcre: null })}
          >
            <IconRotateCcw />
          </button>
          <button
            type="button"
            style={toolbarIconPrimaryBtn}
            aria-label="Apply filters"
            title="Apply"
            onClick={() => {
              const minV = minAcre.trim() === "" ? null : Number.parseFloat(minAcre);
              const maxV = maxAcre.trim() === "" ? null : Number.parseFloat(maxAcre);
              onApply({
                mouja: mouja.trim() || null,
                minAcre: minV != null && Number.isFinite(minV) ? minV : null,
                maxAcre: maxV != null && Number.isFinite(maxV) ? maxV : null,
              });
            }}
          >
            <IconCheck />
          </button>
        </div>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "24px 20px 48px",
};

const topGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const statCard: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 16,
};

const statLabel: CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: 6,
};

const statValue: CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 900,
};

const statHint: CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  color: "var(--muted)",
};

const panel: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 16,
  marginBottom: 16,
};

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const searchInput: CSSProperties = {
  flex: "1 1 220px",
  minWidth: 180,
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fafafa",
};

const btnPrimary: CSSProperties = {
  display: "inline-block",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow)",
};

const chipRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
};

const chip: CSSProperties = {
  border: "1px dashed var(--border)",
  background: "#f8fafc",
  borderRadius: 999,
  padding: "6px 12px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const exportRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const exportActions: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

const exportTitle: CSSProperties = {
  fontWeight: 800,
  marginBottom: 4,
};

const exportHint: CSSProperties = {
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: "0.9rem",
  lineHeight: 1.45,
};

const exportActionBtn: CSSProperties = {
  ...toolbarIconOutlineBtn,
  width: "auto",
  minWidth: 40,
  height: 40,
  padding: "0 14px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  fontSize: "0.9rem",
};

const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };

const errPanel: CSSProperties = {
  background: "var(--danger-soft)",
  color: "var(--danger)",
  padding: 16,
  borderRadius: 10,
  marginBottom: 16,
};

const pre: CSSProperties = {
  whiteSpace: "pre-wrap",
  fontSize: "0.85rem",
  margin: "8px 0 0",
};

const empty: CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "var(--muted)",
  fontWeight: 600,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  overflow: "hidden",
  border: "1px solid var(--border)",
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  background: "#f1f5f9",
  fontSize: "0.8rem",
  color: "var(--muted)",
  fontWeight: 800,
  borderBottom: "1px solid var(--border)",
};

const thRight: CSSProperties = { ...th, textAlign: "right" };

const td: CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid var(--border)",
  fontSize: "0.92rem",
};

const tdStrong: CSSProperties = { ...td, fontWeight: 800 };

const farmerActionsCell: CSSProperties = {
  ...td,
  textAlign: "right",
  whiteSpace: "nowrap",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "flex-end",
  alignItems: "center",
};

const footNote: CSSProperties = {
  marginTop: 20,
  fontSize: "0.9rem",
  color: "var(--muted)",
};

const modalBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 40,
};

const modal: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  padding: 22,
  width: "min(460px, 100%)",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

const modalH2: CSSProperties = { margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 900 };

const modalActions: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 16,
};

const lbl: CSSProperties = {
  display: "grid",
  gap: 6,
  fontWeight: 700,
  fontSize: "0.85rem",
  color: "var(--muted)",
  marginBottom: 10,
};
