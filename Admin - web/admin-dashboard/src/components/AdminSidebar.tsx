import type { CSSProperties } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { APP_COPYRIGHT, APP_ICON_ALT, APP_ICON_PATH, APP_NAME, APP_VERSION } from "../lib/branding";

const navActive = (isActive: boolean): CSSProperties => ({
  ...navItem,
  background: isActive ? "var(--primary-soft)" : "transparent",
  color: isActive ? "var(--primary)" : "var(--text)",
});

export function AdminSidebar() {
  const { signOutUser, profile } = useAuth();
  const emailLabel = profile?.email ?? "";

  return (
    <aside style={aside}>
      <div style={brandBlock}>
        <Link to="/" style={brandLink}>
          <img src={APP_ICON_PATH} alt={APP_ICON_ALT} width={36} height={36} style={brandLogo} />
          <span style={brandTitle}>{APP_NAME}</span>
        </Link>
      </div>

      <nav style={navScroll} aria-label="Main">
        <NavLink to="/" end style={({ isActive }) => navActive(isActive)}>
          Dashboard
        </NavLink>
        <NavLink to="/farmers/new" style={({ isActive }) => navActive(isActive)}>
          New farmer
        </NavLink>

        <div style={navGroupLabel}>Catalog</div>
        <NavLink to="/catalog/fertilizers" style={({ isActive }) => navActive(isActive)}>
          Fertilizers
        </NavLink>
        <NavLink to="/catalog/pesticides" style={({ isActive }) => navActive(isActive)}>
          Pesticides
        </NavLink>
        <NavLink to="/catalog/seeds" style={({ isActive }) => navActive(isActive)}>
          Seeds
        </NavLink>
        <NavLink to="/catalog/csc-products" style={({ isActive }) => navActive(isActive)}>
          CSC Products
        </NavLink>
        <NavLink to="/catalog/crops" style={({ isActive }) => navActive(isActive)}>
          Crops
        </NavLink>
        <NavLink to="/catalog/remarks" style={({ isActive }) => navActive(isActive)}>
          Remark presets
        </NavLink>

        <NavLink to="/admin/users" style={({ isActive }) => navActive(isActive)}>
          Users
        </NavLink>
      </nav>

      <div style={sidebarFooter}>
        {emailLabel ? (
          <span style={footerEmail} title={emailLabel}>
            {emailLabel}
          </span>
        ) : null}
        <button type="button" style={logoutBtn} onClick={() => void signOutUser()}>
          Sign out
        </button>
        <div style={meta}>
          <span style={version}>v{APP_VERSION}</span>
          <span style={copy}>{APP_COPYRIGHT}</span>
        </div>
      </div>
    </aside>
  );
}

const aside: CSSProperties = {
  width: 260,
  minHeight: "100vh",
  flexShrink: 0,
  background: "var(--surface)",
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  position: "sticky",
  top: 0,
  alignSelf: "flex-start",
};

const brandBlock: CSSProperties = {
  padding: "16px 14px",
  borderBottom: "1px solid var(--border)",
};

const brandLink: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  color: "var(--text)",
};

const brandLogo: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  objectFit: "contain",
  border: "1px solid var(--border)",
  background: "#fff",
};

const brandTitle: CSSProperties = {
  fontWeight: 900,
  fontSize: "0.98rem",
  lineHeight: 1.25,
};

const navScroll: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const navItem: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "0.88rem",
};

const navGroupLabel: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--muted)",
  marginTop: 12,
  marginBottom: 4,
  paddingLeft: 8,
};

const sidebarFooter: CSSProperties = {
  padding: "14px 12px",
  borderTop: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const footerEmail: CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const logoutBtn: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#fff",
  fontWeight: 800,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const meta: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  paddingTop: 8,
};

const version: CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 800,
  color: "var(--muted)",
};

const copy: CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--muted)",
  lineHeight: 1.45,
};
