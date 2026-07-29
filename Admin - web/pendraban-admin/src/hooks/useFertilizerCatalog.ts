import { useSettingsCatalog } from "./useSettingsCatalog";

export function useFertilizerCatalog() {
  const { fertilizers, loading, error } = useSettingsCatalog();
  return { items: fertilizers, loading, error };
}
