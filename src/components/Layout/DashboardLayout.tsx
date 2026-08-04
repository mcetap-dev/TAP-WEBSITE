import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Briefcase,
  Users,
  CheckCircle,
  ShieldAlert,
  Bot,
  LogOut,
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  UserCheck,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: BarChart3, roles: ['student', 'tpo', 'faculty_coordinator', 'faculty', 'admin'] },
    { label: 'Drives', path: '/drives', icon: Briefcase, roles: ['student', 'tpo', 'faculty_coordinator', 'admin'] },
    { label: 'My Applications', path: '/applications', icon: FileText, roles: ['student'] },
    { label: 'Student Approvals', path: '/faculty/approvals', icon: UserCheck, roles: ['faculty', 'faculty_coordinator', 'tpo', 'admin'] },
    { label: 'Drive Management', path: '/tpo/drives', icon: Calendar, roles: ['tpo', 'admin'] },
    { label: 'Audit & Users', path: '/admin/audit', icon: ShieldAlert, roles: ['admin'] },
    { label: 'AI Career Assistant', path: '/ai', icon: Bot, roles: ['student', 'tpo', 'faculty_coordinator', 'faculty', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !role || item.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border)] bg-[var(--surface)] p-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--brass-soft)] border border-[var(--brass)] flex items-center justify-center text-[var(--brass)] font-bold text-xl">
            PC
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Placement Connect</h1>
            <p className="text-xs text-[var(--ink-muted)] capitalize">{role || 'Portal'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--brass-soft)] text-[var(--brass)] font-semibold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-alt)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[var(--border)] mt-auto space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[var(--ink-muted)]">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-alt)] transition"
              title="Toggle Theme"
            >
              <Sun className="w-4 h-4 hidden dark:block text-[var(--brass)]" />
              <Moon className="w-4 h-4 block dark:hidden text-[var(--ink-muted)]" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[var(--surface-alt)]">
            <div className="w-8 h-8 rounded-full bg-[var(--brass-soft)] flex items-center justify-center text-xs font-bold text-[var(--brass)] uppercase">
              {profile?.name ? profile.name.slice(0, 2) : 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold truncate">{profile?.name || user?.email || 'User'}</p>
              <p className="text-[10px] text-[var(--ink-muted)] truncate">{profile?.department || profile?.email || ''}</p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="text-[var(--ink-muted)] hover:text-[var(--alert)] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top Navigation Bar for Mobile */}
      <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--brass-soft)] border border-[var(--brass)] flex items-center justify-center text-[var(--brass)] font-bold text-sm">
            PC
          </div>
          <span className="font-display font-bold">Placement Connect</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--ink)]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-alt)]"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--alert)] hover:bg-[var(--surface-alt)] rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Search drives, students, companies..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--brass)]"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-alt)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--brass)]"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Notifications</h4>
                    <span className="text-[10px] text-[var(--brass)]">2 New</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                    <div className="p-2.5 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)]">
                      <p className="font-semibold text-xs text-[var(--ink)]">Google Campus Drive Announced</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Eligibility: CSE, ISE (CGPA &gt;= 7.5)</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)]">
                      <p className="font-semibold text-xs text-[var(--ink)]">Application Status Updated</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Shortlisted for Round 2 at Infosys</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
              <span className="badge-aureate badge-brass capitalize">{role || 'student'}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
