import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ResearchPage } from "../features/research/pages/ResearchPage";
import { TeachingPage } from "../features/teaching/pages/TeachingPage";
import { ServicePage } from "../features/service/pages/ServicePage";

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/teaching" element={<TeachingPage />} />
          <Route path="/service" element={<ServicePage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}