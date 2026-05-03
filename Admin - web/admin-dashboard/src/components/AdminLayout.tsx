import { useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { APP_NAME } from "../lib/branding";

type Props = { children: ReactNode };

const MQ_MOBILE = "(max-width: 900px)";

export function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MQ_MOBILE).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MQ_MOBILE);
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setSidebarOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isMobile]);

  return (
    <div className="admin-layout">
      {sidebarOpen && isMobile ? (
        <div
          className="admin-sidebar-backdrop"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <AdminSidebar mobileOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="admin-layout-body">
        <header className="admin-mobile-header">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span className="admin-mobile-menu-icon" aria-hidden />
          </button>
          <span className="admin-mobile-header-title">{APP_NAME}</span>
        </header>
        <main className="admin-layout-main">{children}</main>
      </div>
    </div>
  );
}
