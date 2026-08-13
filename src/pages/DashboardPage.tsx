import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { StudentDashboardView } from '../components/Dashboard/StudentDashboardView';
import { TPODashboardView } from '../components/Dashboard/TPODashboardView';
import { FacultyDashboardView } from '../components/Dashboard/FacultyDashboardView';
import { AdminDashboardView } from '../components/Dashboard/AdminDashboardView';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();

  const renderDashboard = () => {
    switch (role) {
      case 'tpo':
        return <TPODashboardView />;
      case 'faculty':
      case 'faculty_coordinator':
        return <FacultyDashboardView />;
      case 'admin':
        return <AdminDashboardView />;
      case 'student':
      default:
        return <StudentDashboardView />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default DashboardPage;
