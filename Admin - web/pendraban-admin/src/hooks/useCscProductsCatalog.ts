import { useSettingsCatalog } from "./useSettingsCatalog";

export function useCscProductsCatalog() {
  const { cscProducts, loading, error } = useSettingsCatalog();
  return { items: cscProducts, loading, error };
}
