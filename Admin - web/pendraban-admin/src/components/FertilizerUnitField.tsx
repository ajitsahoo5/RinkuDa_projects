import type { CSSProperties } from "react";
import { FERTILIZER_UNIT_PRESETS } from "../types/fertilizerCatalog";

const UNIT_OPTIONS = FERTILIZER_UNIT_PRESETS.filter((u) => u !== "other");

function presetMatch(unit: string): string | undefined {
  const lc = unit.trim().toLowerCase();
  return UNIT_OPTIONS.find((u) => u.toLowerCase() === lc);
}

type Props = {
  /** Optional prefix for accessibility / browser autofill segregation */
  stableKey?: string;
  value: string;
  onChange: (unit: string) => void;
  dense?: boolean;
};

/**
 * Dropdown of common units plus “Other…” with a text field — same behaviour on catalogue and farmer forms.
 */
export function FertilizerUnitField({ stableKey, value, onChange, dense }: Props) {
  const matched = presetMatch(value);

  const ctl: CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: dense ? "8px 10px" : "10px 12px",
    background: "#fafafa",
    fontSize: dense ? "0.88rem" : "0.93rem",
    width: "100%",
    boxSizing: "border-box",
    minWidth: dense ? 104 : undefined,
    maxWidth: dense ? 220 : undefined,
  };

  return (
    <div style={wrap}>
      <select
        id={stableKey ? `unit-preset-${stableKey}` : undefined}
        style={ctl}
        aria-label="Unit"
        value={matched ?? "other"}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "other" ? "" : v);
        }}
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
        <option value="other">Other…</option>
      </select>
      {matched == null ? (
        <input
          style={ctl}
          id={stableKey ? `unit-custom-${stableKey}` : undefined}
          aria-label="Custom unit"
          placeholder="Type unit (e.g. 50 kg bag)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

const wrap: CSSProperties = {
  display: "grid",
  gap: 8,
};
