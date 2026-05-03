import type { CSSProperties, ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { APP_ICON_ALT, APP_ICON_PATH, APP_NAME } from "../lib/branding";

type Props = { children: ReactNode };

const shell: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateRows: "auto 1fr",
};

const header: CSSProperties = {
  background: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  boxShadow: "var(--shadow)",
};

const headerInner: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const brand: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  color: "var(--text)",
};

const brandLogo: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  objectFit: "contain",
  flexShrink: 0,
  border: "1px solid var(--border)",
  background: "#fff",
};

const brandTitle: CSSProperties = {
  fontWeight: 900,
  fontSize: "1.05rem",
  lineHeight: 1.25,
};

const nav: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const navLinkStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "0.9rem",
  color: "var(--muted)",
};

const userBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const mutedEmail: CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--muted)",
  maxWidth: 200,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const logoutBtn: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "8px 14px",
  background: "#fff",
  fontWeight: 800,
  fontSize: "0.85rem",
  cursor: "pointer",
};

export function AdminLayout({ children }: Props) {
  const { signOutUser, profile } = useAuth();
  const emailLabel = profile?.email ?? "";

  return (
    <div style={shell}>
      <header style={header}>
        <div style={headerInner}>
          <Link to="/" style={brand}>
            <img src={APP_ICON_PATH} alt={APP_ICON_ALT} width={40} height={40} style={brandLogo} />
            <span style={brandTitle}>{APP_NAME}</span>
          </Link>
          <nav style={nav}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/farmers/new"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              New farmer
            </NavLink>
            <NavLink
              to="/catalog/fertilizers"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Fertilizers
            </NavLink>
            <NavLink
              to="/catalog/pesticides"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Pesticides
            </NavLink>
            <NavLink
              to="/catalog/csc-products"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              CSC Products
            </NavLink>
            <NavLink
              to="/catalog/seeds"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Seeds
            </NavLink>
            <NavLink
              to="/catalog/crops"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Crops
            </NavLink>
            <NavLink
              to="/admin/users"
              style={({ isActive }) => ({
                ...navLinkStyle,
                background: isActive ? "var(--primary-soft)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              })}
            >
              Users
            </NavLink>
          </nav>
          <div style={userBar}>
            {emailLabel ? (
              <span style={mutedEmail} title={emailLabel}>
                {emailLabel}
              </span>
            ) : null}
            <button type="button" style={logoutBtn} onClick={() => void signOutUser()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main style={{ background: "var(--bg)" }}>{children}</main>
    </div>
  );
}
