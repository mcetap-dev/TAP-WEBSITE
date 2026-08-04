import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { TPODashboardView } from '../components/Dashboard/TPODashboardView';

export const TPODrivesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <TPODashboardView />
    </DashboardLayout>
  );
};
