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
  toolbarIconBtn,
  toolbarIconSentBtn,
} from "../components/ActionIcons";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GlassAlert } from "../components/GlassAlert";
import { GlassModal } from "../components/GlassModal";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../contexts/AuthContext";
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
  const { profile } = useAuth();
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
  const [sendConfirmFarmer, setSendConfirmFarmer] = useState<Farmer | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
    setSendConfirmFarmer(f);
  }

  async function confirmSendToBank() {
    const f = sendConfirmFarmer;
    if (!f || f.sentToBank || sendingBankIds.has(f.id)) {
      setSendConfirmFarmer(null);
      return;
    }
    setSendingBankIds((prev) => new Set(prev).add(f.id));
    setSendConfirmFarmer(null);
    try {
      await markFarmerSentToBank(f.id);
    } catch (e) {
      setAlertMessage(e instanceof Error ? e.message : String(e));
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

  function showAlert(message: string) {
    setAlertMessage(message);
  }

  function runSalesExport(kind: "excel" | "pdf") {
    try {
      if (salesDateMode === "range" && salesFromDate > salesToDate) {
        showAlert("From date must be on or before To date.");
        return;
      }
      if (kind === "excel") downloadSalesReportExcel(farmers, salesDateFilter);
      else downloadSalesReportPdf(farmers, salesDateFilter);
    } catch (e) {
      showAlert(String(e));
    }
  }

  const greetingName =
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0] ||
    "Admin";

  return (
    <AdminLayout>
      {alertMessage ? (
        <GlassAlert message={alertMessage} variant="error" onClose={() => setAlertMessage(null)} />
      ) : null}
      <div style={page} className="page-responsive-padding">
        <header className="dash-hero glass-panel">
          <div className="dash-hero-content">
            <p className="dash-hero-kicker">Overview</p>
            <h1 className="dash-hero-title">Hello, {greetingName}</h1>
            <p className="dash-hero-sub">
              {loading
                ? "Loading your registry…"
                : `${stats.count} farmers · ${stats.shown} in current view · ₹${stats.totalInputsValue.toFixed(0)} inputs`}
            </p>
          </div>
          <Link to="/farmers/new" className="glass-btn-primary dash-hero-cta">
            + New farmer
          </Link>
        </header>

        <div style={topGrid} className="top-grid-stats">
          <div className="glass-stat glass-stat--blue" style={statCard}>
            <div className="glass-stat-icon" aria-hidden>
              <IconUsers />
            </div>
            <div style={statLabel}>Total farmers</div>
            <div className="glass-stat-value">{stats.count}</div>
            <div className="glass-stat-trend">Registered</div>
          </div>
          <div className="glass-stat glass-stat--violet" style={statCard}>
            <div className="glass-stat-icon" aria-hidden>
              <IconList />
            </div>
            <div style={statLabel}>Listed</div>
            <div className="glass-stat-value">
              {stats.shown}
              <span className="glass-stat-hint"> / {stats.count}</span>
            </div>
            <div className="glass-stat-trend">Current view</div>
          </div>
          <div className="glass-stat glass-stat--teal" style={statCard}>
            <div className="glass-stat-icon" aria-hidden>
              <IconLand />
            </div>
            <div style={statLabel}>Land (acre)</div>
            <div className="glass-stat-value">{stats.totalAcres.toFixed(2)}</div>
            <div className="glass-stat-trend">Total acreage</div>
          </div>
          <div className="glass-stat glass-stat--rose" style={statCard}>
            <div className="glass-stat-icon" aria-hidden>
              <IconRupee />
            </div>
            <div style={statLabel}>Inputs total</div>
            <div className="glass-stat-value">₹{stats.totalInputsValue.toFixed(0)}</div>
            <div className="glass-stat-trend">All purchases</div>
          </div>
        </div>

        <section className="glass-panel glass-panel--elevated" style={panel}>
          <h2 className="section-head">Search &amp; filter</h2>
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
            <Link to="/farmers/new" style={{ textDecoration: "none" }} className="hide-mobile-new">
              <span className="glass-btn-primary" style={btnPrimary}>New farmer</span>
            </Link>
          </div>
          <div style={chipRow}>
            {search.trim() ? (
              <button type="button" className="glass-chip" style={chip} onClick={() => setSearch("")}>
                Clear search ×
              </button>
            ) : null}
            {!filterEmpty(filter) ? (
              <button
                type="button"
                className="glass-chip"
                style={chip}
                onClick={() => setFilter({ mouja: null, minAcre: null, maxAcre: null })}
              >
                Clear filters ×
              </button>
            ) : null}
          </div>
        </section>

        {/* Google Sheet link UI removed — use PDF / Word export below. `googleSheetLink` in Firestore may still be used by the mobile app. */}
        <section className="glass-panel glass-panel--elevated" style={panel}>
          <h2 className="section-head">Download registry</h2>
          <div style={exportRow}>
            <div style={{ flex: 1, minWidth: 200 }}>
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
                    showAlert(String(e));
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
                    showAlert(String(e));
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
                    showAlert(String(e));
                  }
                }}
              >
                <IconDownload />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel glass-panel--elevated" style={panel}>
          <h2 className="section-head">Sales report</h2>
          <div style={exportHint}>
            Export product sales by purchase date — one row per unique product on each
            date with quantity, unit price, and line total.
          </div>
          <div style={salesModeRow} className="glass-radio-group">
            <label className="glass-radio-label">
              <input
                type="radio"
                name="salesDateMode"
                checked={salesDateMode === "single"}
                onChange={() => setSalesDateMode("single")}
              />
              Specific date
            </label>
            <label className="glass-radio-label">
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
            <strong>Couldn’t load farmers</strong>
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

      {sendConfirmFarmer ? (
        <ConfirmDialog
          title="Send to bank"
          message={`Add "${sendConfirmFarmer.farmerName}" to Bank Docs?`}
          confirmLabel="Send"
          busy={sendingBankIds.has(sendConfirmFarmer.id)}
          onConfirm={() => void confirmSendToBank()}
          onCancel={() => setSendConfirmFarmer(null)}
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
    <GlassModal
      title="Filters"
      subtitle="Narrow the farmer list by mouza and land area."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="glass-btn-secondary"
            aria-label="Clear all filters"
            title="Clear filters"
            onClick={() => onApply({ mouja: null, minAcre: null, maxAcre: null })}
          >
            <IconRotateCcw />
            <span>Clear</span>
          </button>
          <button
            type="button"
            className="glass-btn-primary"
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
            <span>Apply</span>
          </button>
        </>
      }
    >
      <label className="glass-form-label">
        Mouza (exact match, case-insensitive)
        <input className="glass-input" style={searchInput} value={mouja} onChange={(e) => setMouja(e.target.value)} />
      </label>
      <div style={row}>
        <label className="glass-form-label" style={{ flex: 1 }}>
          Min land (acre)
          <input className="glass-input" style={searchInput} value={minAcre} onChange={(e) => setMinAcre(e.target.value)} />
        </label>
        <label className="glass-form-label" style={{ flex: 1 }}>
          Max land (acre)
          <input className="glass-input" style={searchInput} value={maxAcre} onChange={(e) => setMaxAcre(e.target.value)} />
        </label>
      </div>
    </GlassModal>
  );
}

const page: CSSProperties = {
  padding: "20px 24px 32px",
};

const topGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const statCard: CSSProperties = {
  padding: "18px 18px 16px",
};

const statLabel: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
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
  border: "none",
  background: "transparent",
  padding: 0,
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
  marginTop: 12,
  marginBottom: 10,
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

function IconUsers() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={2} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function IconLand() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 20h18M6 20V10l6-4 6 4v10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRupee() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3h12M6 8h12M6 8c0 6 5 8 12 8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
