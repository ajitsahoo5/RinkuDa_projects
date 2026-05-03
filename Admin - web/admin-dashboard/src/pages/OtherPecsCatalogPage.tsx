import { Link } from "react-router-dom";
import { CatalogItemsPage } from "./CatalogItemsPage";
import { useOtherPecsCatalog } from "../hooks/useOtherPecsCatalog";
import { saveOtherPecsCatalog } from "../lib/pecsCatalogCrud";

export function OtherPecsCatalogPage() {
  const { items, loading, error } = useOtherPecsCatalog();
  return (
    <CatalogItemsPage
      title="Other PECS items"
      remoteItems={items}
      loading={loading}
      error={error}
      intro={
        <>
          Plant protection and extension consumables (PECS) that are not fertilizers or pesticides —
          seeds, bio-inputs, equipment consumables, etc. Pair with{" "}
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
      saveCatalog={saveOtherPecsCatalog}
      nameRequiredMessage="Enter an item name."
      catalogEmptyHint="No items yet — add rows and save to publish this list."
      namePlaceholder="e.g. Certified seed (50 kg bag)"
    />
  );
}
