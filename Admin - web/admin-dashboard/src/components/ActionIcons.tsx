import type { CSSProperties } from "react";

/** Minimal 3D glass icon button. */
export const toolbarIconBtn: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 38,
  height: 38,
  padding: 0,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--glass-bg-strong)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
  boxSizing: "border-box",
  boxShadow: "var(--shadow-3d-sm)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease",
};

export const toolbarIconDangerBtn: CSSProperties = {
  ...toolbarIconBtn,
  color: "var(--danger)",
  background: "var(--danger-soft)",
  borderColor: "rgba(220, 38, 38, 0.2)",
};

export const toolbarIconOutlineBtn: CSSProperties = {
  ...toolbarIconBtn,
  color: "var(--text)",
};

export function IconEdit() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path
        d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconKeyReset() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12.5 12.5 21 21M15 9h4.5a1.5 1.5 0 0 1 0 3H17"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCopy() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2} />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconExternalLink() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M15 3h6v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 21 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconSliders() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M8 12h8M6 18h12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconX() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRotateCcw() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 3-7.1"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 4v4h4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDownload() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="m8 11 4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconSend() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m22 2-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const toolbarIconSentBtn: CSSProperties = {
  ...toolbarIconBtn,
  color: "var(--success)",
  background: "var(--success-soft)",
  borderColor: "rgba(5, 150, 105, 0.2)",
  cursor: "not-allowed",
  opacity: 1,
};

export const toolbarIconPrimaryBtn: CSSProperties = {
  ...toolbarIconBtn,
  background: "var(--accent-gradient)",
  color: "#fff",
  borderColor: "transparent",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px var(--accent-glow)",
};
