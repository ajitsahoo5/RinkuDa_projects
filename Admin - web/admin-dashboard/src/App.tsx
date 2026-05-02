import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isFirebaseConfigured } from "./lib/firebase";
import { SetupPage } from "./pages/SetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewFarmerPage } from "./pages/NewFarmerPage";
import { EditFarmerPage } from "./pages/EditFarmerPage";
import { FertilizerCatalogPage } from "./pages/FertilizerCatalogPage";

export function App() {
  if (!isFirebaseConfigured()) {
    return <SetupPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farmers/new" element={<NewFarmerPage />} />
        <Route path="/catalog/fertilizers" element={<FertilizerCatalogPage />} />
        <Route path="/farmers/:id/edit" element={<EditFarmerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
