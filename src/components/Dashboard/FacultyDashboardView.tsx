import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types';
import { LiveDriveOverview } from './LiveDriveOverview';
import {
  UserCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
  Check,
  X,
  Activity
} from 'lucide-react';

export const FacultyDashboardView: React.FC = () => {
  const { role } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approvals' | 'monitoring'>('approvals');

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    setLoading(true);
    const livePending = await api.getPendingStudentApprovals();
    setPendingStudents(livePending);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await api.updateStudentApprovalStatus(id, 'approved');
    if (error) {
      alert(`Approval error: ${error.message}`);
    } else {
      alert('Student approved successfully!');
      setPendingStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:') || 'Incomplete details';
    const { error } = await api.updateStudentApprovalStatus(id, 'rejected', reason);
    if (error) {
      alert(`Rejection error: ${error.message}`);
    } else {
      alert('Student rejected.');
      setPendingStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const getPortalInfo = () => {
    if (role === 'tpo') {
      return {
        badge: 'TPO Officer Portal',
        title: 'Student Verification & Placement Eligibility Queue',
        subtitle: 'Review student registrations, verify academic eligibility, and manage approval status for placement drives.',
        deptLabel: 'TPO Central',
        deptSub: 'Placement Eligibility Control'
      };
    }
    if (role === 'admin') {
      return {
        badge: 'System Administrator Portal',
        title: 'Central Student Verification System',
        subtitle: 'System-wide student verification, role auditing, and approval queue management.',
        deptLabel: 'System Wide',
        deptSub: 'Central Verification Control'
      };
    }
    return {
      badge: 'Faculty Coordinator Portal',
      title: 'Department Student Verification Queue',
      subtitle: 'Live Supabase student approval queue and verification management.',
      deptLabel: 'Academic',
      deptSub: 'Placement Eligibility Queue'
    };
  };

  const portalInfo = getPortalInfo();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="badge-aureate badge-brass mb-1">{portalInfo.badge}</span>
          <h2 className="text-2xl font-display font-bold">{portalInfo.title}</h2>
          <p className="text-sm text-[var(--ink-muted)]">{portalInfo.subtitle}</p>
        </div>
      </div>

      {/* Navigation Tabs for Faculty Coordinator */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-[var(--brass)] text-black shadow-md scale-105 font-extrabold'
              : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] border border-[var(--border)] hover:text-[var(--ink)]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Student Verification Queue ({pendingStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'bg-[var(--brass)] text-black shadow-md scale-105 font-extrabold'
              : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] border border-[var(--border)] hover:text-[var(--ink)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Department Process Monitoring & Live Drives
        </button>
      </div>

      {activeTab === 'approvals' ? (
        <>
          {/* Verification Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-aureate p-4">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-xs font-medium">Pending Approvals</span>
                <AlertCircle className="w-4 h-4 text-[var(--brass)]" />
              </div>
              <p className="text-xl font-bold font-mono">{pendingStudents.length} <span className="text-xs font-normal text-[var(--ink-muted)]">Students</span></p>
              <p className="text-[11px] text-[var(--brass)] mt-1">Awaiting Verification</p>
            </div>

            <div className="card-aureate p-4">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-xs font-medium">Verification Status</span>
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
              </div>
              <p className="text-xl font-bold font-mono text-[var(--success)]">Live Sync</p>
              <p className="text-[11px] text-[var(--success)] mt-1">Connected to DB Queue</p>
            </div>

            <div className="card-aureate p-4">
              <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
                <span className="text-xs font-medium">Scope / Scope Area</span>
                <FileText className="w-4 h-4 text-[var(--brass)]" />
              </div>
              <p className="text-xl font-bold font-mono">{portalInfo.deptLabel}</p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-1">{portalInfo.deptSub}</p>
            </div>
          </div>

          {/* Approval Table */}
          <div className="card-aureate p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--brass)]" />
                Live Verification Queue ({pendingStudents.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--brass)]" />
                Querying pending profiles from Supabase...
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--ink-muted)]">
                <CheckCircle className="w-8 h-8 text-[var(--success)] mx-auto mb-2" />
                No pending student registrations in queue!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--surface-alt)] border-b border-[var(--border)] text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">USN</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {pendingStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--surface-alt)]/50 transition">
                        <td className="p-3.5 font-bold">{s.name}</td>
                        <td className="p-3.5 font-mono text-[var(--brass)]">{s.email}</td>
                        <td className="p-3.5 font-mono text-[var(--ink-muted)]">{s.usn || 'N/A'}</td>
                        <td className="p-3.5 font-mono">{s.department || 'CSE'}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleReject(s.id)}
                            className="btn-aureate-secondary text-[11px] px-2.5 py-1 text-[var(--alert)] hover:bg-[var(--alert-soft)] border-none"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(s.id)}
                            className="btn-aureate-primary text-[11px] px-3 py-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* PROCESS MONITORING TAB FOR FACULTY */
        <LiveDriveOverview isFacultyView={true} showManagementControls={true} />
      )}
    </div>
  );
};
