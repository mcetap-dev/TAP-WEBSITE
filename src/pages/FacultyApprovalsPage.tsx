import React from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { FacultyDashboardView } from '../components/Dashboard/FacultyDashboardView';

export const FacultyApprovalsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <FacultyDashboardView />
    </DashboardLayout>
  );
};
