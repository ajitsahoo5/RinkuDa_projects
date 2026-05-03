import type { CSSProperties } from "react";

/** Square icon button — primary / neutral (e.g. edit, copy). */
export const toolbarIconBtn: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 40,
  height: 40,
  padding: 0,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "#fafafa",
  color: "var(--primary)",
  cursor: "pointer",
  flexShrink: 0,
  boxSizing: "border-box",
};

/** Square icon button — destructive (delete / remove). */
export const toolbarIconDangerBtn: CSSProperties = {
  ...toolbarIconBtn,
  color: "var(--danger)",
  background: "var(--surface)",
  borderColor: "var(--danger-soft)",
};

/** Outline style for toolbar (e.g. sheet actions matching `btnOutline`). */
export const toolbarIconOutlineBtn: CSSProperties = {
  ...toolbarIconBtn,
  background: "var(--surface)",
  color: "var(--text)",
  fontWeight: 700,
};

export function IconEdit() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M15 3h6v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 21 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconSliders() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRotateCcw() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="m8 11 4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** Primary-filled icon button (e.g. confirm save). */
export const toolbarIconPrimaryBtn: CSSProperties = {
  ...toolbarIconBtn,
  background: "var(--primary)",
  color: "#fff",
  borderColor: "var(--primary)",
  boxShadow: "var(--shadow)",
};
