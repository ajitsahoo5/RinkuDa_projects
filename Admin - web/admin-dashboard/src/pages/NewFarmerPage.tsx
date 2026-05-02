import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FarmerForm } from "../components/FarmerForm";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { useSettingsCatalog } from "../hooks/useSettingsCatalog";
import { cropDropdownNamesFromCatalog } from "../lib/cropCatalogNames";
import { upsertFarmer } from "../lib/farmerCrud";
import { resolveFarmerTemplates } from "../lib/fertilizerTemplates";

export function NewFarmerPage() {
  const navigate = useNavigate();
  const { farmers, loading: farmersLoading } = useFarmers();
  const {
    fertilizers: catalogItems,
    crops: cropItems,
    loading: catalogLoading,
  } = useSettingsCatalog();
  const fertilizerTemplates = useMemo(
    () => resolveFarmerTemplates(catalogItems),
    [catalogItems],
  );
  const cropOptions = useMemo(() => cropDropdownNamesFromCatalog(cropItems), [cropItems]);
  const nextSlNo = useMemo(() => {
    if (farmers.length === 0) return 1;
    return Math.max(...farmers.map((f) => f.slNo)) + 1;
  }, [farmers]);

  if (farmersLoading || catalogLoading) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, fontWeight: 600 }}>Loading…</p>
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
        cropOptions={cropOptions}
        onCancel={() => navigate("/")}
        onSubmit={async (farmer) => {
          await upsertFarmer(farmer);
          navigate("/");
        }}
      />
    </AdminLayout>
  );
}
