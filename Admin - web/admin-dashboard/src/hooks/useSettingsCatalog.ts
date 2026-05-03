import { useEffect, useReducer } from "react";
import {
  getSettingsCatalogState,
  subscribeSettingsCatalog,
  type SettingsCatalogState,
} from "../lib/settingsCatalogSubscription";

/** Live `settings/catalog` (fertilizers, pesticides, other PECS items, seeds, crops); one snapshot for all hooks. */
export function useSettingsCatalog(): SettingsCatalogState {
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeSettingsCatalog(() => force()), []);

  return getSettingsCatalogState();
}
