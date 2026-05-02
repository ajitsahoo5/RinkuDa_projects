import type { Farmer } from "../types/farmer";

/** Strip to digits only for stable comparison. */
export function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Returns a user-facing error message if the draft conflicts with an existing farmer,
 * or `null` if OK. Excludes the farmer with `excludeId` (same document when editing).
 */
export function duplicateFarmerMessage(
  existing: Farmer[],
  draft: Farmer,
  excludeId: string | null,
): string | null {
  for (const f of existing) {
    if (excludeId != null && f.id === excludeId) continue;

    if (f.slNo === draft.slNo) {
      return `Serial number ${draft.slNo} is already assigned to ${f.farmerName.trim() || "another farmer"}.`;
    }

    const draftAad = normalizeDigits(draft.aadharNo);
    if (draftAad.length > 0 && normalizeDigits(f.aadharNo) === draftAad) {
      return `This Aadhaar is already registered (SL No ${f.slNo}, ${f.farmerName || "existing farmer"}).`;
    }

    const draftMob = normalizeDigits(draft.mobileNo);
    if (draftMob.length > 0 && normalizeDigits(f.mobileNo) === draftMob) {
      return `This mobile number is already registered (SL No ${f.slNo}, ${f.farmerName || "existing farmer"}).`;
    }
  }
  return null;
}
