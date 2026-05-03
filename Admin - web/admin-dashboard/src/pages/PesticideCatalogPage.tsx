import { Link } from "react-router-dom";
import { CatalogItemsPage } from "./CatalogItemsPage";
import { usePesticideCatalog } from "../hooks/usePesticideCatalog";
import { savePesticideCatalog } from "../lib/pecsCatalogCrud";

export function PesticideCatalogPage() {
  const { items, loading, error } = usePesticideCatalog();
  return (
    <CatalogItemsPage
      title="Pesticide catalog"
      remoteItems={items}
      loading={loading}
      error={error}
      intro={
        <>
          Add pesticides and default price per unit. Farmer workflows can use this list alongside{" "}
          <Link to="/catalog/fertilizers" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Fertilizers
          </Link>
          . Manage crops on the{" "}
          <Link to="/catalog/crops" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Crops
          </Link>{" "}
          page.
        </>
      }
      saveCatalog={savePesticideCatalog}
      nameRequiredMessage="Enter a pesticide name."
      catalogEmptyHint="No items yet — add products and save to make them available where the app reads this catalog."
      namePlaceholder="e.g. Chlorpyrifos"
    />
  );
}
