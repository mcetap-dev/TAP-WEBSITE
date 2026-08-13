import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Drive, Application } from '../../types';
import {
  Briefcase,
  Clock,
  FileCheck,
  QrCode,
  Sparkles,
  UserCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const StudentDashboardView: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const loadData = React.useCallback(async () => {
    const liveDrives = await api.getDrives();
    setDrives(liveDrives);

    const studentId = user?.id || profile?.id;
    if (studentId) {
      const liveApps = await api.getApplicationsForStudent(studentId);
      setApplications(liveApps);
    }
  }, [user?.id, profile?.id]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('pc_drives_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pc_drives_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  const appliedDriveIds = applications.map((a) => a.drive_id);

  const handleApply = async (driveId: string) => {
    const studentId = user?.id || profile?.id;
    if (!studentId) {
      navigate('/login');
      return;
    }

    const { error } = await api.submitApplication(driveId, studentId);
    if (error) {
      alert(`Notice: ${error.message || 'Unable to submit application.'}`);
    } else {
      alert('Application submitted successfully!');
      loadData();
    }
  };

  // Recommended drives: show open drives
  const recommendedDrives = drives.filter((d) => d.status === 'open' || (d.status as any) === 'active').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-aureate badge-brass">Student Portal</span>
            <span className={`badge-aureate ${profile?.approval_status === 'approved' ? 'badge-success' : 'badge-alert'}`}>
              {profile?.approval_status === 'approved' ? 'Verified Account' : 'Pending Verification'}
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold">Welcome back, {profile?.name || 'Student'}!</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            USN: {profile?.usn || '4MC23IS126'} • Dept: {profile?.department || 'Information Science Engineering'} • Batch: {profile?.batch || '2026'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQRScanner(!showQRScanner)}
            className="btn-aureate-secondary text-xs"
          >
            <QrCode className="w-4 h-4 text-[var(--brass)]" />
            Scan Attendance QR
          </button>
          <Link to="/drives" className="btn-aureate-primary text-xs">
            <Briefcase className="w-4 h-4" />
            Browse Drives ({drives.length})
          </Link>
        </div>
      </div>

      {/* QR Code Scanner Dialog Modal Mock */}
      {showQRScanner && (
        <div className="card-aureate p-6 bg-[var(--surface-alt)] border-[var(--brass)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[var(--brass)]" />
              Drive Attendance Scanner
            </h3>
            <button onClick={() => setShowQRScanner(false)} className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Close
            </button>
          </div>
          <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center space-y-3 text-center bg-[var(--bg)]">
            <div className="w-16 h-16 rounded-full bg-[var(--brass-soft)] flex items-center justify-center">
              <QrCode className="w-8 h-8 text-[var(--brass)]" />
            </div>
            <div>
              <p className="text-xs font-semibold">Camera Ready / QR Code Code Entry</p>
              <p className="text-[11px] text-[var(--ink-muted)]">Point your camera at the TPO Drive QR or enter 6-digit passcode</p>
            </div>
            <div className="flex items-center gap-2 max-w-xs w-full">
              <input
                type="text"
                placeholder="Enter 6-digit Passcode"
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
              <button
                onClick={() => {
                  alert('Attendance recorded successfully for Round 1!');
                  setShowQRScanner(false);
                }}
                className="btn-aureate-primary text-xs px-3 py-1.5"
              >
                Mark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">CGPA & Backlogs</span>
            <FileCheck className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">{profile?.cgpa ?? 8.70} <span className="text-xs font-normal text-[var(--ink-muted)]">/ 10</span></p>
          <p className="text-[11px] text-[var(--success)] mt-1">{profile?.active_backlogs ?? 0} Active Backlogs</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Applied Drives</span>
            <Briefcase className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">{applications.length} <span className="text-xs font-normal text-[var(--ink-muted)]">Submitted</span></p>
          <p className="text-[11px] text-[var(--info)] mt-1">{drives.length} Drives Available</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Placement Consent</span>
            <UserCheck className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--success)]">Opted In</p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">Placement Policy Accepted</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Resume Verification</span>
            <Sparkles className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--brass)]">Verified</p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">Approved by Faculty</p>
        </div>
      </div>

      {/* Grid Section: Applications & Upcoming Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications Tracker */}
        <div className="lg:col-span-2 card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--brass)]" />
              My Application Pipeline ({applications.length})
            </h3>
            <Link to="/applications" className="text-xs text-[var(--brass)] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                No active placement applications yet. Explore available drives to apply!
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)]">{app.drive?.company?.name || 'Company Recruitment Drive'}</h4>
                    <p className="text-xs text-[var(--ink-muted)]">{app.drive?.role_title || 'Role'} • {app.drive?.ctc_or_stipend || ''}</p>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                      Applied: <span className="text-[var(--ink)] font-semibold">{app.applied_at?.slice(0, 10)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge-aureate ${
                        app.status === 'selected'
                          ? 'badge-success'
                          : app.status === 'shortlisted'
                          ? 'badge-brass'
                          : 'badge-info'
                      } capitalize`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Featured Drives */}
        <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--brass)]" />
              Recommended Drives
            </h3>
            <Link to="/drives" className="text-xs text-[var(--brass)] hover:underline flex items-center gap-0.5">
              <span>All ({drives.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedDrives.map((drive) => {
              const isApplied = appliedDriveIds.includes(drive.id);

              return (
                <div key={drive.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{drive.company?.name || 'Company'}</h4>
                    <span className="badge-aureate badge-brass font-mono text-[11px]">{drive.ctc_or_stipend || 'Competitive'}</span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">{drive.role_title} • Cutoff: {drive.cgpa_cutoff ?? 7.0} CGPA</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[var(--ink-muted)]">Deadline: {drive.application_deadline || 'Open'}</span>
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(drive.id)}
                        className="btn-aureate-primary text-[11px] px-2.5 py-1"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardView;

