import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { LoginPage } from "@/modules/auth/login-page";
import { RegisterPage } from "@/modules/auth/register-page";
import { Dashboard } from "@/modules/dashboard/dashboard-home";
import { MapComponent } from "@/modules/gis/map-component";
import { ViolationsList } from "@/modules/violations/violations-list";
import { ComplianceDashboard } from "@/modules/reports/compliance-dashboard";
import { SettingsPage } from "@/modules/settings/settings-page";
import { IndustryDashboard } from "@/modules/industry/industry-dashboard";
import { AllotmentWizard } from "@/modules/allotment/allotment-page";
import { AdminDashboard } from "@/modules/admin/admin-dashboard";
import { ProtectedRoute } from "@/components/layout/protected-route";

// Placeholder components for routes
const MapEngine = () => <div className="h-full flex flex-col"><MapComponent /></div>;

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Industry Owner Portal */}
      <Route path="/industry" element={
        <ProtectedRoute allowedRoles={['INDUSTRY_OWNER']}>
          <IndustryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/allotment/new" element={
        <ProtectedRoute allowedRoles={['INDUSTRY_OWNER']}>
          <AllotmentWizard />
        </ProtectedRoute>
      } />

      {/* Official Dashboard Routes */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'INSPECTOR']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="map" element={<MapEngine />} />
        <Route path="violations" element={<ViolationsList />} />
        <Route path="reports" element={<ComplianceDashboard />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Admin Only Route */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
