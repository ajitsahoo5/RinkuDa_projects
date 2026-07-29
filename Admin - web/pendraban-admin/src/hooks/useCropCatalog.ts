import { useSettingsCatalog } from "./useSettingsCatalog";

export function useCropCatalog() {
  const { crops, loading, error } = useSettingsCatalog();
  return { items: crops, loading, error };
}
