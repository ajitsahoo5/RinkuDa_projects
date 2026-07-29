import { useSettingsCatalog } from "./useSettingsCatalog";

export function usePesticideCatalog() {
  const { pesticides, loading, error } = useSettingsCatalog();
  return { items: pesticides, loading, error };
}
