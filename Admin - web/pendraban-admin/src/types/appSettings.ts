/** Firestore `settings/app` — shared with the mobile app. */
export type AppSettings = {
  googleSheetLink: string | null;
  address: string | null;
  gstNumber: string | null;
  mobileNumber: string | null;
};

export const emptyAppSettings = (): AppSettings => ({
  googleSheetLink: null,
  address: null,
  gstNumber: null,
  mobileNumber: null,
});

export function parseAppSettings(data: Record<string, unknown> | undefined): AppSettings {
  if (!data) return emptyAppSettings();
  const str = (key: string): string | null => {
    const v = data[key];
    if (v == null || v === "") return null;
    return String(v).trim() || null;
  };
  return {
    googleSheetLink: str("googleSheetLink"),
    address: str("address"),
    gstNumber: str("gstNumber"),
    mobileNumber: str("mobileNumber"),
  };
}
