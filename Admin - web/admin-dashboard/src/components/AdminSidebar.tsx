import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { APP_COPYRIGHT, APP_ICON_ALT, APP_ICON_PATH, APP_NAME, APP_VERSION } from "../lib/branding";

type Props = {
  /** Controlled drawer state on narrow viewports (CSS applies slide-in). */
  mobileOpen?: boolean;
  /** Called after navigating — closes mobile drawer. */
  onNavigate?: () => void;
};

export function AdminSidebar({ mobileOpen = false, onNavigate }: Props) {
  const { signOutUser, profile } = useAuth();
  const emailLabel = profile?.email ?? "";
  const closeNav = () => onNavigate?.();

  return (
    <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="admin-sidebar-brand">
        <Link to="/" className="admin-brand-link" onClick={closeNav}>
          <img src={APP_ICON_PATH} alt={APP_ICON_ALT} width={40} height={40} className="admin-brand-logo" />
          <span className="admin-brand-title">{APP_NAME}</span>
        </Link>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Main">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/farmers/new"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          New farmer
        </NavLink>
        <NavLink
          to="/bank-docs"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Bank Docs
        </NavLink>

        <div className="admin-nav-group-label">Catalog</div>
        <NavLink
          to="/catalog/fertilizers"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Fertilizers
        </NavLink>
        <NavLink
          to="/catalog/pesticides"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Pesticides
        </NavLink>
        <NavLink
          to="/catalog/seeds"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Seeds
        </NavLink>
        <NavLink
          to="/catalog/csc-products"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          CSC Products
        </NavLink>
        <NavLink
          to="/catalog/crops"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Crops
        </NavLink>
        <NavLink
          to="/catalog/villages"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Villages / Mouza
        </NavLink>
        <NavLink
          to="/catalog/remarks"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Remark presets
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Users
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `admin-nav-link${isActive ? " is-active" : ""}`}
          onClick={closeNav}
        >
          Settings
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        {emailLabel ? (
          <span className="admin-sidebar-email" title={emailLabel}>
            {emailLabel}
          </span>
        ) : null}
        <button type="button" className="admin-sidebar-logout" onClick={() => void signOutUser()}>
          Sign out
        </button>
        <div className="admin-sidebar-meta">
          <span className="admin-sidebar-version">v{APP_VERSION}</span>
          <span className="admin-sidebar-copy">{APP_COPYRIGHT}</span>
        </div>
      </div>
    </aside>
  );
}
