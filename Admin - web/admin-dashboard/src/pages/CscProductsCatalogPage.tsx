import { Link } from "react-router-dom";
import { CatalogItemsPage } from "./CatalogItemsPage";
import { useCscProductsCatalog } from "../hooks/useCscProductsCatalog";
import { saveCscProductsCatalog } from "../lib/pecsCatalogCrud";

export function CscProductsCatalogPage() {
  const { items, loading, error } = useCscProductsCatalog();
  return (
    <CatalogItemsPage
      title="CSC Products catalog"
      remoteItems={items}
      loading={loading}
      error={error}
      intro={
        <>
          Common Service Centre (CSC) products and related retail SKUs — scheme goods, kits, and
          supplies beyond fertilizers and pesticides. Pair with{" "}
          <Link to="/catalog/fertilizers" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Fertilizers
          </Link>{" "}
          and{" "}
          <Link to="/catalog/pesticides" style={{ color: "var(--primary)", fontWeight: 800 }}>
            Pesticides
          </Link>
          .
        </>
      }
      saveCatalog={saveCscProductsCatalog}
      nameRequiredMessage="Enter a product name."
      catalogEmptyHint="No CSC products yet — add rows and save to publish this list."
      namePlaceholder="e.g. CSC soil health kit"
    />
  );
}
