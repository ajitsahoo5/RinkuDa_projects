import { useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import type { CSSProperties } from "react";

import {

  IconDownload,

  IconEdit,

  IconX,

  toolbarIconBtn,

  toolbarIconDangerBtn,

  toolbarIconOutlineBtn,

} from "../components/ActionIcons";

import { ConfirmDialog } from "../components/ConfirmDialog";
import { GlassAlert } from "../components/GlassAlert";
import { AdminLayout } from "../components/AdminLayout";

import { useFarmers } from "../hooks/useFarmers";

import { downloadBankDocsExcel } from "../lib/exportBankDocs";

import { removeFarmerFromBankDocs } from "../lib/farmerCrud";

import { formatPurchaseDate, formatReportDateTime } from "../lib/formatReportDate";

import {

  bankDocsFilterLabel,

  filterFarmersBySentToBankDate,

  type BankDocsDateFilter,

} from "../lib/salesReportDates";

import type { Farmer } from "../types/farmer";

import { totalPrice } from "../types/farmer";



type DateFilterMode = "all" | "single" | "range";



export function BankDocsPage() {

  const navigate = useNavigate();

  const { farmers, loading, error } = useFarmers();

  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  const [removeConfirmFarmer, setRemoveConfirmFarmer] = useState<Farmer | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("all");

  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));



  const bankFarmersAll = useMemo(

    () =>

      farmers

        .filter((f) => f.sentToBank)

        .sort((a, b) => {

          const ta = a.sentToBankAt ?? "";

          const tb = b.sentToBankAt ?? "";

          if (ta !== tb) return tb.localeCompare(ta);

          return a.slNo - b.slNo;

        }),

    [farmers],

  );



  const dateFilter: BankDocsDateFilter = useMemo(() => {

    if (dateFilterMode === "all") return { mode: "all" };

    if (dateFilterMode === "single") return { mode: "single", date: singleDate };

    return { mode: "range", from: fromDate, to: toDate };

  }, [dateFilterMode, singleDate, fromDate, toDate]);



  const filteredBankFarmers = useMemo(

    () => filterFarmersBySentToBankDate(bankFarmersAll, dateFilter),

    [bankFarmersAll, dateFilter],

  );



  const totalAmount = useMemo(

    () => filteredBankFarmers.reduce((s, f) => s + totalPrice(f), 0),

    [filteredBankFarmers],

  );



  const canExport = !loading && !error && filteredBankFarmers.length > 0;



  async function onRemoveFromBankDocs(f: Farmer) {
    if (removingIds.has(f.id)) return;
    setRemoveConfirmFarmer(f);
  }

  async function confirmRemoveFromBankDocs() {
    const f = removeConfirmFarmer;
    if (!f || removingIds.has(f.id)) {
      setRemoveConfirmFarmer(null);
      return;
    }
    setRemovingIds((prev) => new Set(prev).add(f.id));
    setRemoveConfirmFarmer(null);
    try {
      await removeFarmerFromBankDocs(f.id);
    } catch (e) {
      setAlertMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(f.id);
        return next;
      });
    }
  }

  function runExcelExport() {
    try {
      if (dateFilterMode === "range" && fromDate > toDate) {
        setAlertMessage("From date must be on or before To date.");
        return;
      }
      downloadBankDocsExcel(filteredBankFarmers, dateFilter);
    } catch (e) {
      setAlertMessage(e instanceof Error ? e.message : String(e));
    }
  }



  return (

    <AdminLayout>

      {alertMessage ? (
        <GlassAlert message={alertMessage} variant="error" onClose={() => setAlertMessage(null)} />
      ) : null}

      <div style={page} className="page-responsive-padding">

        <div style={headerRow}>

          <div>

            <h1 style={h1}>Bank Docs</h1>

            <p style={hint}>

              Farmers marked with <strong>Send to bank</strong> on the dashboard appear here. Remove

              only clears this list — the farmer stays on the dashboard and can be sent again.

            </p>

          </div>

          <div className="glass-stat" style={statPill}>

            <span style={statPillLabel}>Showing</span>

            <span style={statPillValue}>

              {loading ? "…" : filteredBankFarmers.length}

              {!loading && bankFarmersAll.length > 0 ? (

                <span style={statHint}> / {bankFarmersAll.length}</span>

              ) : null}

            </span>

          </div>

        </div>



        {!loading && !error ? (

          <section className="glass-panel" style={panel}>

            <div style={panelTitle}>Filter by sent date</div>

            <div style={exportHint}>

              Filter by the date each record was added to Bank Docs. Current filter:{" "}

              <strong>{bankDocsFilterLabel(dateFilter)}</strong>

            </div>

            <div style={filterToolbarRow}>

              <div style={filterModeRow} className="glass-radio-group">

                <label className="glass-radio-label">

                  <input

                    type="radio"

                    name="bankDocsDateMode"

                    checked={dateFilterMode === "all"}

                    onChange={() => setDateFilterMode("all")}

                  />

                  All dates

                </label>

                <label className="glass-radio-label">

                  <input

                    type="radio"

                    name="bankDocsDateMode"

                    checked={dateFilterMode === "single"}

                    onChange={() => setDateFilterMode("single")}

                  />

                  Specific date

                </label>

                <label className="glass-radio-label">

                  <input

                    type="radio"

                    name="bankDocsDateMode"

                    checked={dateFilterMode === "range"}

                    onChange={() => setDateFilterMode("range")}

                  />

                  Date range

                </label>

              </div>

              {dateFilterMode === "single" ? (

                <label style={inlineDateFieldLabel}>

                  Sent on

                  <input

                    type="date"

                    style={compactDateInput}

                  className="glass-input"

                    value={singleDate}

                    onChange={(e) => setSingleDate(e.target.value)}

                  />

                </label>

              ) : null}

              {dateFilterMode === "range" ? (

                <>

                  <label style={inlineDateFieldLabel}>

                    From

                    <input

                      type="date"

                      style={compactDateInput}

                  className="glass-input"

                      value={fromDate}

                      onChange={(e) => setFromDate(e.target.value)}

                    />

                  </label>

                  <label style={inlineDateFieldLabel}>

                    To

                    <input

                      type="date"

                      style={compactDateInput}

                  className="glass-input"

                      value={toDate}

                      onChange={(e) => setToDate(e.target.value)}

                    />

                  </label>

                </>

              ) : null}

              <button

                type="button"

                style={filterExcelBtn}

                disabled={!canExport}

                aria-label="Download bank docs Excel"

                title="Download Excel"

                onClick={runExcelExport}

              >

                <IconDownload />

                <span>Excel</span>

              </button>

            </div>

          </section>

        ) : null}



        {loading ? (

          <p style={muted}>Loading…</p>

        ) : error ? (

          <div style={errPanel}>

            <strong>Couldn’t load Firestore</strong>

            <pre style={pre}>{error}</pre>

          </div>

        ) : bankFarmersAll.length === 0 ? (

          <div style={empty}>

            <p>No farmers have been sent to bank yet.</p>

            <Link to="/">Back to dashboard</Link>

          </div>

        ) : filteredBankFarmers.length === 0 ? (

          <div style={empty}>

            <p>No bank docs records match the selected date filter.</p>

          </div>

        ) : (

          <>

            <div className="touch-scroll">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>SL</th>

                    <th>Farmer</th>

                    <th>Aadhaar</th>

                    <th>Mobile</th>

                    <th>Village</th>

                    <th>Khata</th>

                    <th>Purchase date</th>

                    <th>Amount ₹</th>

                    <th>Remarks</th>

                    <th>Sent on</th>

                    <th className="align-right">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredBankFarmers.map((f) => (

                    <tr key={f.id}>

                      <td>{f.slNo}</td>

                      <td className="strong">{f.farmerName}</td>

                      <td>{f.aadharNo || "—"}</td>

                      <td>{f.mobileNo || "—"}</td>

                      <td>{f.villageOrMouza || "—"}</td>

                      <td>{f.khataNo || "—"}</td>

                      <td>{formatPurchaseDate(f.dateOfPurchase)}</td>

                      <td>₹{totalPrice(f).toFixed(0)}</td>

                      <td>{f.remarks || "—"}</td>

                      <td>{formatReportDateTime(f.sentToBankAt)}</td>

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

                              removingIds.has(f.id)

                                ? { ...toolbarIconDangerBtn, opacity: 0.6, cursor: "wait" }

                                : toolbarIconDangerBtn

                            }

                            aria-label={`Remove ${f.farmerName} from bank docs`}

                            title="Remove from bank docs"

                            disabled={removingIds.has(f.id)}

                            onClick={() => void onRemoveFromBankDocs(f)}

                          >

                            <IconX />

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <p style={footNote}>

              Total amount (filtered): <strong>₹{totalAmount.toFixed(0)}</strong>

            </p>

          </>

        )}

      </div>

      {removeConfirmFarmer ? (
        <ConfirmDialog
          title="Remove from Bank Docs"
          message={`Remove "${removeConfirmFarmer.farmerName}" from Bank Docs? The farmer record will stay on the dashboard.`}
          confirmLabel="Remove"
          danger
          busy={removingIds.has(removeConfirmFarmer.id)}
          onConfirm={() => void confirmRemoveFromBankDocs()}
          onCancel={() => setRemoveConfirmFarmer(null)}
        />
      ) : null}

    </AdminLayout>

  );

}



const page: CSSProperties = {

  padding: "20px 24px 32px",

};



const headerRow: CSSProperties = {

  display: "flex",

  flexWrap: "wrap",

  alignItems: "flex-start",

  justifyContent: "space-between",

  gap: 16,

  marginBottom: 20,

};



const h1: CSSProperties = {

  margin: "0 0 6px",

  fontSize: "1.5rem",

  fontWeight: 900,

  color: "var(--text)",

};



const hint: CSSProperties = {

  margin: 0,

  color: "var(--muted)",

  fontWeight: 600,

  fontSize: "0.92rem",

  lineHeight: 1.45,

  maxWidth: 560,

};



const statPill: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "flex-end",

  gap: 4,

  padding: "12px 16px",

};



const statPillLabel: CSSProperties = {

  fontSize: "0.78rem",

  fontWeight: 700,

  color: "var(--muted)",

};



const statPillValue: CSSProperties = {

  fontSize: "1.35rem",

  fontWeight: 900,

  color: "var(--text)",

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



const panelTitle: CSSProperties = {

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



const filterToolbarRow: CSSProperties = {

  display: "flex",

  flexWrap: "nowrap",

  gap: 12,

  alignItems: "center",

  overflowX: "auto",

  marginTop: 10,

  paddingBottom: 2,

};



const filterModeRow: CSSProperties = {

  flexShrink: 0,

};



const inlineDateFieldLabel: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  gap: 8,

  fontWeight: 700,

  fontSize: "0.85rem",

  color: "var(--muted)",

  flexShrink: 0,

  whiteSpace: "nowrap",

};



const compactDateInput: CSSProperties = {

  fontWeight: 600,

};



const filterExcelBtn: CSSProperties = {

  ...exportActionBtn,

  marginLeft: "auto",

  flexShrink: 0,

  borderRadius: 999,

};



const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };



const errPanel: CSSProperties = {

  background: "var(--danger-soft)",

  color: "var(--danger)",

  padding: 16,

  borderRadius: 10,

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

  marginTop: 16,

  fontSize: "0.92rem",

  color: "var(--muted)",

  fontWeight: 600,

};


