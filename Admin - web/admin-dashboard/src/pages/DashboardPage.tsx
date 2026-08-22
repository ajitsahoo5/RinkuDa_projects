import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  IconCheck,
  IconDownload,
  IconEdit,
  IconRotateCcw,
  IconSend,
  IconSliders,
  toolbarIconOutlineBtn,
  toolbarIconPrimaryBtn,
  toolbarIconBtn,
  toolbarIconSentBtn,
} from "../components/ActionIcons";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { markFarmerSentToBank } from "../lib/farmerCrud";
import {
  downloadFarmersListExcel,
  downloadFarmersListPdf,
  downloadFarmersListWord,
} from "../lib/exportFarmersList";
import {
  downloadSalesReportExcel,
  downloadSalesReportPdf,
  summarizeSalesReport,
} from "../lib/exportSalesReport";
import { type SalesDateFilter, type SalesDateMode } from "../lib/salesReportDates";
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
  const [salesDateMode, setSalesDateMode] = useState<SalesDateMode>("single");
  const [salesSingleDate, setSalesSingleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [salesFromDate, setSalesFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [salesToDate, setSalesToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sendingBankIds, setSendingBankIds] = useState<Set<string>>(() => new Set());

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

  async function onSendToBank(f: Farmer) {
    if (f.sentToBank || sendingBankIds.has(f.id)) return;
    const ok = window.confirm("Are you sure? The details will be added to bank Docs");
    if (!ok) return;
    setSendingBankIds((prev) => new Set(prev).add(f.id));
    try {
      await markFarmerSentToBank(f.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSendingBankIds((prev) => {
        const next = new Set(prev);
        next.delete(f.id);
        return next;
      });
    }
  }

  const canExport = !loading && !error && filtered.length > 0;

  const salesDateFilter: SalesDateFilter =
    salesDateMode === "single"
      ? { mode: "single", date: salesSingleDate }
      : { mode: "range", from: salesFromDate, to: salesToDate };

  const salesReportSummary = useMemo(
    () => summarizeSalesReport(farmers, salesDateFilter),
    [farmers, salesDateFilter],
  );

  const canExportSales = !loading && !error && salesReportSummary.lineCount > 0;

  function runSalesExport(kind: "excel" | "pdf") {
    try {
      if (salesDateMode === "range" && salesFromDate > salesToDate) {
        alert("From date must be on or before To date.");
        return;
      }
      if (kind === "excel") downloadSalesReportExcel(farmers, salesDateFilter);
      else downloadSalesReportPdf(farmers, salesDateFilter);
    } catch (e) {
      alert(String(e));
    }
  }

  return (
    <AdminLayout>
      <div style={page} className="page-responsive-padding">
        <div style={topGrid}>
          <div className="glass-stat" style={statCard}>
            <div style={statLabel}>Total farmers</div>
            <div style={statValue}>{stats.count}</div>
          </div>
          <div className="glass-stat" style={statCard}>
            <div style={statLabel}>Listed (filters)</div>
            <div style={statValue}>
              {stats.shown}
              <span style={statHint}> / {stats.count}</span>
            </div>
          </div>
          <div className="glass-stat" style={statCard}>
            <div style={statLabel}>Land (acre)</div>
            <div style={statValue}>{stats.totalAcres.toFixed(2)}</div>
          </div>
          <div className="glass-stat" style={statCard}>
            <div style={statLabel}>Inputs total (sum)</div>
            <div style={statValue}>₹{stats.totalInputsValue.toFixed(0)}</div>
          </div>
        </div>

        <section className="glass-panel" style={panel}>
          <div style={row}>
            <input
              className="glass-input"
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
              <span className="glass-btn-primary" style={btnPrimary}>New farmer</span>
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
        <section className="glass-panel" style={panel}>
          <div style={exportRow}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={exportTitle}>Download registry</div>
              <div style={exportHint}>
                Full record for each farmer (identity, land, crops, address, payment, all input lines, remarks,
                totals). Uses the current list — search and filters apply. PDF: one farmer per
                section; Word: .doc; Excel: .xlsx (one row per farmer with a separate column for each product
                holding the quantity — open in Excel, LibreOffice, or import in Google Sheets).
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

        <section className="glass-panel" style={panel}>
          <div style={exportRow}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={exportTitle}>Download sales report</div>
              <div style={exportHint}>
                Export product sales by purchase date — one row per unique product on each
                date with quantity, unit price, and line total.
              </div>
            </div>
          </div>
          <div style={salesModeRow}>
            <label style={radioLabel}>
              <input
                type="radio"
                name="salesDateMode"
                checked={salesDateMode === "single"}
                onChange={() => setSalesDateMode("single")}
              />
              Specific date
            </label>
            <label style={radioLabel}>
              <input
                type="radio"
                name="salesDateMode"
                checked={salesDateMode === "range"}
                onChange={() => setSalesDateMode("range")}
              />
              Date range
            </label>
          </div>
          {salesDateMode === "single" ? (
            <label style={dateFieldLabel}>
              Sale date
              <input
                type="date"
                className="glass-input"
                style={searchInput}
                value={salesSingleDate}
                onChange={(e) => setSalesSingleDate(e.target.value)}
              />
            </label>
          ) : (
            <div style={row}>
              <label style={{ ...dateFieldLabel, flex: 1 }}>
                From
                <input
                  type="date"
                  className="glass-input"
                  style={searchInput}
                  value={salesFromDate}
                  onChange={(e) => setSalesFromDate(e.target.value)}
                />
              </label>
              <label style={{ ...dateFieldLabel, flex: 1 }}>
                To
                <input
                  type="date"
                  className="glass-input"
                  style={searchInput}
                  value={salesToDate}
                  onChange={(e) => setSalesToDate(e.target.value)}
                />
              </label>
            </div>
          )}
          <div style={salesMetaRow}>
            <span style={muted}>
              {loading
                ? "Loading…"
                : `${salesReportSummary.farmerCount} buyer(s) · ${salesReportSummary.lineCount} product(s) sold · Total sales ₹${salesReportSummary.grossSale.toFixed(0)}`}
            </span>
            <div style={exportActions}>
              <button
                type="button"
                style={exportActionBtn}
                disabled={!canExportSales}
                aria-label="Download sales report Excel"
                title="Download sales report Excel"
                onClick={() => runSalesExport("excel")}
              >
                <IconDownload />
                <span>Excel</span>
              </button>
              <button
                type="button"
                style={exportActionBtn}
                disabled={!canExportSales}
                aria-label="Download sales report PDF"
                title="Download sales report PDF"
                onClick={() => runSalesExport("pdf")}
              >
                <IconDownload />
                <span>PDF</span>
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Farmer</th>
                  <th>Village</th>
                  <th>Area</th>
                  <th>Inputs ₹</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td>{f.slNo}</td>
                    <td className="strong">{f.farmerName}</td>
                    <td>{f.villageOrMouza || "—"}</td>
                    <td>{f.area}</td>
                    <td>₹{totalPrice(f).toFixed(0)}</td>
                    <td className="actions-cell">
                      <div className="actions-cell-inner">
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
                        style={
                          f.sentToBank
                            ? toolbarIconSentBtn
                            : sendingBankIds.has(f.id)
                              ? { ...toolbarIconBtn, opacity: 0.6, cursor: "wait" }
                              : toolbarIconBtn
                        }
                        aria-label={
                          f.sentToBank
                            ? `${f.farmerName} added to bank docs`
                            : `Send ${f.farmerName} to bank`
                        }
                        title={f.sentToBank ? "Added to bank docs" : "Send to bank"}
                        disabled={f.sentToBank || sendingBankIds.has(f.id)}
                        onClick={() => void onSendToBank(f)}
                      >
                        {f.sentToBank ? <IconCheck /> : <IconSend />}
                      </button>
                      </div>
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
      <div className="glass-card" style={modal} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
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
  padding: "16px 16px 16px 20px",
};

const statLabel: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const statValue: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 900,
  background: "var(--primary-gradient)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const statHint: CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  color: "var(--muted)",
};

const panel: CSSProperties = {
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
};

const btnPrimary: CSSProperties = {
  display: "inline-block",
};

const chipRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
};

const chip: CSSProperties = {
  border: "1px solid var(--glass-border)",
  background: "rgba(255, 255, 255, 0.45)",
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
  borderRadius: 999,
};

const salesModeRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  marginTop: 12,
  marginBottom: 10,
};

const radioLabel: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const dateFieldLabel: CSSProperties = {
  display: "grid",
  gap: 6,
  fontWeight: 700,
  fontSize: "0.85rem",
  color: "var(--muted)",
  marginBottom: 10,
};

const salesMetaRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 4,
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

const footNote: CSSProperties = {
  marginTop: 20,
  fontSize: "0.9rem",
  color: "var(--muted)",
};

const modalBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(30, 27, 75, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 40,
};

const modal: CSSProperties = {
  padding: 22,
  width: "min(460px, 100%)",
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
