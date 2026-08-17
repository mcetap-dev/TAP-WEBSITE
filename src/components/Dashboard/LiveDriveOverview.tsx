import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ManageRecruitmentModal } from './ManageRecruitmentModal';
import {
  Calendar,
  DollarSign,
  Users,
  Info,
  Play,
  Edit3,
  X,
  MoreVertical
} from 'lucide-react';

export interface ManagedDrive {
  id: string;
  company: string;
  role: string;
  ctc: string;
  deadline: string;
  status: 'upcoming' | 'active' | 'completed';
  appliedCount: number;
  attendedCount: number;
  branches?: string;
  cgpa?: number;
  backlogs?: number;
  description?: string;
}

export const LiveDriveOverview: React.FC<{
  isFacultyView?: boolean;
  showManagementControls?: boolean;
  onOpenCreateWizard?: () => void;
}> = ({ isFacultyView = false, showManagementControls = true, onOpenCreateWizard: _onOpenCreateWizard }) => {
  const [drives, setDrives] = useState<ManagedDrive[]>([]);
  const [selectedQRDrive, setSelectedQRDrive] = useState<ManagedDrive | null>(null);
  const [selectedDetailDrive, setSelectedDetailDrive] = useState<ManagedDrive | null>(null);
  const [selectedApplicantsDrive, setSelectedApplicantsDrive] = useState<ManagedDrive | null>(null);
  const [selectedRecruitmentDrive, setSelectedRecruitmentDrive] = useState<ManagedDrive | null>(null);
  const [editingDrive, setEditingDrive] = useState<ManagedDrive | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [activeApplicantMenu, setActiveApplicantMenu] = useState<string | null>(null);

  // Edit drive form state
  const [editFormData, setEditFormData] = useState({
    company: '',
    role: '',
    ctc: '',
    deadline: '',
    branches: '',
    cgpa: '7.5',
    backlogs: '0',
    description: ''
  });

  const syncDrivesFromStorage = async () => {
    try {
      const allDrives = await api.getDrives();
      const mappedList: ManagedDrive[] = allDrives.map((d) => {
        let mappedStatus: 'upcoming' | 'active' | 'completed' = 'active';
        if (d.status === 'open' || d.status === 'active') mappedStatus = 'active';
        else if (d.status === 'completed') mappedStatus = 'completed';
        else if (d.status === 'upcoming' || d.status === 'draft' || d.status === 'closed') mappedStatus = 'upcoming';

        const rawCtc = d.ctc_or_stipend || '₹12.0 LPA';
        const formattedCtc = rawCtc.startsWith('₹') ? rawCtc : `₹${rawCtc}`;

        return {
          id: d.id,
          company: d.company?.name || (typeof d.company === 'string' ? d.company : 'Company'),
          role: d.role_title,
          ctc: formattedCtc,
          deadline: d.application_deadline || '30/8/2026',
          status: mappedStatus,
          appliedCount: 0,
          attendedCount: 0,
          branches: Array.isArray(d.eligibility_branches) ? d.eligibility_branches.join(', ') : 'ALL',
          cgpa: d.cgpa_cutoff,
          backlogs: d.backlog_limit,
          description: d.job_description || 'Campus recruitment drive for eligible candidates.'
        };
      });

      setDrives(mappedList);
      loadRealAppCounts(mappedList);
    } catch (e) {
      console.warn('Error syncing drives in LiveDriveOverview:', e);
    }
  };

  const [realAppCounts, setRealAppCounts] = useState<{ [driveId: string]: number }>({});

  const loadRealAppCounts = async (drivesList: ManagedDrive[]) => {
    try {
      const countsMap: { [key: string]: number } = {};
      for (const d of drivesList) {
        const apps = await api.getApplicationsForDrive(d.id);
        countsMap[d.id] = apps.length;
      }
      setRealAppCounts(countsMap);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncDrivesFromStorage();

    const handleUpdate = () => syncDrivesFromStorage();
    window.addEventListener('pc_drives_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pc_drives_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleStatusChange = async (driveId: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    setDrives((prev) =>
      prev.map((d) => (d.id === driveId ? { ...d, status: newStatus } : d))
    );

    try {
      const stored = localStorage.getItem('pc_custom_drives');
      let customList: any[] = stored ? JSON.parse(stored) : [];
      const drive = drives.find((d) => d.id === driveId);
      const companyName = drive?.company || '';

      const idx = customList.findIndex(
        (c) => c.id === driveId || (companyName && c.company?.toLowerCase() === companyName.toLowerCase())
      );
      if (idx !== -1) {
        customList[idx].status = newStatus;
      } else {
        customList.push({ id: driveId, company: companyName, status: newStatus });
      }
      localStorage.setItem('pc_custom_drives', JSON.stringify(customList));
    } catch {
      // ignore
    }

    window.dispatchEvent(new CustomEvent('pc_drives_updated', { detail: { driveId, status: newStatus } }));
    await api.updateDriveStatus(driveId, newStatus as any);
  };

  const handleOpenApplicantsModal = async (drive: ManagedDrive) => {
    setSelectedApplicantsDrive(drive);
    setLoadingApplicants(true);
    const data = await api.getApplicationsForDrive(drive.id);
    setApplicantsList(data);
    setLoadingApplicants(false);
  };

  const handleUpdateApplicantStatus = async (appId: string, newStatus: string) => {
    setApplicantsList((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    setActiveApplicantMenu(null);
    await api.updateApplicationStatus(appId, newStatus);
  };

  const handleOpenEditModal = (drive: ManagedDrive) => {
    setEditingDrive(drive);
    setEditFormData({
      company: drive.company,
      role: drive.role,
      ctc: drive.ctc.replace('₹', ''),
      deadline: drive.deadline,
      branches: drive.branches || 'ALL',
      cgpa: (drive.cgpa ?? 7.5).toString(),
      backlogs: (drive.backlogs ?? 0).toString(),
      description: drive.description || ''
    });
  };

  const handleSaveEditDrive = async () => {
    if (!editingDrive) return;

    const updatedDrive: ManagedDrive = {
      ...editingDrive,
      company: editFormData.company,
      role: editFormData.role,
      ctc: editFormData.ctc.startsWith('₹') ? editFormData.ctc : `₹${editFormData.ctc}`,
      deadline: editFormData.deadline,
      branches: editFormData.branches,
      cgpa: parseFloat(editFormData.cgpa) || 7.0,
      backlogs: parseInt(editFormData.backlogs, 10) || 0,
      description: editFormData.description
    };

    setDrives((prev) => prev.map((d) => (d.id === editingDrive.id ? updatedDrive : d)));

    await api.updateDrive(editingDrive.id, {
      role_title: updatedDrive.role,
      ctc_or_stipend: updatedDrive.ctc,
      application_deadline: updatedDrive.deadline,
      eligibility_branches: (updatedDrive.branches || 'ALL').split(',').map((b) => b.trim()).filter(Boolean),
      cgpa_cutoff: updatedDrive.cgpa,
      backlog_limit: updatedDrive.backlogs,
      job_description: updatedDrive.description,
      company: updatedDrive.company
    });

    setEditingDrive(null);
    alert(`Updated drive details for ${updatedDrive.company} successfully!`);
  };

  const getStatusColor = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'completed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getProgressPercentage = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return '0%';
      case 'active':
        return '50%';
      case 'completed':
        return '100%';
    }
  };

  // Helper to parse branch string into array of short badges
  const parseBranchBadges = (branchesStr?: string) => {
    if (!branchesStr || branchesStr.toUpperCase() === 'ALL') {
      return ['ME', 'IS', 'EC', 'EE', 'CS', 'CV'];
    }
    return branchesStr
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
      .map((b) => {
        const u = b.toUpperCase();
        if (u === 'CSE') return 'CS';
        if (u === 'ISE') return 'IS';
        if (u === 'ECE') return 'EC';
        if (u === 'EEE') return 'EE';
        if (u === 'MECH') return 'ME';
        if (u === 'CIVIL') return 'CV';
        return u;
      });
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--brass)] block mb-1">
            {isFacultyView ? 'Department Process Monitoring' : 'Live Drive Management'}
          </span>
          <h2 className="text-xl font-display font-bold text-[var(--ink)] tracking-wider">
            LIVE DRIVE STATUS OVERVIEW
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[var(--surface-alt)] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{drives.filter((d) => d.status === 'active').length} Active Drives Live</span>
        </div>
      </div>

      {/* DRIVES LIST */}
      <div className="space-y-5">
        {drives.map((drive) => {
          const progress = getProgressPercentage(drive.status);
          const branchBadges = parseBranchBadges(drive.branches);

          return (
            <div
              key={drive.id}
              className="card-aureate p-5 space-y-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brass)]/50 transition-all shadow-md rounded-2xl"
            >
              {/* TOP ROW: Company Title, Role & Status Badge Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-2xl text-[var(--ink)] tracking-wide capitalize">
                    {drive.company}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--brass)] mt-0.5">{drive.role}</p>
                </div>

                {/* STATUS SELECTOR DROPDOWN */}
                {showManagementControls ? (
                  <div className="relative inline-block">
                    <select
                      value={drive.status}
                      onChange={(e) =>
                        handleStatusChange(drive.id, e.target.value as 'upcoming' | 'active' | 'completed')
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border outline-none cursor-pointer appearance-none pr-8 transition-all ${getStatusColor(
                        drive.status
                      )}`}
                    >
                      <option value="upcoming" className="bg-[var(--surface)] text-blue-400 font-bold">
                        UPCOMING
                      </option>
                      <option value="active" className="bg-[var(--surface)] text-emerald-400 font-bold">
                        ACTIVE
                      </option>
                      <option value="completed" className="bg-[var(--surface)] text-amber-400 font-bold">
                        COMPLETED
                      </option>
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold">
                      ▼
                    </div>
                  </div>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold tracking-wider uppercase border ${getStatusColor(
                      drive.status
                    )}`}
                  >
                    {drive.status}
                  </span>
                )}
              </div>

              {/* DETAILS LINE: Package & Deadline */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--ink-muted)] border-t border-b border-[var(--border)]/60 py-2.5">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[var(--brass)]" />
                  <span>
                    Package: <strong className="text-[var(--brass)] font-mono">{drive.ctc}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--ink-muted)]" />
                  <span>
                    Deadline: <strong className="text-[var(--ink)] font-mono">{drive.deadline}</strong>
                  </span>
                </div>
              </div>

              {/* BRANCH BADGES CHIPS (Matching Screenshot 2) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {branchBadges.map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider"
                  >
                    {b}
                  </span>
                ))}
              </div>

              {/* PROGRESS STEPPER BAR */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[var(--ink-muted)] px-1">
                  <span className={drive.status === 'upcoming' || drive.status === 'active' || drive.status === 'completed' ? 'text-[var(--brass)] font-bold' : ''}>
                    Upcoming
                  </span>
                  <span className={drive.status === 'active' || drive.status === 'completed' ? 'text-[var(--brass)] font-bold' : ''}>
                    Active
                  </span>
                  <span className={drive.status === 'completed' ? 'text-[var(--brass)] font-bold' : ''}>
                    Completed
                  </span>
                </div>

                {/* Progress Bar Track with Nodes */}
                <div className="relative w-full h-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-full overflow-visible flex items-center justify-between px-2">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[var(--brass-soft)] via-[var(--brass)] to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: progress }}
                  />

                  <div
                    className={`w-3.5 h-3.5 rounded-full z-10 border-2 transition-all ${
                      drive.status === 'upcoming' || drive.status === 'active' || drive.status === 'completed'
                        ? 'bg-[var(--brass)] border-[var(--brass)] shadow-lg scale-110'
                        : 'bg-[var(--surface-alt)] border-[var(--border)]'
                    }`}
                  />

                  <div
                    className={`w-3.5 h-3.5 rounded-full z-10 border-2 transition-all ${
                      drive.status === 'active' || drive.status === 'completed'
                        ? 'bg-[var(--brass)] border-[var(--brass)] shadow-lg scale-110'
                        : 'bg-[var(--surface-alt)] border-[var(--border)]'
                    }`}
                  />

                  <div
                    className={`w-3.5 h-3.5 rounded-full z-10 border-2 transition-all ${
                      drive.status === 'completed'
                        ? 'bg-amber-400 border-amber-400 shadow-lg scale-110'
                        : 'bg-[var(--surface-alt)] border-[var(--border)]'
                    }`}
                  />
                </div>
              </div>

              {/* PRIMARY MANAGE RECRUITMENT BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecruitmentDrive(drive)}
                  className="w-full btn-aureate-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Recruitment</span>
                </button>
              </div>

              {/* BOTTOM 4 ACTION BUTTONS (Exact match to Screenshot 2) */}
              <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-[var(--border)]">
                {/* 1. Details Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailDrive(drive)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--brass)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--brass)] transition hover:bg-[var(--surface-alt)]/80"
                >
                  <Info className="w-4 h-4 text-[var(--brass)]" />
                  <span>Details</span>
                </button>

                {/* 2. Applied (N) Applicants Button */}
                <button
                  type="button"
                  onClick={() => handleOpenApplicantsModal(drive)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--brass)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--brass)] transition hover:bg-[var(--surface-alt)]/80"
                >
                  <Users className="w-4 h-4 text-[var(--brass)]" />
                  <span>Applied ({realAppCounts[drive.id] ?? 0})</span>
                </button>

                {/* 3. Recruit Button */}
                <button
                  type="button"
                  onClick={() => setSelectedQRDrive(drive)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--brass)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--brass)] transition hover:bg-[var(--surface-alt)]/80"
                >
                  <Play className="w-4 h-4 text-[var(--brass)]" />
                  <span>Recruit</span>
                </button>

                {/* 4. Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(drive)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--brass)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--brass)] transition hover:bg-[var(--surface-alt)]/80"
                >
                  <Edit3 className="w-4 h-4 text-[var(--brass)]" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>



      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. APPLICANTS BOTTOM SHEET / MODAL (Exact match to Screenshot 1) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedApplicantsDrive && (
        <div
          onClick={() => setSelectedApplicantsDrive(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-display font-bold text-2xl text-[var(--ink)]">Applicants</h3>
                <p className="text-xs font-semibold text-[var(--ink-muted)]">
                  {selectedApplicantsDrive.company} — {selectedApplicantsDrive.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedApplicantsDrive(null)}
                className="p-2 rounded-full hover:bg-[var(--surface-alt)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicants Cards List */}
            {loadingApplicants ? (
              <div className="p-8 text-center text-sm font-mono text-[var(--ink-muted)]">
                Loading applicant records...
              </div>
            ) : applicantsList.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--ink-muted)]">
                No student applications received yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {applicantsList.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-start justify-between gap-3 relative hover:border-[var(--brass)]/50 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar Circle */}
                      <div className="w-11 h-11 rounded-full bg-[var(--brass-soft)] border border-[var(--brass)]/40 flex items-center justify-center font-bold text-[var(--brass)] text-lg shrink-0">
                        {app.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-[var(--ink)] leading-tight">{app.name}</h4>
                        <p className="text-xs font-mono text-[var(--ink-muted)]">
                          {app.usn} • {app.department}
                        </p>
                        <p className="text-xs font-semibold font-mono text-[var(--brass)]">
                          CGPA: {typeof app.cgpa === 'number' ? app.cgpa.toFixed(2) : app.cgpa}
                        </p>
                      </div>
                    </div>

                    {/* Status & Options */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[var(--brass-soft)] text-[var(--brass)] text-[10px] font-extrabold uppercase font-mono tracking-wider border border-[var(--brass)]/30">
                          {app.status}
                        </span>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveApplicantMenu(activeApplicantMenu === app.id ? null : app.id)
                            }
                            className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeApplicantMenu === app.id && (
                            <div className="absolute right-0 top-7 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-1 space-y-1 text-xs font-semibold">
                              <button
                                onClick={() => handleUpdateApplicantStatus(app.id, 'SHORTLISTED')}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-emerald-400"
                              >
                                Shortlist Candidate
                              </button>
                              <button
                                onClick={() => handleUpdateApplicantStatus(app.id, 'INTERVIEW')}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-blue-400"
                              >
                                Move to Interview
                              </button>
                              <button
                                onClick={() => handleUpdateApplicantStatus(app.id, 'SELECTED')}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--brass)]"
                              >
                                Select Candidate
                              </button>
                              <button
                                onClick={() => handleUpdateApplicantStatus(app.id, 'REJECTED')}
                                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-rose-400"
                              >
                                Reject Candidate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                        {app.applied_at}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. EDIT DRIVE MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {editingDrive && (
        <div
          onClick={() => setEditingDrive(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--brass)] rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-xl text-[var(--ink)] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--brass)]" />
                Edit Drive Details
              </h3>
              <button
                onClick={() => setEditingDrive(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-alt)] text-[var(--ink-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Role Title</label>
                <input
                  type="text"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Package (CTC)</label>
                  <input
                    type="text"
                    value={editFormData.ctc}
                    onChange={(e) => setEditFormData({ ...editFormData, ctc: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Deadline</label>
                  <input
                    type="text"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editFormData.cgpa}
                    onChange={(e) => setEditFormData({ ...editFormData, cgpa: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Backlogs Allowed</label>
                  <input
                    type="number"
                    value={editFormData.backlogs}
                    onChange={(e) => setEditFormData({ ...editFormData, backlogs: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Eligible Branches</label>
                <input
                  type="text"
                  value={editFormData.branches}
                  onChange={(e) => setEditFormData({ ...editFormData, branches: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 focus:border-[var(--brass)] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setEditingDrive(null)}
                className="btn-aureate-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditDrive}
                className="btn-aureate-primary text-xs py-2 px-5 font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. DETAILS MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedDetailDrive && (
        <div
          onClick={() => setSelectedDetailDrive(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--brass)] rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[var(--brass)] uppercase">Drive Specification Sheet</span>
                <h3 className="font-display font-bold text-2xl text-[var(--ink)]">
                  {selectedDetailDrive.company}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailDrive(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-alt)] text-[var(--ink-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-1">
                <p className="text-[11px] text-[var(--ink-muted)]">Target Role Title</p>
                <p className="text-base font-bold text-[var(--brass)]">{selectedDetailDrive.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--ink-muted)] uppercase">Package Offer</p>
                  <p className="text-base font-bold text-[var(--brass)]">{selectedDetailDrive.ctc}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--ink-muted)] uppercase">Deadline</p>
                  <p className="text-base font-bold text-[var(--ink)]">{selectedDetailDrive.deadline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--ink-muted)] uppercase">CGPA Cutoff</p>
                  <p className="text-base font-bold text-[var(--ink)]">{selectedDetailDrive.cgpa ?? 7.5}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--ink-muted)] uppercase">Max Backlogs</p>
                  <p className="text-base font-bold text-[var(--ink)]">{selectedDetailDrive.backlogs ?? 0}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-1">
                <p className="text-[10px] text-[var(--ink-muted)] uppercase font-mono">Eligible Branches</p>
                <p className="text-xs font-semibold text-[var(--ink)]">{selectedDetailDrive.branches || 'ALL Branches'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-1">
                <p className="text-[10px] text-[var(--ink-muted)] uppercase font-mono">Job Description</p>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {selectedDetailDrive.description || 'Corporate recruitment drive for eligible department candidates.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDetailDrive(null)}
              className="btn-aureate-secondary text-xs w-full py-2.5 font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. RECRUIT / QR & ATTENDANCE TRACKER MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedQRDrive && (
        <div
          onClick={() => setSelectedQRDrive(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-aureate max-w-md w-full p-6 space-y-5 bg-[var(--surface)] border border-[var(--brass)] shadow-2xl rounded-3xl text-center"
          >
            <div className="border-b border-[var(--border)] pb-3">
              <span className="text-[10px] font-mono uppercase text-[var(--brass)]">Recruitment Passcode & Scanner</span>
              <h3 className="font-display font-bold text-xl text-[var(--ink)]">
                {selectedQRDrive.company} — {selectedQRDrive.role}
              </h3>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border border-gray-300">
              <div className="w-44 h-44 bg-black flex items-center justify-center text-white font-mono text-xs rounded-xl p-2 text-center">
                [LIVE RECRUITMENT QR CODE]
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block">Total Applicants</span>
                <span className="font-mono text-lg font-bold text-[var(--ink)]">{selectedQRDrive.appliedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block">Scanned & Attended</span>
                <span className="font-mono text-lg font-bold text-emerald-400">{selectedQRDrive.attendedCount}</span>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-3 rounded-xl border border-[var(--border)]">
              <p className="text-[11px] text-[var(--ink-muted)] mb-1 font-mono">Round 1 Verification Passcode</p>
              <p className="text-2xl font-bold font-mono text-[var(--brass)] tracking-widest">849-201</p>
            </div>

            <button
              onClick={() => setSelectedQRDrive(null)}
              className="btn-aureate-secondary text-xs w-full py-2.5 font-bold"
            >
              Close Recruitment Tracker
            </button>
          </div>
        </div>
      )}

      {/* 5. MANAGE RECRUITMENT ROUNDS MODAL */}
      <ManageRecruitmentModal
        isOpen={Boolean(selectedRecruitmentDrive)}
        onClose={() => setSelectedRecruitmentDrive(null)}
        drive={selectedRecruitmentDrive}
      />
    </div>
  );
};
