import { emptyAppSettings, parseAppSettings, type AppSettings } from "../../../types/appSettings";
import { apiRequest } from "../client";

export async function getAppSettings(): Promise<AppSettings> {
  const data = await apiRequest<Record<string, unknown>>("/registry/settings/app");
  return parseAppSettings(data);
}

export async function patchAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const data = await apiRequest<Record<string, unknown>>("/registry/settings/app", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseAppSettings(data);
}

export async function setGoogleSheetLink(link: string | null): Promise<AppSettings> {
  return patchAppSettings({ googleSheetLink: link });
}

export { emptyAppSettings };
