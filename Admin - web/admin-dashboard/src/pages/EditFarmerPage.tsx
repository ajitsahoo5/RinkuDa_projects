import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FarmerForm } from "../components/FarmerForm";
import { AdminLayout } from "../components/AdminLayout";
import { useFarmers } from "../hooks/useFarmers";
import { upsertFarmer } from "../lib/farmerCrud";
import { useFertilizerCatalog } from "../hooks/useFertilizerCatalog";
import { resolveFarmerTemplates } from "../lib/fertilizerTemplates";

export function EditFarmerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { farmers, loading, error } = useFarmers();
  const { items: catalogItems, loading: catalogLoading } = useFertilizerCatalog();

  const farmer = useMemo(() => farmers.find((f) => f.id === id), [farmers, id]);

  const nextSlNo = useMemo(() => {
    if (farmers.length === 0) return 1;
    return Math.max(...farmers.map((f) => f.slNo)) + 1;
  }, [farmers]);

  const fertilizerTemplates = useMemo(
    () => resolveFarmerTemplates(catalogItems),
    [catalogItems],
  );

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
        <p style={{ padding: 24 }}>Loading fertilizer catalog…</p>
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
        onCancel={() => navigate("/")}
        onSubmit={async (f) => {
          await upsertFarmer(f);
          navigate("/");
        }}
      />
    </AdminLayout>
  );
}
