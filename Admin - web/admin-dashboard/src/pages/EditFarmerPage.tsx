import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FarmerForm } from "../components/FarmerForm";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { cropDropdownNamesFromCatalog } from "../lib/cropCatalogNames";
import { upsertFarmer } from "../lib/farmerCrud";
import { useSettingsCatalog } from "../hooks/useSettingsCatalog";
import { resolveCatalogLineTemplates, resolveFarmerTemplates } from "../lib/fertilizerTemplates";

export function EditFarmerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { farmers, loading, error } = useFarmers();
  const {
    fertilizers: catalogItems,
    pesticides: pesticideCatalog,
    seeds: seedsCatalog,
    otherPecsItems: otherPecsCatalog,
    crops: cropItems,
    loading: catalogLoading,
  } = useSettingsCatalog();

  const farmer = useMemo(() => farmers.find((f) => f.id === id), [farmers, id]);

  const nextSlNo = useMemo(() => {
    if (farmers.length === 0) return 1;
    return Math.max(...farmers.map((f) => f.slNo)) + 1;
  }, [farmers]);

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
  const otherPecsTemplates = useMemo(
    () => resolveCatalogLineTemplates(otherPecsCatalog),
    [otherPecsCatalog],
  );
  const cropOptions = useMemo(() => cropDropdownNamesFromCatalog(cropItems), [cropItems]);

  if (!id) {
    return (
      <AdminLayout>
        <p style={{ padding: 24 }}>Missing farmer id.</p>
      </AdminLayout>
    );
  }

  if ((loading || catalogLoading) && !farmer) {
    return (
      <AdminLayout>
        <p style={{ padding: 24 }}>Loading…</p>
      </AdminLayout>
    );
  }

  if (error && !farmer) {
    return (
      <AdminLayout>
        <div style={{ padding: 24 }}>
          <p>Couldn’t load farmers.</p>
          <pre>{error}</pre>
        </div>
      </AdminLayout>
    );
  }

  if (!farmer) {
    return (
      <AdminLayout>
        <div style={{ padding: 24 }}>
          <p>Farmer not found.</p>
          <Link to="/">Back to dashboard</Link>
        </div>
      </AdminLayout>
    );
  }

  if (catalogLoading) {
    return (
      <AdminLayout>
        <p style={{ padding: 24 }}>Loading catalogs…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <FarmerForm
        mode="edit"
        initial={farmer}
        nextSlNo={nextSlNo}
        existingFarmers={farmers}
        fertilizerTemplates={fertilizerTemplates}
        pesticideTemplates={pesticideTemplates}
        seedTemplates={seedTemplates}
        otherPecsTemplates={otherPecsTemplates}
        cropOptions={cropOptions}
        onCancel={() => navigate("/")}
        onSubmit={async (f) => {
          await upsertFarmer(f);
          navigate("/");
        }}
      />
    </AdminLayout>
  );
}
