import type { CSSProperties, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

type Props = { children: ReactNode };

const layout: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  alignItems: "stretch",
};

const main: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "var(--bg)",
  display: "flex",
  flexDirection: "column",
};

export function AdminLayout({ children }: Props) {
  return (
    <div style={layout}>
      <AdminSidebar />
      <main style={main}>{children}</main>
    </div>
  );
}
