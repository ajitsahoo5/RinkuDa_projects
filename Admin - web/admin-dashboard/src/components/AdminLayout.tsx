import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

type Props = { children: ReactNode };

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateRows: "auto 1fr",
};

const header: React.CSSProperties = {
  background: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  boxShadow: "var(--shadow)",
};

const headerInner: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const brand: React.CSSProperties = {
  fontWeight: 900,
  fontSize: "1.05rem",
  textDecoration: "none",
  color: "var(--text)",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const navLinkStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "0.9rem",
  color: "var(--muted)",
};

export function AdminLayout({ children }: Props) {
  return (
    <div style={shell}>
      <header style={header}>
        <div style={headerInner}>
          <Link to="/" style={brand}>
            Farmer Registry — Admin
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
          </nav>
        </div>
      </header>
      <main style={{ background: "var(--bg)" }}>{children}</main>
    </div>
  );
}
