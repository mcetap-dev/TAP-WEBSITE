import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ManageRecruitmentModal } from '../components/Dashboard/ManageRecruitmentModal';
import type { Drive } from '../types';
import { Search, Filter, Calendar, ChevronRight, Loader2, CheckCircle2, AlertCircle, Lock, ShieldCheck, ArrowLeft, Users } from 'lucide-react';

export const DrivesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const isStudent = role === 'student' || (!role && profile?.role === 'student');
  const [drives, setDrives] = useState<Drive[]>([]);
  const [appliedDriveIds, setAppliedDriveIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [showOnlyEligible, setShowOnlyEligible] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [recruitmentDrive, setRecruitmentDrive] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Keyboard navigation: Close detail modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDrive) {
        setSelectedDrive(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrive]);

  const loadDrivesAndApplications = useCallback(async () => {
    setLoading(true);
    const liveDrives = await api.getDrives();
    setDrives(liveDrives);

    if (user?.id) {
      const userApps = await api.getApplicationsForStudent(user.id);
      const ids = userApps.map((a) => a.drive_id);
      setAppliedDriveIds(ids);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadDrivesAndApplications();

    const handleUpdate = () => loadDrivesAndApplications();
    window.addEventListener('pc_drives_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pc_drives_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadDrivesAndApplications]);

  // Comprehensive Student Eligibility Evaluation
  const checkEligibility = (drive: Drive): { isEligible: boolean; reason?: string } => {
    // Resolve active student profile or fallback profile with realistic criteria
    const activeProfile = {
      name: profile?.name || 'Yashas H K',
      usn: profile?.usn || '4MC23IS126',
      department: profile?.department || 'Information Science Engineering',
      cgpa: profile?.cgpa ?? 8.70,
      active_backlogs: profile?.active_backlogs ?? 0,
      approval_status: profile?.approval_status || 'approved'
    };

    // 0. Verification check
    if (activeProfile.approval_status === 'pending' || activeProfile.approval_status === 'rejected') {
      return {
        isEligible: false,
        reason: 'Pending Faculty Verification'
      };
    }

    // 1. Backlog Limit Constraint
    const studentBacklogs = activeProfile.active_backlogs ?? 0;
    const maxBacklogs = drive.backlog_limit ?? 0;
    if (studentBacklogs > maxBacklogs) {
      return {
        isEligible: false,
        reason: `Exceeds Backlog Limit (${studentBacklogs} Backlogs, Max Allowed: ${maxBacklogs})`
      };
    }

    // 2. CGPA Cutoff Constraint
    const studentCgpa = activeProfile.cgpa ?? 0;
    const minCgpa = drive.cgpa_cutoff ?? 0;
    if (minCgpa > 0 && studentCgpa < minCgpa) {
      return {
        isEligible: false,
        reason: `Below CGPA Cutoff (${studentCgpa.toFixed(2)} CGPA, Required: ${minCgpa})`
      };
    }

    // 3. Branch Eligibility Constraint
    if (drive.eligibility_branches && drive.eligibility_branches.length > 0) {
      const dept = (activeProfile.department || '').trim().toLowerCase();
      const isBranchEligible = drive.eligibility_branches.some((branch) => {
        const b = branch.trim().toLowerCase();
        if (b === 'all') return true;
        if (dept.includes(b)) return true;
        if ((b === 'is' || b === 'ise') && (dept.includes('information') || dept.includes('is'))) return true;
        if ((b === 'cs' || b === 'cse') && (dept.includes('computer') || dept.includes('cs'))) return true;
        if ((b === 'ec' || b === 'ece') && (dept.includes('electronics') || dept.includes('ec'))) return true;
        if ((b === 'ee' || b === 'eee') && (dept.includes('electrical') || dept.includes('ee'))) return true;
        if ((b === 'me' || b === 'mech') && (dept.includes('mechanical') || dept.includes('me'))) return true;
        if ((b === 'cv' || b === 'civil') && (dept.includes('civil') || dept.includes('cv'))) return true;
        return false;
      });

      if (!isBranchEligible) {
        return {
          isEligible: false,
          reason: `Branch (${activeProfile.department || 'Dept'}) Ineligible`
        };
      }
    }

    return { isEligible: true };
  };

  const handleApply = async (driveId: string) => {
    if (!user) {
      navigate('/login', { state: { from: '/drives' } });
      return;
    }

    if (appliedDriveIds.includes(driveId)) {
      alert('You have already applied for this placement drive.');
      return;
    }

    const drive = drives.find((d) => d.id === driveId);
    if (drive) {
      const eligibility = checkEligibility(drive);
      if (!eligibility.isEligible) {
        alert(`Application Blocked by Eligibility Criteria:\n\n${eligibility.reason}`);
        return;
      }
    }

    setSubmitting(true);
    const { error } = await api.submitApplication(driveId, user.id);
    setSubmitting(false);

    if (error) {
      alert(`Application notice: ${error.message || 'Unable to record application.'}`);
    } else {
      alert('Application submitted successfully!');
      setAppliedDriveIds((prev) => [...prev, driveId]);
      setSelectedDrive(null);
    }
  };

  const renderActionButton = (drive: Drive, isModal = false) => {
    // For Staff / TPO / Faculty / Admin: Do NOT show Apply Now
    if (!isStudent) {
      if (role === 'tpo' || role === 'admin') {
        return (
          <button
            onClick={() => {
              if (isModal) setSelectedDrive(null);
              setRecruitmentDrive({
                id: drive.id,
                company: drive.company?.name || (typeof drive.company === 'string' ? drive.company : 'Company'),
                role: drive.role_title,
                ctc: drive.ctc_or_stipend
              });
            }}
            className="btn-aureate-primary text-xs px-3.5 py-1.5 font-bold shadow-md inline-flex items-center gap-1.5 hover:scale-105 transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Recruitment</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => setSelectedDrive(drive)}
          className="btn-aureate-secondary text-xs px-3.5 py-1.5 font-semibold"
        >
          View Specs
        </button>
      );
    }

    const isApplied = appliedDriveIds.includes(drive.id);
    const { isEligible, reason } = checkEligibility(drive);

    if (isApplied) {
      return (
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-default"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Applied
        </button>
      );
    }

    if (!isEligible) {
      return (
        <button
          disabled
          title={reason}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium cursor-not-allowed opacity-90 flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-red-400" />
          {reason ? (reason.length > 34 ? reason.slice(0, 32) + '...' : reason) : 'Ineligible'}
        </button>
      );
    }

    return (
      <button
        onClick={() => handleApply(drive.id)}
        disabled={submitting}
        className="btn-aureate-primary text-xs px-5 py-2 font-semibold shadow-md"
      >
        {submitting ? 'Submitting...' : isModal ? 'Submit Application' : 'Apply Now'}
      </button>
    );
  };

  const filteredDrives = drives.filter((d) => {
    const compName = d.company?.name || 'Company';
    const matchesSearch =
      compName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.role_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      selectedBranch === 'ALL' ||
      !d.eligibility_branches ||
      d.eligibility_branches.length === 0 ||
      d.eligibility_branches.some((branch: string) => {
        const b = branch.trim().toUpperCase();
        return b === 'ALL' || b === selectedBranch || b.includes(selectedBranch);
      });

    const matchesEligibleOnly = !showOnlyEligible || !isStudent || checkEligibility(d).isEligible;
    return matchesSearch && matchesBranch && matchesEligibleOnly;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Placement Drives Explorer</h2>
            <p className="text-sm text-[var(--ink-muted)]">
              {isStudent
                ? 'Live recruitment drives with automated CGPA, backlog, and branch eligibility filtering.'
                : 'Browse and inspect live recruitment drives and eligibility requirements across departments.'}
            </p>
          </div>
          {isStudent ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--brass)]" />
              <span>Profile: <strong className="text-[var(--brass)]">{profile?.cgpa ?? 8.70} CGPA</strong> • <strong className="text-amber-400">{profile?.active_backlogs ?? 0} Backlogs</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--brass)]/40 text-xs">
              <span className="badge-aureate badge-brass uppercase tracking-wider text-[11px] font-mono">
                {role || 'Staff'} Mode
              </span>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Filter by company or role title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[var(--brass)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Eligible Drives Only Switch (Students only) */}
            {isStudent && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--ink)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--brass)] transition">
                <input
                  type="checkbox"
                  checked={showOnlyEligible}
                  onChange={(e) => setShowOnlyEligible(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--brass)] focus:ring-0"
                />
                <span>Eligible Drives Only</span>
              </label>
            )}

            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-[var(--brass)] mb-0.5" />
              <span className="text-xs font-medium text-[var(--ink-muted)] mr-1">Branch:</span>
              {['ALL', 'CSE', 'ISE', 'ECE', 'EEE'].map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setSelectedBranch(branch)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedBranch === branch
                      ? 'bg-[var(--brass)] text-black font-extrabold shadow-md scale-105'
                      : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--brass)]'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drives Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brass)]" />
            Querying Supabase Drives table...
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="card-aureate p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-[var(--brass)] mx-auto" />
            <h3 className="font-bold text-sm">No Drives Found</h3>
            <p className="text-xs text-[var(--ink-muted)]">
              {showOnlyEligible && isStudent
                ? 'No recruitment drives match your current eligibility criteria (CGPA / Backlogs / Branch).'
                : 'Try adjusting your search query or branch filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrives.map((drive) => {
              const { isEligible, reason } = checkEligibility(drive);
              const isApplied = appliedDriveIds.includes(drive.id);

              return (
                <div
                  key={drive.id}
                  className={`card-aureate p-5 space-y-4 flex flex-col justify-between transition ${
                    isStudent && !isEligible ? 'opacity-90 border-red-500/20' : 'hover:border-[var(--brass)]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base">{drive.company?.name || 'Company'}</h3>
                        <p className="text-xs text-[var(--ink-muted)]">{drive.role_title}</p>
                      </div>
                      <span className="badge-aureate badge-brass font-mono">{drive.ctc_or_stipend || 'Competitive'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)] pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: {drive.application_deadline || 'Open'}
                      </span>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {drive.eligibility_branches?.map((b) => (
                        <span
                          key={b}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-alt)] border border-[var(--border)]"
                        >
                          {b}
                        </span>
                      ))}
                      {drive.cgpa_cutoff !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--brass-soft)] text-[var(--brass)]">
                          Min {drive.cgpa_cutoff} CGPA
                        </span>
                      )}
                      {drive.backlog_limit !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isStudent && (profile?.active_backlogs ?? 0) > drive.backlog_limit
                              ? 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'
                              : 'bg-[var(--surface-alt)] border-[var(--border)] text-[var(--ink-muted)]'
                          }`}
                        >
                          Max {drive.backlog_limit} Backlogs
                        </span>
                      )}
                    </div>

                    {isStudent && !isEligible && !isApplied && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium flex items-center gap-1.5 mt-2">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedDrive(drive)}
                      className="text-xs text-[var(--brass)] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Details & Rounds
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {renderActionButton(drive)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedDrive && (
          <div
            onClick={() => setSelectedDrive(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="card-aureate max-w-lg w-full p-6 space-y-4 bg-[var(--surface)] border-[var(--brass)] shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <span className="badge-aureate badge-brass">{selectedDrive.ctc_or_stipend || 'Competitive'}</span>
                  <h3 className="font-display font-bold text-xl mt-1">{selectedDrive.company?.name || 'Company'}</h3>
                  <p className="text-xs text-[var(--ink-muted)]">{selectedDrive.role_title}</p>
                </div>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--brass)] p-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2.5 py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Drives</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-1.5">
                  <h4 className="font-semibold text-xs text-[var(--brass)]">Eligibility Requirements</h4>
                  <p className="text-[var(--ink-muted)]">
                    Minimum CGPA:{' '}
                    <span className="font-mono font-bold text-[var(--ink)]">
                      {selectedDrive.cgpa_cutoff || 'N/A'}
                    </span>{' '}
                    • Backlog Limit:{' '}
                    <span className="font-mono font-bold text-[var(--ink)]">
                      {selectedDrive.backlog_limit ?? 0}
                    </span>
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    Target Branches:{' '}
                    <span className="font-mono text-[var(--ink)]">{selectedDrive.eligibility_branches?.join(', ') || 'ALL'}</span>
                  </p>

                  {isStudent && !checkEligibility(selectedDrive).isEligible && !appliedDriveIds.includes(selectedDrive.id) && (
                    <div className="pt-2">
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-xs flex items-center gap-2">
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <span>{checkEligibility(selectedDrive).reason}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-[var(--brass)] mb-1">Job Description</h4>
                  <p className="text-[var(--ink-muted)] leading-relaxed">
                    {selectedDrive.job_description ||
                      'Full-time campus placement role with competitive package and growth opportunities.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button onClick={() => setSelectedDrive(null)} className="btn-aureate-secondary text-xs">
                  Close
                </button>
                {renderActionButton(selectedDrive, true)}
              </div>
            </div>
          </div>
        )}

        {/* MANAGE RECRUITMENT MODAL */}
        <ManageRecruitmentModal
          isOpen={Boolean(recruitmentDrive)}
          onClose={() => setRecruitmentDrive(null)}
          drive={recruitmentDrive}
        />
      </div>
    </DashboardLayout>
  );
};
