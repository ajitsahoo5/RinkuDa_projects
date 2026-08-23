import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { GlassBanner, GlassToast } from "../components/GlassAlert";
import { AdminLayout } from "../components/AdminLayout";
import { useAppSettings } from "../hooks/useAppSettings";
import { saveAppSettings } from "../lib/appSettingsCrud";

export function AppSettingsPage() {
  const { settings, loading, error } = useAppSettings();
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setAddress(settings.address ?? "");
    setGstNumber(settings.gstNumber ?? "");
    setMobileNumber(settings.mobileNumber ?? "");
  }, [settings.address, settings.gstNumber, settings.mobileNumber]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await saveAppSettings({
        address: address.trim() || null,
        gstNumber: gstNumber.trim() || null,
        mobileNumber: mobileNumber.trim() || null,
      });
      setToast("Settings saved.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page-responsive-padding">
      <header style={pageHeader}>
        <h1 style={h1}>Organization settings</h1>
        <p style={lead}>
          Address, GST, and mobile appear on invoices and exports. Stored in the registry API{" "}
          <code style={code}>settings/app</code> (mobile app can read the same values).
        </p>
      </header>

      {error ? <GlassBanner variant="error">{error}</GlassBanner> : null}
      {formError ? <GlassBanner variant="error">{formError}</GlassBanner> : null}

      {loading ? (
        <p style={muted}>Loading settings…</p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="glass-panel" style={formCard}>
          <label style={label}>
            Address
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              placeholder="At/Po. Pendraban, Dist. …, Pin …"
              style={textarea}
            />
          </label>

          <label style={label}>
            GST number
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. 21AABAB1923D2ZN"
              style={input}
              autoComplete="off"
            />
          </label>

          <label style={label}>
            Mobile number
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. 9337755725"
              style={input}
              autoComplete="tel"
            />
          </label>

          <div style={actions}>
            <button type="submit" className="glass-btn-primary" style={saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      )}

      {toast ? <GlassToast message={toast} onClose={() => setToast(null)} /> : null}
      </div>
    </AdminLayout>
  );
}

const pageHeader: CSSProperties = { marginBottom: 20 };
const h1: CSSProperties = { margin: 0, fontSize: "1.45rem", fontWeight: 900 };
const lead: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: "0.92rem",
  lineHeight: 1.5,
  maxWidth: 640,
};
const code: CSSProperties = {
  fontSize: "0.85em",
  background: "rgba(255, 255, 255, 0.08)",
  padding: "1px 5px",
  borderRadius: 4,
};
const formCard: CSSProperties = {
  maxWidth: 520,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 22,
};
const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontWeight: 800,
  fontSize: "0.88rem",
};
const input: CSSProperties = {
  padding: "10px 12px",
  fontSize: "0.95rem",
  fontWeight: 600,
};
const textarea: CSSProperties = { ...input, resize: "vertical", minHeight: 96, fontFamily: "inherit" };
const actions: CSSProperties = { marginTop: 4 };
const saveBtn: CSSProperties = {
  cursor: "pointer",
};
const muted: CSSProperties = { color: "var(--muted)", fontWeight: 600 };
