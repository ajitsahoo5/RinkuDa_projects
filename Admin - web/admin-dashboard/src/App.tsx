import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { isFirebaseConfigured } from "./lib/firebase";
import { SetupPage } from "./pages/SetupPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewFarmerPage } from "./pages/NewFarmerPage";
import { EditFarmerPage } from "./pages/EditFarmerPage";
import { CropCatalogPage } from "./pages/CropCatalogPage";
import { RemarkCatalogPage } from "./pages/RemarkCatalogPage";
import { FertilizerCatalogPage } from "./pages/FertilizerCatalogPage";
import { PesticideCatalogPage } from "./pages/PesticideCatalogPage";
import { CscProductsCatalogPage } from "./pages/CscProductsCatalogPage";
import { SeedsCatalogPage } from "./pages/SeedsCatalogPage";
import { UsersAdminPage } from "./pages/UsersAdminPage";

function Spinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        color: "var(--muted)",
      }}
    >
      Loading…
    </div>
  );
}

function AuthorizedRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farmers/new" element={<NewFarmerPage />} />
        <Route path="/catalog/fertilizers" element={<FertilizerCatalogPage />} />
        <Route path="/catalog/pesticides" element={<PesticideCatalogPage />} />
        <Route path="/catalog/csc-products" element={<CscProductsCatalogPage />} />
        <Route path="/catalog/other-pecs-items" element={<Navigate to="/catalog/csc-products" replace />} />
        <Route path="/catalog/seeds" element={<SeedsCatalogPage />} />
        <Route path="/catalog/crops" element={<CropCatalogPage />} />
        <Route path="/catalog/remarks" element={<RemarkCatalogPage />} />
        <Route path="/farmers/:id/edit" element={<EditFarmerPage />} />
        <Route path="/admin/users" element={<UsersAdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  if (!isFirebaseConfigured()) {
    return <SetupPage />;
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { ready, user, profile } = useAuth();

  if (!ready) {
    return <Spinner />;
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  return <AuthorizedRoutes />;
}
