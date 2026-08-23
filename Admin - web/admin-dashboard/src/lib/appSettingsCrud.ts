import { invalidateSettings } from "./api/invalidate";
import { patchAppSettings } from "./api/registry/settingsApi";
import type { AppSettings } from "../types/appSettings";

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<void> {
  await patchAppSettings(patch);
  invalidateSettings();
}
