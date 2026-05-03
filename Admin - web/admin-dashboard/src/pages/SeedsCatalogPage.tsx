import { Link } from "react-router-dom";
import { CatalogItemsPage } from "./CatalogItemsPage";
import { useSeedsCatalog } from "../hooks/useSeedsCatalog";
import { saveSeedsCatalog } from "../lib/pecsCatalogCrud";

export function SeedsCatalogPage() {
  const { items, loading, error } = useSeedsCatalog();
  return (
    <CatalogItemsPage
      title="Seed catalog"
      remoteItems={items}
      loading={loading}
      error={error}
      intro={
        <>
          Manage seed products, units (bag, kg, packet), and default price per unit. Crop names live
          on the{" "}
          <Link to="/catalog/crops" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Crops
          </Link>{" "}
          page; general consumables can go under{" "}
          <Link to="/catalog/other-pecs-items" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Other PECS
          </Link>
          .
        </>
      }
      saveCatalog={saveSeedsCatalog}
      nameRequiredMessage="Enter a seed product name."
      catalogEmptyHint="No seeds yet — add rows and save to publish this list."
      namePlaceholder="e.g. Cotton hybrid FH–658 (1 kg)"
    />
  );
}
