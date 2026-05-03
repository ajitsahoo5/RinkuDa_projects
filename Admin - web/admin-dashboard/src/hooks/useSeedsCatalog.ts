import { useSettingsCatalog } from "./useSettingsCatalog";

export function useSeedsCatalog() {
  const { seeds, loading, error } = useSettingsCatalog();
  return { items: seeds, loading, error };
}
