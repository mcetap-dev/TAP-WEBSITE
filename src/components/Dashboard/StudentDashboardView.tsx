import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileCheck,
  QrCode,
  Sparkles,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboardView: React.FC = () => {
  const { profile } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const mockApplications = [
    { company: 'Google Inc.', role: 'Software Engineer', status: 'shortlisted', round: 'Technical Interview 1', date: '2026-08-05' },
    { company: 'Microsoft', role: 'Cloud Solution Architect', status: 'applied', round: 'Resume Screening', date: '2026-08-01' },
    { company: 'Infosys', role: 'Systems Engineer', status: 'selected', round: 'Offer Issued', date: '2026-07-20' },
  ];

  const mockDrives = [
    { id: '1', company: 'Amazon', role: 'SDE-1', ctc: '28 LPA', cutoff: '7.5 CGPA', deadline: '2026-08-10' },
    { id: '2', company: 'Goldman Sachs', role: 'Analyst', ctc: '22 LPA', cutoff: '8.0 CGPA', deadline: '2026-08-12' },
  ];

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
            USN: {profile?.usn || '1MS21CS001'} • Dept: {profile?.department || 'Computer Science'} • Batch: {profile?.batch || '2026'}
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
            Browse Drives
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
          <p className="text-xl font-bold font-mono">8.85 <span className="text-xs font-normal text-[var(--ink-muted)]">/ 10</span></p>
          <p className="text-[11px] text-[var(--success)] mt-1">0 Active Backlogs (Eligible)</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Applied Drives</span>
            <Briefcase className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">3 <span className="text-xs font-normal text-[var(--ink-muted)]">Active</span></p>
          <p className="text-[11px] text-[var(--info)] mt-1">1 Shortlisted • 1 Offer</p>
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
          <p className="text-xl font-bold font-mono text-[var(--brass)]">92% Score</p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">Verified by Faculty</p>
        </div>
      </div>

      {/* Grid Section: Applications & Upcoming Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications Tracker */}
        <div className="lg:col-span-2 card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--brass)]" />
              My Application Pipeline
            </h3>
            <Link to="/applications" className="text-xs text-[var(--brass)] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {mockApplications.map((app, i) => (
              <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">{app.company}</h4>
                  <p className="text-xs text-[var(--ink-muted)]">{app.role}</p>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-1">Current Stage: <span className="text-[var(--ink)] font-semibold">{app.round}</span></p>
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
            ))}
          </div>
        </div>

        {/* Right Column: Featured Drives */}
        <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--brass)]" />
              Recommended Drives
            </h3>
          </div>

          <div className="space-y-3">
            {mockDrives.map((drive) => (
              <div key={drive.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{drive.company}</h4>
                  <span className="badge-aureate badge-brass font-mono">{drive.ctc}</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">{drive.role} • Cutoff: {drive.cutoff}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--ink-muted)]">Deadline: {drive.deadline}</span>
                  <button
                    onClick={() => alert(`Application submitted for ${drive.company}!`)}
                    className="btn-aureate-primary text-[11px] px-2.5 py-1"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
