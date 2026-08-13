import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  XCircle,
  UserX,
  MessageSquare,
  ArrowRight,
  Save,
  X,
  Plus
} from 'lucide-react';

export interface RecruitmentCandidate {
  id: string;
  name: string;
  usn: string;
  department: string;
  cgpa: number;
  current_round: number; // 1, 2, or 3
  round_status: 'pending' | 'shortlisted' | 'rejected' | 'absent' | 'selected';
  remarks?: string;
  applied_at: string;
}

interface ManageRecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  drive: {
    id: string;
    company: string;
    role: string;
    ctc?: string;
    status?: string;
  } | null;
}

const DEFAULT_ROUNDS = [
  { id: 1, name: 'Aptitude Test', description: 'Online technical & general aptitude assessment' },
  { id: 2, name: 'Technical Interview', description: 'Coding assessment, data structures & system design' },
  { id: 3, name: 'HR Interview', description: 'Behavioral interview, leadership evaluation & salary discussion' }
];

export const ManageRecruitmentModal: React.FC<ManageRecruitmentModalProps> = ({
  isOpen,
  onClose,
  drive
}) => {
  const [activeRound, setActiveRound] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected' | 'absent'>('shortlisted');
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCandidateForRemark, setSelectedCandidateForRemark] = useState<RecruitmentCandidate | null>(null);
  const [remarkText, setRemarkText] = useState<string>('');
  const [showAddCandidateModal, setShowAddCandidateModal] = useState<boolean>(false);
  const [newCandidateName, setNewCandidateName] = useState<string>('');
  const [newCandidateUsn, setNewCandidateUsn] = useState<string>('');
  const [newCandidateDept, setNewCandidateDept] = useState<string>('Information Science Engineering');
  const [newCandidateCgpa, setNewCandidateCgpa] = useState<string>('8.5');

  // Load applicants for this drive from API + local recruitment storage
  useEffect(() => {
    if (!isOpen || !drive?.id) return;

    const loadDriveCandidates = async () => {
      setLoading(true);
      try {
        const driveKey = `pc_recruitment_${drive.id}`;
        const storedRecruitment = localStorage.getItem(driveKey);

        if (storedRecruitment) {
          setCandidates(JSON.parse(storedRecruitment));
          setLoading(false);
          return;
        }

        // Otherwise load from existing drive applications
        const liveApps = await api.getApplicationsForDrive(drive.id);
        
        let initialList: RecruitmentCandidate[] = [];
        if (liveApps && liveApps.length > 0) {
          initialList = liveApps.map((app, index) => ({
            id: app.id || `rec_cand_${index}`,
            name: app.name || 'Candidate',
            usn: app.usn || `4MC23IS${100 + index}`,
            department: app.department || 'Information Science Engineering',
            cgpa: app.cgpa ?? 8.5,
            current_round: app.current_round || (index % 3) + 1,
            round_status: (app.status?.toLowerCase() === 'shortlisted' ? 'shortlisted' : app.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as any,
            remarks: '',
            applied_at: app.applied_at || new Date().toISOString().slice(0, 10)
          }));
        } else {
          // Provide default candidate pool for demonstration
          initialList = [
            {
              id: `cand_${drive.id}_1`,
              name: 'Yashas H K',
              usn: '4MC23IS126',
              department: 'Information Science Engineering',
              cgpa: 8.70,
              current_round: 3,
              round_status: 'shortlisted',
              remarks: 'Strong DSA and system architecture answers in round 2.',
              applied_at: new Date().toISOString().slice(0, 10)
            },
            {
              id: `cand_${drive.id}_2`,
              name: 'Sakshi Sharma',
              usn: '4MC23CS088',
              department: 'Computer Science Engineering',
              cgpa: 9.15,
              current_round: 3,
              round_status: 'pending',
              remarks: 'Awaiting final HR discussion.',
              applied_at: new Date().toISOString().slice(0, 10)
            },
            {
              id: `cand_${drive.id}_3`,
              name: 'Aditya Vardhan',
              usn: '4MC23EC042',
              department: 'Electronics & Communication',
              cgpa: 8.40,
              current_round: 2,
              round_status: 'shortlisted',
              remarks: 'Passed technical round with distinction.',
              applied_at: new Date().toISOString().slice(0, 10)
            },
            {
              id: `cand_${drive.id}_4`,
              name: 'Pooja Hegde',
              usn: '4MC23IS074',
              department: 'Information Science Engineering',
              cgpa: 7.90,
              current_round: 1,
              round_status: 'pending',
              remarks: '',
              applied_at: new Date().toISOString().slice(0, 10)
            },
            {
              id: `cand_${drive.id}_5`,
              name: 'Rohan Deshmukh',
              usn: '4MC23CS112',
              department: 'Computer Science Engineering',
              cgpa: 7.60,
              current_round: 1,
              round_status: 'rejected',
              remarks: 'Aptitude score below cutoff (42%).',
              applied_at: new Date().toISOString().slice(0, 10)
            }
          ];
        }

        setCandidates(initialList);
        localStorage.setItem(driveKey, JSON.stringify(initialList));
      } catch (err) {
        console.warn('Error loading recruitment candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDriveCandidates();
  }, [isOpen, drive?.id]);

  // Persist candidate list on modifications
  const saveCandidates = (updated: RecruitmentCandidate[]) => {
    setCandidates(updated);
    if (drive?.id) {
      localStorage.setItem(`pc_recruitment_${drive.id}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('pc_drives_updated'));
    }
  };

  // Handlers for Candidate Status Updates
  const handleUpdateStatus = (candidateId: string, newStatus: 'pending' | 'shortlisted' | 'rejected' | 'absent' | 'selected') => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        return { ...c, round_status: newStatus };
      }
      return c;
    });
    saveCandidates(updated);
  };

  const handleAdvanceToNextRound = (candidateId: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        const nextRound = Math.min(3, c.current_round + 1);
        return {
          ...c,
          current_round: nextRound,
          round_status: 'pending' as const,
          remarks: c.remarks ? `${c.remarks} • Advanced to Round ${nextRound}` : `Advanced to Round ${nextRound}`
        };
      }
      return c;
    });
    saveCandidates(updated);
  };

  const handleSaveRemark = () => {
    if (!selectedCandidateForRemark) return;
    const updated = candidates.map((c) => {
      if (c.id === selectedCandidateForRemark.id) {
        return { ...c, remarks: remarkText };
      }
      return c;
    });
    saveCandidates(updated);
    setSelectedCandidateForRemark(null);
    setRemarkText('');
  };

  const handleAddCandidate = () => {
    if (!newCandidateName.trim() || !newCandidateUsn.trim()) {
      alert('Please provide candidate name and USN.');
      return;
    }

    const newCandidate: RecruitmentCandidate = {
      id: `cand_manual_${Date.now()}`,
      name: newCandidateName.trim(),
      usn: newCandidateUsn.trim().toUpperCase(),
      department: newCandidateDept,
      cgpa: parseFloat(newCandidateCgpa) || 8.0,
      current_round: activeRound,
      round_status: 'pending',
      remarks: 'Manually added to recruitment pipeline',
      applied_at: new Date().toISOString().slice(0, 10)
    };

    const updated = [newCandidate, ...candidates];
    saveCandidates(updated);
    setShowAddCandidateModal(false);
    setNewCandidateName('');
    setNewCandidateUsn('');
  };

  // Filter candidates for the currently active round
  const roundCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (c.current_round !== activeRound) return false;

      // Status filter
      if (statusFilter !== 'all' && c.round_status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.usn.toLowerCase().includes(query) ||
          c.department.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [candidates, activeRound, statusFilter, searchQuery]);

  if (!isOpen || !drive) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--brass)]/50 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl text-[var(--ink)] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* HEADER matching Screenshot: Back arrow + Manage Recruitment */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--brass)]" />
            </button>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] leading-tight">
                Manage Recruitment
              </h2>
              <p className="text-xs text-[var(--ink-muted)] font-mono">
                {drive.company} — {drive.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCandidateModal(true)}
            className="btn-aureate-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Add Candidate to Round"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--brass)]" />
            <span>Add Student</span>
          </button>
        </div>

        {/* INFO CALLOUT matching Screenshot */}
        <div className="p-4 rounded-2xl bg-[var(--surface-alt)]/70 border border-[var(--brass)]/30 flex items-start gap-3 text-xs shrink-0">
          <div className="p-1 rounded-full text-[var(--brass)] shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-[11px] sm:text-xs leading-relaxed text-[var(--ink-muted)]">
            <p className="font-semibold text-[var(--ink)]">Select a round to view and manage students.</p>
            <p>Shortlist, reject, mark absent, or add remarks from here.</p>
          </div>
        </div>

        {/* ROUNDS ACCORDION LIST */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {DEFAULT_ROUNDS.map((round) => {
            const isExpanded = activeRound === round.id;
            const roundCount = candidates.filter((c) => c.current_round === round.id).length;
            const shortlistedCount = candidates.filter((c) => c.current_round === round.id && c.round_status === 'shortlisted').length;

            return (
              <div
                key={round.id}
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-2 border-[var(--brass)] bg-[var(--surface)] shadow-lg'
                    : 'border border-[var(--border)] bg-[var(--surface-alt)]/60 hover:border-[var(--brass)]/50'
                }`}
              >
                {/* Round Header Bar */}
                <button
                  type="button"
                  onClick={() => setActiveRound(isExpanded ? 0 : round.id)}
                  className="w-full p-4 flex items-center justify-between text-left gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Circle Badge Number */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                        isExpanded
                          ? 'bg-[var(--brass)] text-black shadow-md'
                          : 'bg-[var(--surface-alt)] border border-[var(--border)] text-emerald-400'
                      }`}
                    >
                      {round.id}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[var(--ink)]">
                        {round.name}
                      </h3>
                      <p className="text-[11px] text-[var(--ink-muted)] font-mono">
                        {roundCount} Student{roundCount === 1 ? '' : 's'} • {shortlistedCount} Shortlisted
                      </p>
                    </div>
                  </div>

                  <div className="text-[var(--ink-muted)]">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[var(--brass)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* EXPANDED ROUND CONTENT */}
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-4 border-t border-[var(--border)] mt-1">
                    {/* SEARCH INPUT matching Screenshot */}
                    <div className="relative pt-3">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                      <input
                        type="text"
                        placeholder="Search by name or USN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    {/* STATUS FILTER PILLS matching Screenshot */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'shortlisted', label: 'Shortlisted' },
                        { key: 'rejected', label: 'Rejected' },
                        { key: 'absent', label: 'Absent' }
                      ].map((tab) => {
                        const isSelected = statusFilter === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key as any)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs ${
                              isSelected
                                ? 'bg-[var(--brass)] text-black font-extrabold shadow-md scale-105'
                                : 'bg-[var(--surface-alt)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* CANDIDATES LIST / EMPTY STATE matching Screenshot */}
                    {loading ? (
                      <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                        Loading round candidate pipeline...
                      </div>
                    ) : roundCandidates.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--ink-muted)] font-medium">
                        No students available in this round.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {roundCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] space-y-2 hover:border-[var(--brass)]/40 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-[var(--ink)]">{candidate.name}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                                      candidate.round_status === 'shortlisted'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : candidate.round_status === 'rejected'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : candidate.round_status === 'absent'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-[var(--brass-soft)] text-[var(--brass)] border border-[var(--brass)]/30'
                                    }`}
                                  >
                                    {candidate.round_status}
                                  </span>
                                </div>
                                <p className="text-xs font-mono text-[var(--ink-muted)]">
                                  {candidate.usn} • {candidate.department}
                                </p>
                                <p className="text-[11px] font-mono text-[var(--brass)] font-semibold">
                                  CGPA: {candidate.cgpa.toFixed(2)}
                                </p>
                              </div>

                              {/* Candidate Actions */}
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(candidate.id, 'shortlisted')}
                                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                    candidate.round_status === 'shortlisted'
                                      ? 'bg-emerald-500 text-black font-bold'
                                      : 'bg-[var(--surface)] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                  }`}
                                  title="Shortlist Candidate"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[10px]">Shortlist</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                    candidate.round_status === 'rejected'
                                      ? 'bg-rose-500 text-white font-bold'
                                      : 'bg-[var(--surface)] text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                                  }`}
                                  title="Reject Candidate"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[10px]">Reject</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(candidate.id, 'absent')}
                                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                    candidate.round_status === 'absent'
                                      ? 'bg-amber-500 text-black font-bold'
                                      : 'bg-[var(--surface)] text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                  title="Mark Absent"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[10px]">Absent</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCandidateForRemark(candidate);
                                    setRemarkText(candidate.remarks || '');
                                  }}
                                  className="p-1.5 rounded-lg text-xs bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--brass)] border border-[var(--border)]"
                                  title="Add/Edit Remarks"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                {candidate.current_round < 3 && candidate.round_status === 'shortlisted' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceToNextRound(candidate.id)}
                                    className="p-1.5 rounded-lg text-[10px] font-bold bg-[var(--brass)] text-black hover:opacity-90 flex items-center gap-1 shadow-sm"
                                    title="Advance to Next Round"
                                  >
                                    <span>Next Round</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Remarks Display */}
                            {candidate.remarks && (
                              <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--ink-muted)] flex items-start gap-1.5">
                                <MessageSquare className="w-3 h-3 text-[var(--brass)] shrink-0 mt-0.5" />
                                <span className="italic">{candidate.remarks}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[var(--ink-muted)] font-mono">
            Total Pipeline: <strong className="text-[var(--brass)]">{candidates.length}</strong> Candidates
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-aureate-primary text-xs py-2 px-6 font-bold"
          >
            Done
          </button>
        </div>
      </div>

      {/* REMARKS MODAL */}
      {selectedCandidateForRemark && (
        <div
          onClick={() => setSelectedCandidateForRemark(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-aureate max-w-sm w-full p-5 space-y-3 bg-[var(--surface)] border border-[var(--brass)] rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[var(--brass)]" />
                Remarks for {selectedCandidateForRemark.name}
              </h4>
              <button
                onClick={() => setSelectedCandidateForRemark(null)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Enter interview feedback, technical ratings, or evaluation notes..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[var(--brass)] text-[var(--ink)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedCandidateForRemark(null)}
                className="btn-aureate-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemark}
                className="btn-aureate-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Remark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {showAddCandidateModal && (
        <div
          onClick={() => setShowAddCandidateModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-aureate max-w-sm w-full p-5 space-y-3 bg-[var(--surface)] border border-[var(--brass)] rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[var(--brass)]" />
                Add Student to Round {activeRound}
              </h4>
              <button
                onClick={() => setShowAddCandidateModal(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Yashas H K"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-2 focus:border-[var(--brass)] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">USN</label>
                <input
                  type="text"
                  placeholder="e.g. 4MC23IS126"
                  value={newCandidateUsn}
                  onChange={(e) => setNewCandidateUsn(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-2 font-mono uppercase focus:border-[var(--brass)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={newCandidateDept}
                    onChange={(e) => setNewCandidateDept(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-2 text-xs focus:border-[var(--brass)] outline-none"
                  >
                    <option value="Information Science Engineering">ISE</option>
                    <option value="Computer Science Engineering">CSE</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Electrical & Electronics">EEE</option>
                    <option value="Mechanical Engineering">MECH</option>
                    <option value="Civil Engineering">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCandidateCgpa}
                    onChange={(e) => setNewCandidateCgpa(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-2 font-mono focus:border-[var(--brass)] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setShowAddCandidateModal(false)}
                className="btn-aureate-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                className="btn-aureate-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
