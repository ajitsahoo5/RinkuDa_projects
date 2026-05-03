import { useSettingsCatalog } from "./useSettingsCatalog";

export function useOtherPecsCatalog() {
  const { otherPecsItems, loading, error } = useSettingsCatalog();
  return { items: otherPecsItems, loading, error };
}
