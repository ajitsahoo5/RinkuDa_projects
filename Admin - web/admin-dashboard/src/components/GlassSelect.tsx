import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

/** Sense-style glass select with custom chevron (replaces native menulist chrome). */
export function GlassSelect({ className = "", ...props }: Props) {
  return <select className={`glass-select ${className}`.trim()} {...props} />;
}
