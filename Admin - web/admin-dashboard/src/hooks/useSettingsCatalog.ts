import { useEffect, useReducer } from "react";
import {
  getSettingsCatalogState,
  refreshSettingsCatalog,
  subscribeSettingsCatalog,
  type SettingsCatalogState,
} from "../lib/settingsCatalogSubscription";

/** Cached `settings/catalog` (one fetch per session; call `refresh` after stock edits). */
export function useSettingsCatalog(): SettingsCatalogState & { refresh: typeof refreshSettingsCatalog } {
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeSettingsCatalog(() => force()), []);

  return { ...getSettingsCatalogState(), refresh: refreshSettingsCatalog };
}
