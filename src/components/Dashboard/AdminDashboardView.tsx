import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AuditLog } from '../../types';
import {
  ShieldAlert,
  UserCheck,
  Building,
  Clock,
  Loader2
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    const liveLogs = await api.getAuditLogs();
    setLogs(liveLogs);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-aureate p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-alt)] to-[var(--brass-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="badge-aureate badge-brass mb-1">Super Admin Control</span>
          <h2 className="text-2xl font-display font-bold">System Administration & Audit Center</h2>
          <p className="text-sm text-[var(--ink-muted)]">Live Supabase audit log trail and system administration.</p>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-aureate p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Appoint TPO Official</h4>
            <UserCheck className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xs text-[var(--ink-muted)]">Grant TPO privileges to staff members.</p>
          <button onClick={() => alert('Appoint TPO Dialog opened')} className="btn-aureate-primary text-xs w-full mt-2">
            Appoint TPO
          </button>
        </div>

        <div className="card-aureate p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Academic Cycle Setup</h4>
            <Building className="w-4 h-4 text-[var(--brass)]" />
          </div>
          <p className="text-xs text-[var(--ink-muted)]">Active Batch: <span className="font-mono font-bold text-[var(--ink)]">2026</span></p>
          <button onClick={() => alert('Academic Cycle Manager opened')} className="btn-aureate-secondary text-xs w-full mt-2">
            Manage Cycles
          </button>
        </div>

        <div className="card-aureate p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">System Health</h4>
            <ShieldAlert className="w-4 h-4 text-[var(--success)]" />
          </div>
          <p className="text-xs text-[var(--success)] font-semibold">100% Operational</p>
          <button onClick={() => alert('System Security Audit executed')} className="btn-aureate-secondary text-xs w-full mt-2">
            Run Security Audit
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-aureate p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--brass)]" />
            Live Supabase Security & Audit Trail
          </h3>
          <span className="badge-aureate badge-brass">RLS Protected</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brass)]" />
            Querying audit_logs table from Supabase...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
            No audit records present in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface-alt)] border-b border-[var(--border)] text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-alt)]/50 transition">
                    <td className="p-3.5 font-mono text-[var(--ink-muted)]">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-semibold">{log.actor_email || log.actor_id}</td>
                    <td className="p-3.5">
                      <span className="badge-aureate badge-brass font-mono">{log.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
