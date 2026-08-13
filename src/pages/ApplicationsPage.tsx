import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Application } from '../types';
import { FileText, Loader2 } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = user?.id || 'student';
    loadApplications(studentId);

    const handleUpdate = () => loadApplications(studentId);
    window.addEventListener('pc_drives_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pc_drives_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user?.id]);

  const loadApplications = async (userId: string) => {
    setLoading(true);
    const liveApps = await api.getApplicationsForStudent(userId);
    setApplications(liveApps);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)]">
          <span className="badge-aureate badge-brass mb-1">Application Pipeline</span>
          <h2 className="text-2xl font-display font-bold">My Active Applications</h2>
          <p className="text-sm text-[var(--ink-muted)]">Live database pipeline synced with Supabase applications table.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brass)]" />
            Querying Supabase Applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="card-aureate p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
            <h3 className="font-bold text-base">No Applications Yet</h3>
            <p className="text-xs text-[var(--ink-muted)]">Browse eligible drives to submit your first placement application.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="card-aureate p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base">{app.drive?.company?.name || 'Drive Application'}</h3>
                    <span className="badge-aureate badge-brass font-mono">{app.drive?.ctc_or_stipend || 'Applied'}</span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">{app.drive?.role_title || 'Role'} • Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="badge-aureate badge-brass capitalize text-xs px-3 py-1">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
