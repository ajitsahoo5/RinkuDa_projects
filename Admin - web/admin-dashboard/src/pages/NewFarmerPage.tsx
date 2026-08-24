import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FarmerForm } from "../components/FarmerForm";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { useNextSlNo } from "../hooks/useNextSlNo";
import { useSettingsCatalog } from "../hooks/useSettingsCatalog";
import { cropDropdownNamesFromCatalog } from "../lib/cropCatalogNames";
import { villageMouzaDropdownNamesFromCatalog } from "../lib/villageMouzaCatalogNames";
import { remarkPresetNamesFromCatalog } from "../lib/remarkCatalogNames";
import { upsertFarmer } from "../lib/farmerCrud";
import { resolveCatalogLineTemplates, resolveFarmerTemplates } from "../lib/fertilizerTemplates";

export function NewFarmerPage() {
  const navigate = useNavigate();
  const { farmers, loading: farmersLoading, refresh } = useFarmers();
  const { nextSlNo, loading: slLoading, error: slError } = useNextSlNo();
  const {
    fertilizers: catalogItems,
    pesticides: pesticideCatalog,
    seeds: seedsCatalog,
    cscProducts: cscCatalog,
    crops: cropItems,
    villageMouzas: villageMouzaItems,
    remarkPresets: remarkCatalogItems,
    loading: catalogLoading,
    refresh: refreshCatalog,
  } = useSettingsCatalog();
  const fertilizerTemplates = useMemo(
    () => resolveFarmerTemplates(catalogItems),
    [catalogItems],
  );
  const pesticideTemplates = useMemo(
    () => resolveCatalogLineTemplates(pesticideCatalog),
    [pesticideCatalog],
  );
  const seedTemplates = useMemo(
    () => resolveCatalogLineTemplates(seedsCatalog),
    [seedsCatalog],
  );
  const cscProductTemplates = useMemo(
    () => resolveCatalogLineTemplates(cscCatalog),
    [cscCatalog],
  );
  const cropOptions = useMemo(() => cropDropdownNamesFromCatalog(cropItems), [cropItems]);
  const villageMouzaOptions = useMemo(
    () => villageMouzaDropdownNamesFromCatalog(villageMouzaItems),
    [villageMouzaItems],
  );
  const remarkPresetOptions = useMemo(
    () => remarkPresetNamesFromCatalog(remarkCatalogItems),
    [remarkCatalogItems],
  );
  if (farmersLoading || catalogLoading || slLoading) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, fontWeight: 600 }}>Loading…</p>
      </AdminLayout>
    );
  }

  if (slError) {
    return (
      <AdminLayout>
        <p style={{ padding: 24 }}>Couldn’t load next serial number: {slError}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <FarmerForm
        mode="create"
        initial={null}
        nextSlNo={nextSlNo}
        existingFarmers={farmers}
        fertilizerTemplates={fertilizerTemplates}
        pesticideTemplates={pesticideTemplates}
        seedTemplates={seedTemplates}
        cscProductTemplates={cscProductTemplates}
        cropOptions={cropOptions}
        villageMouzaOptions={villageMouzaOptions}
        remarkPresetOptions={remarkPresetOptions}
        onCancel={() => navigate("/")}
        onSubmit={async (farmer) => {
          await upsertFarmer(farmer);
          await Promise.all([refresh(), refreshCatalog()]);
          navigate("/");
        }}
      />
    </AdminLayout>
  );
}
