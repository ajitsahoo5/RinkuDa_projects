import { useMemo, type CSSProperties } from "react";
import { IconDownload, toolbarIconPrimaryBtn } from "../components/ActionIcons";
import { AdminLayout } from "../components/AdminLayout";
import { useAppSettings } from "../hooks/useAppSettings";
import { useAppUsers } from "../hooks/useAppUsers";
import { useFarmers } from "../hooks/useFarmers";
import { useSettingsCatalog } from "../hooks/useSettingsCatalog";
import { downloadDataRegistryExcel, summarizeDataRegistry } from "../lib/exportDataRegistry";
import { totalPrice } from "../types/farmer";

const cardStyle: CSSProperties = {
  padding: "1rem 1.1rem",
  borderRadius: 14,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

const statValueStyle: CSSProperties = {
  fontSize: "1.65rem",
  fontWeight: 800,
  lineHeight: 1.1,
  color: "var(--text)",
};

const statLabelStyle: CSSProperties = {
  marginTop: 6,
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 0.75rem",
  fontSize: "1.05rem",
  fontWeight: 800,
};

export function DataRegistryPage() {
  const { farmers, loading: farmersLoading, error: farmersError } = useFarmers();
  const catalog = useSettingsCatalog();
  const { users, loading: usersLoading, error: usersError } = useAppUsers();
  const { settings, loading: settingsLoading, error: settingsError } = useAppSettings();

  const loading = farmersLoading || catalog.loading || usersLoading || settingsLoading;
  const error = farmersError ?? catalog.error ?? usersError ?? settingsError;

  const stats = useMemo(
    () =>
      summarizeDataRegistry({
        farmers,
        fertilizers: catalog.fertilizers,
        pesticides: catalog.pesticides,
        seeds: catalog.seeds,
        cscProducts: catalog.cscProducts,
        crops: catalog.crops,
        villageMouzas: catalog.villageMouzas,
        remarkPresets: catalog.remarkPresets,
        users,
        appSettings: settings,
      }),
    [farmers, catalog, users, settings],
  );

  const totalInputValue = useMemo(
    () => farmers.reduce((sum, f) => sum + totalPrice(f), 0),
    [farmers],
  );

  const relationRows = useMemo(
    () => [
      {
        source: "farmers",
        type: "PostgreSQL table",
        links: "Main purchase records — one row per farmer",
        count: stats.farmers,
      },
      {
        source: "settings/catalog → fertilizers",
        type: "Catalog array",
        links: "farmers.fertilizers[] line items",
        count: stats.fertilizers,
      },
      {
        source: "settings/catalog → pesticides",
        type: "Catalog array",
        links: "farmers.pesticides[] line items",
        count: stats.pesticides,
      },
      {
        source: "settings/catalog → seeds",
        type: "Catalog array",
        links: "farmers.seeds[] line items",
        count: stats.seeds,
      },
      {
        source: "settings/catalog → cscProducts",
        type: "Catalog array",
        links: "farmers.cscProducts[] line items",
        count: stats.cscProducts,
      },
      {
        source: "settings/catalog → crops",
        type: "Lookup array",
        links: "farmers.cropsName dropdown",
        count: stats.crops,
      },
      {
        source: "settings/catalog → villageMouzas",
        type: "Lookup array",
        links: "farmers.villageOrMouza dropdown",
        count: stats.villages,
      },
      {
        source: "settings/catalog → remarkPresets",
        type: "Lookup array",
        links: "farmers.remarks presets",
        count: stats.remarks,
      },
      {
        source: "users",
        type: "PostgreSQL table",
        links: "Firebase Auth admin / client profiles (registry_users)",
        count: stats.users,
      },
      {
        source: "settings/app",
        type: "Single row",
        links: "Shared mobile + admin configuration",
        count: 1,
      },
    ],
    [stats],
  );

  function onDownloadExcel() {
    downloadDataRegistryExcel({
      farmers,
      fertilizers: catalog.fertilizers,
      pesticides: catalog.pesticides,
      seeds: catalog.seeds,
      cscProducts: catalog.cscProducts,
      crops: catalog.crops,
      villageMouzas: catalog.villageMouzas,
      remarkPresets: catalog.remarkPresets,
      users,
      appSettings: settings,
    });
  }

  return (
    <AdminLayout>
      <div className="glass-panel glass-panel--elevated" style={{ padding: "1.25rem 1.35rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800 }}>Data registry &amp; relations</h1>
            <p style={{ margin: "0.55rem 0 0", color: "var(--muted)", lineHeight: 1.55, maxWidth: 720 }}>
              View how farmers, catalog products, villages, crops, users, and settings connect.
              Download the Excel workbook to see every table on its own sheet — farmer product
              columns are grouped by category (Fertilizers, Pesticides, Seeds, CSC Products) for
              easy data entry.
            </p>
          </div>
          <button
            type="button"
            style={toolbarIconPrimaryBtn}
            onClick={onDownloadExcel}
            disabled={loading || !!error}
            title="Download full registry Excel (.xlsx)"
          >
            <IconDownload />
            Download Excel
          </button>
        </div>
      </div>

      {error ? (
        <div className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem", color: "#b91c1c", fontWeight: 700 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="glass-panel" style={{ padding: "1.25rem", color: "var(--muted)", fontWeight: 700 }}>
          Loading registry data…
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {[
              ["Farmers", stats.farmers],
              ["Fertilizers", stats.fertilizers],
              ["Pesticides", stats.pesticides],
              ["Seeds", stats.seeds],
              ["CSC products", stats.cscProducts],
              ["Crops", stats.crops],
              ["Villages", stats.villages],
              ["Remarks", stats.remarks],
              ["Users", stats.users],
            ].map(([label, value]) => (
              <div key={String(label)} style={cardStyle}>
                <div style={statValueStyle}>{value}</div>
                <div style={statLabelStyle}>{label}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div className="glass-panel" style={{ padding: "1.1rem 1.2rem" }}>
              <h2 style={sectionTitleStyle}>Registry totals</h2>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.7, color: "var(--text)" }}>
                <li>
                  <strong>{stats.farmers.toLocaleString("en-IN")}</strong> farmer records
                </li>
                <li>
                  <strong>
                    ₹{totalInputValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </strong>{" "}
                  total input value
                </li>
                <li>
                  <strong>{stats.fertilizers + stats.pesticides + stats.seeds + stats.cscProducts}</strong>{" "}
                  catalog SKUs across 4 product categories
                </li>
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: "1.1rem 1.2rem" }}>
              <h2 style={sectionTitleStyle}>Excel workbook sheets</h2>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.7, color: "var(--text)" }}>
                <li><strong>Overview</strong> — data map and entry instructions</li>
                <li><strong>Farmers</strong> — all rows with category-grouped product columns</li>
                <li><strong>Catalog — …</strong> — one sheet per product category</li>
                <li><strong>Crops, Villages, Remarks, Users, App settings</strong></li>
              </ul>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.1rem 1.2rem", marginBottom: "1rem" }}>
            <h2 style={sectionTitleStyle}>Data relationships</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Links to</th>
                    <th className="align-right">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {relationRows.map((row) => (
                    <tr key={row.source}>
                      <td className="strong">{row.source}</td>
                      <td>{row.type}</td>
                      <td>{row.links}</td>
                      <td className="align-right">{row.count.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.1rem 1.2rem" }}>
            <h2 style={sectionTitleStyle}>Product categories (catalog)</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Catalog table</th>
                    <th>Farmer field</th>
                    <th className="align-right">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Fertilizers", "catalog_fertilizers", "farmer_fertilizer_lines", stats.fertilizers],
                    ["Pesticides", "catalog_pesticides", "farmer_pesticide_lines", stats.pesticides],
                    ["Seeds", "catalog_seeds", "farmer_seed_lines", stats.seeds],
                    ["CSC Products", "catalog_csc_products", "farmer_csc_product_lines", stats.cscProducts],
                  ].map(([label, catalogField, farmerField, count]) => (
                    <tr key={String(label)}>
                      <td className="strong">{label}</td>
                      <td>{catalogField}</td>
                      <td>{farmerField}</td>
                      <td className="align-right">{Number(count).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
