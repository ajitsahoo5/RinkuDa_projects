import { Link } from "react-router-dom";
import { CatalogItemsPage } from "./CatalogItemsPage";
import { useFertilizerCatalog } from "../hooks/useFertilizerCatalog";
import { saveFertilizerCatalog } from "../lib/fertilizerCatalogCrud";

export function FertilizerCatalogPage() {
  const { items, loading, error } = useFertilizerCatalog();
  return (
    <CatalogItemsPage
      title="Fertilizer catalog"
      remoteItems={items}
      loading={loading}
      error={error}
      intro={
        <>
          Add products, set default price per unit, and unit type. Farmer forms use this list; if the
          catalog is empty, built-in presets are used. Manage crop presets on the{" "}
          <Link to="/catalog/crops" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Crops
          </Link>{" "}
          page.
        </>
      }
      saveCatalog={saveFertilizerCatalog}
      nameRequiredMessage="Enter a fertilizer name."
      catalogEmptyHint="No custom items yet — farmer screens use built-in presets until you add rows and save."
    />
  );
}
