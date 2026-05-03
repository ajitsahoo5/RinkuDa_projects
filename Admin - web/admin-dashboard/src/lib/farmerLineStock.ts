import type { FertilizerType } from "../types/farmer";

/** Total ordered quantity per catalog id (same id can appear on multiple lines in theory). */
export function sumOrderedAmountsByCatalogId(lines: FertilizerType[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) {
    const id = l.id.trim();
    if (!id) continue;
    const a = Number(l.amount);
    const amt = Number.isFinite(a) && a >= 0 ? a : 0;
    m.set(id, (m.get(id) ?? 0) + amt);
  }
  return m;
}

/**
 * Returns an error message if any catalog-backed line exceeds current catalog stock,
 * or null if OK. Ignores lines whose id is not in `templates` (custom items).
 */
export function validateLinesAgainstCatalogStock(
  lines: FertilizerType[],
  templates: FertilizerType[],
  sectionLabel: string,
): string | null {
  const templateIds = new Set(templates.map((t) => t.id));
  const sums = sumOrderedAmountsByCatalogId(lines.filter((l) => templateIds.has(l.id)));

  for (const [id, sum] of sums) {
    const cap = templates.find((t) => t.id === id)?.catalogStock;
    if (typeof cap !== "number" || !Number.isFinite(cap)) continue;
    if (sum > cap + 1e-9) {
      const name = templates.find((t) => t.id === id)?.name ?? id;
      return `${sectionLabel}: quantity for "${name}" (${sum.toLocaleString("en-IN", { maximumFractionDigits: 3 })}) exceeds stock (${cap.toLocaleString("en-IN", { maximumFractionDigits: 3 })}).`;
    }
  }
  return null;
}
