import { useSettingsCatalog } from "./useSettingsCatalog";

export function useVillageMouzaCatalog() {
  const { villageMouzas, loading, error } = useSettingsCatalog();
  return { items: villageMouzas, loading, error };
}
