import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Mail, Lock, ArrowLeft, Home, LogOut, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signInWithEmail, signUpWithEmail, signOut } = useAuth();

  // Extract return location or default to dashboard
  const fromLocation = (location.state as { from?: string })?.from || '/dashboard';

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [role, setRole] = useState<UserRole>('student');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = React.useCallback(() => {
    if ((location.state as any)?.from) {
      navigate((location.state as any).from, { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  // Handle escape key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password, {
          name,
          usn,
          department,
          role,
          approval_status: role === 'student' || role === 'faculty' ? 'pending' : 'approved'
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          alert('Registration submitted! If required, your account is awaiting faculty approval.');
          navigate(fromLocation, { replace: true });
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message || 'Login failed. Try again or check credentials.');
        } else {
          // Replace history entry so browser back button returns to pre-login page
          navigate(fromLocation, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center p-4 relative font-sans">
      <div className="max-w-md w-full space-y-5">
        {/* Top Navigation Bar: Back & Home links */}
        <div className="flex items-center justify-between w-full text-xs">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-muted)] hover:text-[var(--brass)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] border border-[var(--border)] px-3.5 py-1.5 rounded-full transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[var(--brass)]" />
            <span>Back to Previous Page</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-1.5 rounded-full transition-all shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brass-soft)] border border-[var(--brass)] flex items-center justify-center text-[var(--brass)] font-bold text-2xl mx-auto shadow-lg">
            PC
          </div>
          <h1 className="text-3xl font-display font-bold">Placement Connect</h1>
          <p className="text-xs text-[var(--ink-muted)]">Unified Campus Recruitment & Training Portal</p>
        </div>

        {/* Banner if user is already signed in */}
        {user && (
          <div className="card-aureate p-4 bg-[var(--surface)] border border-[var(--brass-soft)] space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
              <div className="text-xs min-w-0">
                <p className="font-bold text-[var(--ink)]">Already Signed In</p>
                <p className="text-[var(--ink-muted)] truncate">{profile?.name || user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => navigate(fromLocation, { replace: true })}
                className="btn-aureate-primary flex-1 text-xs py-2 justify-center"
              >
                Continue to Portal
              </button>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="px-3 py-2 text-xs border border-[var(--border)] rounded-lg text-[var(--alert)] hover:bg-[var(--surface-alt)] flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="card-aureate p-6 space-y-5 bg-[var(--surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="font-bold text-base font-display">
              {isSignUp ? 'Create Account' : 'Sign In to Portal'}
            </h2>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-xs text-[var(--brass)] hover:underline font-semibold"
            >
              {isSignUp ? 'Already registered? Sign In' : 'New User? Register'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-[var(--alert-soft)] border border-[var(--alert)] text-xs text-[var(--alert)]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isSignUp && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Select Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="tpo">TPO Official</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ISE">ISE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                    </select>
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block font-semibold mb-1">University Serial Number (USN)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1MS21CS042"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] focus:border-[var(--brass)] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-aureate-primary w-full justify-center text-xs py-2.5 font-bold"
            >
              {loading ? 'Processing...' : isSignUp ? 'Submit Registration' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

