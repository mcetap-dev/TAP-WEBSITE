import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DrivesPage } from './pages/DrivesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { FacultyApprovalsPage } from './pages/FacultyApprovalsPage';
import { TPODrivesPage } from './pages/TPODrivesPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { AIPage } from './pages/AIPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/drives" element={<DrivesPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/faculty/approvals" element={<FacultyApprovalsPage />} />
          <Route path="/tpo/drives" element={<TPODrivesPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="/ai" element={<AIPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
