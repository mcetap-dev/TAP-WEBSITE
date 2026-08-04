import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Drive } from '../types';
import { Briefcase, Search, Filter, Calendar, MapPin, Building, ChevronRight, Loader2 } from 'lucide-react';

export const DrivesPage: React.FC = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setLoading(true);
    const liveDrives = await api.getDrives();
    if (liveDrives.length > 0) {
      setDrives(liveDrives);
    } else {
      // Fallback drives if database table is initially empty
      setDrives([
        {
          id: '1',
          company_id: 'c1',
          role_title: 'Software Engineer (SDE-1)',
          ctc_or_stipend: '32 LPA',
          eligibility_branches: ['CSE', 'ISE'],
          cgpa_cutoff: 8.0,
          backlog_limit: 0,
          rounds_count: 4,
          application_deadline: '2026-08-10',
          status: 'open',
          created_at: new Date().toISOString(),
          company: { id: 'c1', name: 'Google', created_at: new Date().toISOString() }
        },
        {
          id: '2',
          company_id: 'c2',
          role_title: 'Cloud Security Analyst',
          ctc_or_stipend: '26 LPA',
          eligibility_branches: ['CSE', 'ISE', 'ECE'],
          cgpa_cutoff: 7.5,
          backlog_limit: 0,
          rounds_count: 3,
          application_deadline: '2026-08-15',
          status: 'open',
          created_at: new Date().toISOString(),
          company: { id: 'c2', name: 'Microsoft', created_at: new Date().toISOString() }
        }
      ]);
    }
    setLoading(false);
  };

  const handleApply = async (driveId: string) => {
    if (!user) {
      alert('Please sign in to submit applications.');
      return;
    }
    setSubmitting(true);
    const { error } = await api.submitApplication(driveId, user.id);
    setSubmitting(false);

    if (error) {
      alert(`Application notice: ${error.message || 'Already applied or constraint hit.'}`);
    } else {
      alert('Application successfully recorded in Supabase database!');
      setSelectedDrive(null);
    }
  };

  const filteredDrives = drives.filter((d) => {
    const compName = d.company?.name || 'Company';
    const matchesSearch = compName.toLowerCase().includes(searchQuery.toLowerCase()) || d.role_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || !d.eligibility_branches || d.eligibility_branches.includes(selectedBranch);
    return matchesSearch && matchesBranch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Placement Drives Explorer</h2>
            <p className="text-sm text-[var(--ink-muted)]">Live Supabase drive registry, eligibility cutoffs, and application submissions.</p>
          </div>
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[var(--brass)]" />
            <span className="text-xs font-medium text-[var(--ink-muted)]">Branch:</span>
            {['ALL', 'CSE', 'ISE', 'ECE', 'EEE'].map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedBranch === branch ? 'bg-[var(--brass-soft)] text-[var(--brass)]' : 'border border-[var(--border)] hover:bg-[var(--surface-alt)]'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        {/* Drives Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brass)]" />
            Querying Supabase Drives table...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrives.map((drive) => (
              <div key={drive.id} className="card-aureate p-5 space-y-4 flex flex-col justify-between hover:border-[var(--brass)] transition">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base">{drive.company?.name || 'Company'}</h3>
                      <p className="text-xs text-[var(--ink-muted)]">{drive.role_title}</p>
                    </div>
                    <span className="badge-aureate badge-brass font-mono">{drive.ctc_or_stipend || 'Competitive'}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)] pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Deadline: {drive.application_deadline || 'Open'}</span>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {drive.eligibility_branches?.map((b) => (
                      <span key={b} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-alt)] border border-[var(--border)]">
                        {b}
                      </span>
                    ))}
                    {drive.cgpa_cutoff && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--brass-soft)] text-[var(--brass)]">
                        Min {drive.cgpa_cutoff} CGPA
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDrive(drive)}
                    className="text-xs text-[var(--brass)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Details & Rounds
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleApply(drive.id)}
                    disabled={submitting}
                    className="btn-aureate-primary text-xs px-3 py-1.5"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedDrive && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="card-aureate max-w-lg w-full p-6 space-y-4 bg-[var(--surface)]">
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <span className="badge-aureate badge-brass">{selectedDrive.ctc_or_stipend || 'Competitive'}</span>
                  <h3 className="font-display font-bold text-xl mt-1">{selectedDrive.company?.name || 'Company'}</h3>
                  <p className="text-xs text-[var(--ink-muted)]">{selectedDrive.role_title}</p>
                </div>
                <button onClick={() => setSelectedDrive(null)} className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]">Close</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-xs text-[var(--brass)] mb-1">Eligibility Parameters</h4>
                  <p className="text-[var(--ink-muted)]">Minimum CGPA: <span className="font-mono font-bold text-[var(--ink)]">{selectedDrive.cgpa_cutoff || 'N/A'}</span> • Backlog Limit: <span className="font-mono font-bold text-[var(--ink)]">{selectedDrive.backlog_limit ?? 0}</span></p>
                  <p className="text-[var(--ink-muted)]">Target Branches: <span className="font-mono">{selectedDrive.eligibility_branches?.join(', ') || 'ALL'}</span></p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-[var(--brass)] mb-1">Job Description</h4>
                  <p className="text-[var(--ink-muted)] leading-relaxed">{selectedDrive.job_description || 'Full-time campus placement role with competitive package and growth opportunities.'}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button onClick={() => setSelectedDrive(null)} className="btn-aureate-secondary text-xs">Close</button>
                <button
                  onClick={() => handleApply(selectedDrive.id)}
                  disabled={submitting}
                  className="btn-aureate-primary text-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
