import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { PlantPage } from './pages/PlantPage';
import { FaultDetectionPage } from './pages/FaultDetectionPage';
import { RequestsPage } from './pages/RequestsPage';
import { ManagePlantsPage } from './pages/ManagePlantsPage';
import { ManageUnitsPage } from './pages/ManageUnitsPage';
import { ManageEngineersPage } from './pages/ManageEngineersPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { StatsSubmissionPage } from './pages/StatsSubmissionPage';
import { FaultHistoryPage } from './pages/FaultHistoryPage';
import { MaintenanceHistoryPage } from './pages/MaintenanceHistoryPage';
import { DroppedHistoryPage } from './pages/DroppedHistoryPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route element={<AppLayout />}>
            {/* Public/Guest Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/plant/:plantId" element={<PlantPage />} />

            {/* Engineer Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['engineer']} />}>
              <Route path="/fault-detection" element={<FaultDetectionPage />} />
              <Route path="/stats-submission" element={<StatsSubmissionPage />} />
            </Route>

            {/* Engineer & Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['engineer', 'admin']} />}>
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/admin/units" element={<ManageUnitsPage />} />
              <Route path="/history/faults" element={<FaultHistoryPage />} />
              <Route path="/history/maintenance" element={<MaintenanceHistoryPage />} />
              <Route path="/history/dropped" element={<DroppedHistoryPage />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/plants" element={<ManagePlantsPage />} />
              <Route path="/admin/engineers" element={<ManageEngineersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
