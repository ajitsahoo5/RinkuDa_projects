import { useEffect, useReducer } from "react";
import {
  getSettingsCatalogState,
  subscribeSettingsCatalog,
  type SettingsCatalogState,
} from "../lib/settingsCatalogSubscription";

/** Live `settings/catalog` (fertilizers, pesticides, `cscProducts`, seeds, crops). */
export function useSettingsCatalog(): SettingsCatalogState {
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeSettingsCatalog(() => force()), []);

  return getSettingsCatalogState();
}
