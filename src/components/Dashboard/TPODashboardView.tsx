import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LiveDriveOverview } from './LiveDriveOverview';
import { ManageRecruitmentModal } from './ManageRecruitmentModal';
import {
  Briefcase,
  Users,
  Building,
  Plus,
  QrCode,
  TrendingUp,
  CheckCircle2,
  Lock,
  Clock,
  Settings,
  X,
  Save,
  ShieldCheck,
  Activity
} from 'lucide-react';

export interface DriveItem {
  id: string;
  company: string;
  role: string;
  ctc: string;
  branches: string;
  status: 'open' | 'closed' | 'draft' | 'completed';
  applicants: number;
  cgpa?: number;
  backlogs?: number;
}

export const TPODashboardView: React.FC = () => {
  const [showDriveWizard, setShowDriveWizard] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<DriveItem | null>(null);
  const [selectedRecruitmentDrive, setSelectedRecruitmentDrive] = useState<DriveItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'drives' | 'companies'>('overview');

  // Form state for creating a new drive
  const [newDriveData, setNewDriveData] = useState({
    company: '',
    role: '',
    ctc: '',
    cgpa: '7.5',
    backlogs: '0',
    branches: 'CSE, ISE, ECE',
    deadline: '2026-08-30',
    description: ''
  });

  const [drivesList, setDrivesList] = useState<DriveItem[]>([]);

  const INITIAL_COMPANIES = [
    { name: 'Google', industry: 'Technology', hr: 'Sarah Jenkins', email: 'sarah@google.com' },
    { name: 'Microsoft', industry: 'Software', hr: 'David Miller', email: 'david@microsoft.com' },
    { name: 'Amazon', industry: 'E-Commerce & Cloud', hr: 'Elena Rostova', email: 'elena@amazon.com' },
  ];

  const syncTPODrives = async () => {
    try {
      const allDrives = await api.getDrives();
      const mapped: DriveItem[] = allDrives.map((d) => ({
        id: d.id,
        company: d.company?.name || (typeof d.company === 'string' ? d.company : 'Company'),
        role: d.role_title,
        ctc: d.ctc_or_stipend || 'Competitive',
        branches: Array.isArray(d.eligibility_branches) ? d.eligibility_branches.join(', ') : 'ALL',
        status: (d.status === 'active' ? 'open' : d.status === 'upcoming' ? 'open' : d.status) as any,
        applicants: 0,
        cgpa: d.cgpa_cutoff,
        backlogs: d.backlog_limit
      }));
      setDrivesList(mapped);
    } catch (e) {
      console.warn('Error loading custom drives in TPODashboardView:', e);
    }
  };

  const getDynamicCompaniesList = () => {
    const compMap = new Map<string, any>();
    INITIAL_COMPANIES.forEach((c) => compMap.set(c.name.toLowerCase(), { ...c, drives: 0 }));

    try {
      const stored = localStorage.getItem('pc_custom_companies');
      if (stored) {
        const customComps: any[] = JSON.parse(stored);
        customComps.forEach((c) => {
          compMap.set(c.name.toLowerCase(), { ...c, drives: 0 });
        });
      }
    } catch {
      // ignore
    }

    drivesList.forEach((d) => {
      const key = d.company.toLowerCase();
      if (compMap.has(key)) {
        const item = compMap.get(key);
        compMap.set(key, { ...item, drives: item.drives + 1 });
      } else {
        compMap.set(key, {
          name: d.company,
          industry: 'Corporate Partner',
          hr: 'Placement HR Team',
          email: `careers@${d.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          drives: 1
        });
      }
    });

    return Array.from(compMap.values());
  };

  const dynamicCompaniesList = getDynamicCompaniesList();

  useEffect(() => {
    syncTPODrives();

    const handleUpdate = () => syncTPODrives();
    const handleOpenWizard = () => setShowDriveWizard(true);

    window.addEventListener('pc_drives_updated', handleUpdate);
    window.addEventListener('pc_open_create_drive', handleOpenWizard);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pc_drives_updated', handleUpdate);
      window.removeEventListener('pc_open_create_drive', handleOpenWizard);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenManageModal = (drive: DriveItem) => {
    setSelectedDrive(drive);
    setShowManageModal(true);
  };

  const handleOpenManageRecruitment = (drive: DriveItem) => {
    setSelectedRecruitmentDrive(drive);
    setShowRecruitmentModal(true);
  };

  const handleUpdateStatus = async (driveId: string, newStatus: 'open' | 'closed' | 'draft' | 'completed') => {
    setDrivesList((prev) =>
      prev.map((d) => (d.id === driveId ? { ...d, status: newStatus } : d))
    );
    if (selectedDrive && selectedDrive.id === driveId) {
      setSelectedDrive((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    await api.updateDriveStatus(driveId, newStatus);
  };

  const handleToggleBranch = (branch: string) => {
    let current = newDriveData.branches
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    if (branch === 'ALL') {
      if (current.includes('ALL')) {
        setNewDriveData((prev) => ({ ...prev, branches: '' }));
      } else {
        setNewDriveData((prev) => ({ ...prev, branches: 'ALL' }));
      }
      return;
    }

    current = current.filter((b) => b !== 'ALL');

    if (current.includes(branch)) {
      current = current.filter((b) => b !== branch);
    } else {
      current.push(branch);
    }

    setNewDriveData((prev) => ({ ...prev, branches: current.join(', ') }));
  };

  const handlePublishNewDrive = async () => {
    if (!newDriveData.company || !newDriveData.role) {
      alert('Please fill in company name and role title.');
      return;
    }

    const payload = {
      id: `drive_${Date.now()}`,
      company: newDriveData.company,
      role: newDriveData.role,
      ctc: newDriveData.ctc ? (newDriveData.ctc.includes('LPA') || newDriveData.ctc.startsWith('₹') ? newDriveData.ctc : `₹${newDriveData.ctc} LPA`) : '₹12.0 LPA',
      branches: newDriveData.branches || 'ALL',
      status: 'open' as const,
      cgpa: parseFloat(newDriveData.cgpa) || 7.0,
      backlogs: parseInt(newDriveData.backlogs, 10) || 0,
      deadline: newDriveData.deadline || '2026-08-30',
      description: newDriveData.description || 'Campus recruitment drive for eligible candidates.'
    };

    await api.createDrive(payload);
    await syncTPODrives();

    setShowDriveWizard(false);
    setNewDriveData({
      company: '',
      role: '',
      ctc: '',
      cgpa: '7.5',
      backlogs: '0',
      branches: 'CSE, ISE, ECE',
      deadline: '2026-08-30',
      description: ''
    });
    alert(`Placement drive for ${payload.company} published successfully!`);
  };

  const getStatusBadge = (status: 'open' | 'closed' | 'draft' | 'completed') => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold capitalize"><CheckCircle2 className="w-3 h-3" /> Open</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold capitalize"><Lock className="w-3 h-3" /> Closed</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-semibold capitalize"><Clock className="w-3 h-3" /> Draft</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold capitalize"><ShieldCheck className="w-3 h-3" /> Completed</span>;
    }
  };

  const [dbMetrics, setDbMetrics] = useState({
    totalStudents: 1,
    approvedStudents: 1,
    verificationRate: 100,
    totalCompanies: 3
  });

  useEffect(() => {
    loadLiveMetrics();
  }, []);

  const loadLiveMetrics = async () => {
    const res = await api.getDashboardMetrics();
    setDbMetrics(res);
  };

  const parseCTC = (ctcStr: string): number => {
    const match = ctcStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const validCTCs = drivesList
    .map((d) => ({
      val: parseCTC(d.ctc),
      company: d.company,
      raw: d.ctc
    }))
    .filter((d) => d.val > 0);

  const avgCTCVal =
    validCTCs.length > 0
      ? (validCTCs.reduce((acc, curr) => acc + curr.val, 0) / validCTCs.length).toFixed(1)
      : '12.4';

  const highestDrive =
    validCTCs.length > 0
      ? validCTCs.reduce((max, curr) => (curr.val > max.val ? curr : max), validCTCs[0])
      : { val: 32, company: 'Google', raw: '32 LPA' };

  const openDrivesCount = drivesList.filter(
    (d) => d.status === 'open' || (d.status as any) === 'active'
  ).length;

  const uniqueCompaniesCount = Math.max(
    dbMetrics.totalCompanies,
    new Set([...drivesList.map((d) => d.company), ...INITIAL_COMPANIES.map((c: any) => c.name)]).size
  );

  const activeDrivesList = drivesList.filter(
    (d) => d.status === 'open' || (d.status as any) === 'active'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="badge-aureate badge-brass mb-1">TPO Admin Portal</span>
          <h2 className="text-2xl font-display font-bold">Training & Placement Control Center</h2>
          <p className="text-sm text-[var(--ink-muted)]">Manage drive lifecycles, company onboarding, round progression, and student eligibility.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-aureate-secondary text-xs"
          >
            <QrCode className="w-4 h-4 text-[var(--brass)]" />
            Generate Drive QR
          </button>
          <button
            onClick={() => setShowDriveWizard(true)}
            className="btn-aureate-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            Create Placement Drive
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards (Real Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <Users className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">
            {dbMetrics.totalStudents.toLocaleString()} <span className="text-xs font-normal text-[var(--ink-muted)]">Students</span>
          </p>
          <p className="text-[11px] text-[var(--success)] mt-1">
            {dbMetrics.verificationRate}% Verified by Faculty
          </p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Active Placement Drives</span>
            <Briefcase className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">
            {drivesList.length} <span className="text-xs font-normal text-[var(--ink-muted)]">Drives</span>
          </p>
          <p className="text-[11px] text-[var(--info)] mt-1">
            {openDrivesCount} Open for Applications
          </p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Onboarded Companies</span>
            <Building className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">
            {uniqueCompaniesCount} <span className="text-xs font-normal text-[var(--ink-muted)]">Partners</span>
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">Tier-1 & Core Recruiters</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Average Package</span>
            <TrendingUp className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--brass)]">{avgCTCVal} LPA</p>
          <p className="text-[11px] text-[var(--success)] mt-1">
            Highest: {highestDrive.val} LPA ({highestDrive.company})
          </p>
        </div>
      </div>

      {/* MANAGE DRIVE & STATUS MODAL */}
      {showManageModal && selectedDrive && (
        <div
          onClick={() => setShowManageModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-aureate max-w-2xl w-full p-6 space-y-6 bg-[var(--surface)] border border-[var(--brass)] shadow-2xl rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brass)]">Drive Lifecycle Control</span>
                <h3 className="font-display font-bold text-xl flex items-center gap-2 text-[var(--ink)]">
                  <Settings className="w-5 h-5 text-[var(--brass)]" />
                  {selectedDrive.company} — {selectedDrive.role}
                </h3>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STATUS UPDATE CONTROLS */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                Current Drive Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'open', label: 'Open (Active)', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                  { key: 'closed', label: 'Closed (Locked)', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                  { key: 'draft', label: 'Draft Mode', color: 'border-slate-500 text-slate-400 bg-slate-500/10' },
                  { key: 'completed', label: 'Completed', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedDrive.id, s.key as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedDrive.status === s.key
                        ? `${s.color} font-extrabold ring-2 ring-offset-1 ring-offset-[var(--surface)] shadow-lg scale-105`
                        : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {selectedDrive.status === s.key && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DRIVE PARAMETERS SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] text-xs">
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">CTC Package</span>
                <span className="font-mono font-bold text-[var(--brass)]">{selectedDrive.ctc}</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Eligible Branches</span>
                <span className="font-semibold text-[var(--ink)]">{selectedDrive.branches}</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Applicants</span>
                <span className="font-mono font-bold text-[var(--ink)]">{selectedDrive.applicants} Students</span>
              </div>
            </div>

            {/* RECRUITMENT ROUNDS TRACKER */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                Recruitment Rounds & Progression
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">1</span>
                    <div>
                      <p className="font-bold">Round 1: Online Technical & Aptitude Assessment</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Passcode: 849201 • 142 Candidates Evaluated</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">Completed</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--brass)]/40">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--brass-soft)] text-[var(--brass)] font-bold text-xs flex items-center justify-center">2</span>
                    <div>
                      <p className="font-bold text-[var(--brass)]">Round 2: Technical Interview</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Live Assessment • 48 Candidates Shortlisted</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--brass-soft)] text-[var(--brass)] text-[11px] font-semibold">In Progress</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center">3</span>
                    <div>
                      <p className="font-bold">Round 3: HR & Management Discussion</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Final Offer Release & Verification</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 text-[11px] font-semibold">Scheduled</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Drive status for ${selectedDrive.company} updated to ${selectedDrive.status.toUpperCase()}`);
                  setShowManageModal(false);
                }}
                className="btn-aureate flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider"
              >
                <Save className="w-4 h-4" /> Save Status & Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVE CREATION WIZARD MODAL */}
      {showDriveWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-aureate max-w-xl w-full p-6 space-y-4 bg-[var(--surface)] border border-[var(--brass)] rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--brass)]" />
                Create New Placement Drive
              </h3>
              <button onClick={() => setShowDriveWizard(false)} className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]">Cancel</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Amazon, Oracle"
                  value={newDriveData.company}
                  onChange={(e) => setNewDriveData((prev) => ({ ...prev, company: e.target.value }))}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={newDriveData.role}
                    onChange={(e) => setNewDriveData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CTC / Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. 18 LPA"
                    value={newDriveData.ctc}
                    onChange={(e) => setNewDriveData((prev) => ({ ...prev, ctc: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="7.5"
                    value={newDriveData.cgpa}
                    onChange={(e) => setNewDriveData((prev) => ({ ...prev, cgpa: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Backlog Limit</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newDriveData.backlogs}
                    onChange={(e) => setNewDriveData((prev) => ({ ...prev, backlogs: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-xs">Eligible Branches</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewDriveData((prev) => ({ ...prev, branches: e.target.value }));
                      }
                    }}
                    className="bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[11px] px-2 py-1 focus:border-[var(--brass)] outline-none text-[var(--brass)] font-semibold cursor-pointer"
                  >
                    <option value="">-- Quick Branch Presets --</option>
                    <option value="ALL">ALL Branches</option>
                    <option value="CSE, ISE">CSE & ISE (Tech)</option>
                    <option value="CSE, ISE, ECE">CSE, ISE & ECE</option>
                    <option value="ECE, EEE">ECE & EEE (Circuit)</option>
                    <option value="MECH, CIVIL">MECH & CIVIL (Core)</option>
                  </select>
                </div>

                {/* Interactive Multi-Select Pills */}
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
                  {['ALL', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL'].map((b) => {
                    const selectedList = newDriveData.branches
                      .split(',')
                      .map((x) => x.trim().toUpperCase());
                    const isSelected = selectedList.includes(b);

                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleBranch(b)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[var(--brass)] text-black font-extrabold shadow-md scale-105'
                            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Selected branches: CSE, ISE, ECE..."
                  value={newDriveData.branches}
                  onChange={(e) => setNewDriveData((prev) => ({ ...prev, branches: e.target.value }))}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={newDriveData.deadline}
                  onChange={(e) => setNewDriveData((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Job Description & Details</label>
                <textarea
                  rows={3}
                  placeholder="Enter job summary, requirements, and responsibilities..."
                  value={newDriveData.description}
                  onChange={(e) => setNewDriveData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowDriveWizard(false)} className="btn-aureate-secondary text-xs">Cancel</button>
              <button
                onClick={handlePublishNewDrive}
                className="btn-aureate-primary text-xs font-bold"
              >
                Publish Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL GENERATOR */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-aureate max-w-sm w-full p-6 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--brass)]">
            <h3 className="font-display font-bold text-base flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-[var(--brass)]" />
              Drive QR & Attendance Code
            </h3>
            <div className="p-6 bg-white rounded-xl inline-block shadow-inner mx-auto border border-gray-300">
              <div className="w-40 h-40 bg-black/90 flex items-center justify-center text-white font-mono text-xs rounded">
                [QR CODE PREVIEW]
              </div>
            </div>
            <div className="bg-[var(--surface-alt)] p-3 rounded-lg border border-[var(--border)]">
              <p className="text-[11px] text-[var(--ink-muted)]">Round 1 Passcode</p>
              <p className="text-xl font-bold font-mono text-[var(--brass)] tracking-widest">849201</p>
            </div>
            <button onClick={() => setShowQRModal(false)} className="btn-aureate-secondary text-xs w-full">
              Close QR View
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-[var(--brass)] text-black shadow-md scale-105 font-extrabold'
              : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] border border-[var(--border)] hover:text-[var(--ink)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Drive Status Overview & Stepper
        </button>
        <button
          onClick={() => setActiveTab('drives')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'drives'
              ? 'bg-[var(--brass)] text-black shadow-md scale-105 font-extrabold'
              : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] border border-[var(--border)] hover:text-[var(--ink)]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Active Drives Directory ({activeDrivesList.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'companies'
              ? 'bg-[var(--brass)] text-black shadow-md scale-105 font-extrabold'
              : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] border border-[var(--border)] hover:text-[var(--ink)]'
          }`}
        >
          <Building className="w-4 h-4" />
          Company Directory ({dynamicCompaniesList.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' ? (
        <LiveDriveOverview
          isFacultyView={false}
          showManagementControls={true}
          onOpenCreateWizard={() => setShowDriveWizard(true)}
        />
      ) : activeTab === 'drives' ? (
        <div className="card-aureate overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface-alt)] border-b border-[var(--border)] text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Company & Role</th>
                <th className="p-3.5">CTC</th>
                <th className="p-3.5">Branches</th>
                <th className="p-3.5">Applicants</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {activeDrivesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[var(--ink-muted)]">
                    No active recruitment drives currently open.
                  </td>
                </tr>
              ) : (
                activeDrivesList.map((drive) => (
                  <tr key={drive.id} className="hover:bg-[var(--surface-alt)]/50 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-sm text-[var(--ink)]">{drive.company}</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">{drive.role}</p>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--brass)] font-semibold">{drive.ctc}</td>
                    <td className="p-3.5 text-[var(--ink-muted)]">{drive.branches}</td>
                    <td className="p-3.5 font-mono">{drive.applicants} Students</td>
                    <td className="p-3.5">
                      {getStatusBadge(drive.status)}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenManageRecruitment(drive)}
                        className="btn-aureate-primary text-[11px] px-3 py-1 font-bold shadow-md hover:scale-105 transition inline-flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Recruitment</span>
                      </button>
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="btn-aureate-secondary text-[11px] px-2.5 py-1"
                      >
                        QR Code
                      </button>
                      <button
                        onClick={() => handleOpenManageModal(drive)}
                        className="btn-aureate-secondary text-[11px] px-2.5 py-1"
                      >
                        Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-aureate overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface-alt)] border-b border-[var(--border)] text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Company Name</th>
                <th className="p-3.5">Industry</th>
                <th className="p-3.5">HR Contact</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {dynamicCompaniesList.map((comp, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-alt)]/50 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-sm text-[var(--ink)]">{comp.name}</p>
                    <p className="text-[11px] text-[var(--brass)] font-mono">{comp.drives || 1} Active/Listed Drive(s)</p>
                  </td>
                  <td className="p-3.5 text-[var(--ink-muted)]">{comp.industry}</td>
                  <td className="p-3.5 font-medium">{comp.hr}</td>
                  <td className="p-3.5 font-mono text-[var(--brass)]">{comp.email}</td>
                  <td className="p-3.5 text-right">
                    <button onClick={() => alert(`Contacting HR for ${comp.name} at ${comp.email}`)} className="btn-aureate-secondary text-[11px] px-2 py-1">
                      Contact HR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MANAGE RECRUITMENT ROUNDS MODAL */}
      <ManageRecruitmentModal
        isOpen={showRecruitmentModal}
        onClose={() => setShowRecruitmentModal(false)}
        drive={selectedRecruitmentDrive}
      />
    </div>
  );
};
