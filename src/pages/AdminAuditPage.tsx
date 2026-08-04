import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { AdminDashboardView } from '../components/Dashboard/AdminDashboardView';

export const AdminAuditPage: React.FC = () => {
  return (
    <DashboardLayout>
      <AdminDashboardView />
    </DashboardLayout>
  );
};
