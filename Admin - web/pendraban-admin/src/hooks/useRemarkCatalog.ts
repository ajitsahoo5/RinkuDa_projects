import { useSettingsCatalog } from "./useSettingsCatalog";

export function useRemarkCatalog() {
  const { remarkPresets, loading, error } = useSettingsCatalog();
  return { items: remarkPresets, loading, error };
}
