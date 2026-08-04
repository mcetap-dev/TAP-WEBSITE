import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Building,
  Plus,
  QrCode,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

export const TPODashboardView: React.FC = () => {
  const [showDriveWizard, setShowDriveWizard] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'drives' | 'companies' | 'students'>('drives');

  const mockDrives = [
    { id: '1', company: 'Google', role: 'Software Engineer', ctc: '32 LPA', branches: 'CSE, ISE, ECE', status: 'open', applicants: 142 },
    { id: '2', company: 'Microsoft', role: 'Data Engineer', ctc: '26 LPA', branches: 'CSE, ISE', status: 'open', applicants: 98 },
    { id: '3', company: 'Infosys', role: 'Specialist Programmer', ctc: '9.5 LPA', branches: 'ALL', status: 'completed', applicants: 310 },
  ];

  const mockCompanies = [
    { name: 'Google', industry: 'Technology', hr: 'Sarah Jenkins', email: 'sarah@google.com', drives: 2 },
    { name: 'Microsoft', industry: 'Software', hr: 'David Miller', email: 'david@microsoft.com', drives: 1 },
    { name: 'Amazon', industry: 'E-Commerce & Cloud', hr: 'Elena Rostova', email: 'elena@amazon.com', drives: 3 },
  ];

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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <Users className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">1,240 <span className="text-xs font-normal text-[var(--ink-muted)]">Students</span></p>
          <p className="text-[11px] text-[var(--success)] mt-1">94% Verified by Faculty</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Active Placement Drives</span>
            <Briefcase className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">14 <span className="text-xs font-normal text-[var(--ink-muted)]">Drives</span></p>
          <p className="text-[11px] text-[var(--info)] mt-1">6 Open for Applications</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Onboarded Companies</span>
            <Building className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono">48 <span className="text-xs font-normal text-[var(--ink-muted)]">Partners</span></p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">Tier-1 & Core Recruiters</p>
        </div>

        <div className="card-aureate p-4">
          <div className="flex items-center justify-between text-[var(--ink-muted)] mb-2">
            <span className="text-xs font-medium">Average Package</span>
            <TrendingUp className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--brass)]">12.4 LPA</p>
          <p className="text-[11px] text-[var(--success)] mt-1">Highest: 44 LPA (Microsoft)</p>
        </div>
      </div>

      {/* Drive Creation Wizard Modal */}
      {showDriveWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-aureate max-w-xl w-full p-6 space-y-4 bg-[var(--surface)]">
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
                <input type="text" placeholder="e.g. Google, Amazon, Oracle" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role Title</label>
                  <input type="text" placeholder="e.g. Software Engineer" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CTC / Stipend</label>
                  <input type="text" placeholder="e.g. 18 LPA" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CGPA Cutoff</label>
                  <input type="number" step="0.1" placeholder="7.5" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Backlog Limit</label>
                  <input type="number" placeholder="0" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Eligible Branches</label>
                <input type="text" placeholder="CSE, ISE, ECE, EEE" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Job Description & Details</label>
                <textarea rows={3} placeholder="Enter job summary, requirements, and responsibilities..." className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:border-[var(--brass)] outline-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowDriveWizard(false)} className="btn-aureate-secondary text-xs">Cancel</button>
              <button
                onClick={() => {
                  alert('Drive created and published successfully!');
                  setShowDriveWizard(false);
                }}
                className="btn-aureate-primary text-xs"
              >
                Publish Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal Generator */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-aureate max-w-sm w-full p-6 text-center space-y-4 bg-[var(--surface)]">
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('drives')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'drives' ? 'bg-[var(--brass-soft)] text-[var(--brass)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
        >
          Active Drives ({mockDrives.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'companies' ? 'bg-[var(--brass-soft)] text-[var(--brass)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
        >
          Company Directory ({mockCompanies.length})
        </button>
      </div>

      {/* Content Tables */}
      {activeTab === 'drives' ? (
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
              {mockDrives.map((drive) => (
                <tr key={drive.id} className="hover:bg-[var(--surface-alt)]/50 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-sm">{drive.company}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{drive.role}</p>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--brass)] font-semibold">{drive.ctc}</td>
                  <td className="p-3.5 text-[var(--ink-muted)]">{drive.branches}</td>
                  <td className="p-3.5 font-mono">{drive.applicants} Students</td>
                  <td className="p-3.5">
                    <span className={`badge-aureate ${drive.status === 'open' ? 'badge-success' : 'badge-info'} capitalize`}>
                      {drive.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button onClick={() => setShowQRModal(true)} className="btn-aureate-secondary text-[11px] px-2 py-1">
                      QR Code
                    </button>
                    <button onClick={() => alert(`Managing rounds for ${drive.company}`)} className="btn-aureate-primary text-[11px] px-2.5 py-1">
                      Manage Rounds
                    </button>
                  </td>
                </tr>
              ))}
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
              {mockCompanies.map((comp, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-alt)]/50 transition">
                  <td className="p-3.5 font-bold">{comp.name}</td>
                  <td className="p-3.5 text-[var(--ink-muted)]">{comp.industry}</td>
                  <td className="p-3.5">{comp.hr}</td>
                  <td className="p-3.5 font-mono text-[var(--brass)]">{comp.email}</td>
                  <td className="p-3.5 text-right">
                    <button onClick={() => alert(`Contacting HR at ${comp.name}`)} className="btn-aureate-secondary text-[11px] px-2 py-1">
                      Contact HR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
