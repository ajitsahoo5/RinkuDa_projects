import type { CSSProperties } from "react";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Props) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-controls" style={wrap}>
      <span style={meta}>
        Showing {start}–{end} of {totalItems}
      </span>
      <div style={btnRow}>
        <button
          type="button"
          className="glass-btn-secondary pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span style={pageLabel}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="glass-btn-secondary pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
};

const meta: CSSProperties = {
  fontSize: "0.88rem",
  fontWeight: 600,
  color: "var(--muted)",
};

const btnRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const pageLabel: CSSProperties = {
  fontSize: "0.88rem",
  fontWeight: 700,
  color: "var(--text)",
  minWidth: 96,
  textAlign: "center",
};
