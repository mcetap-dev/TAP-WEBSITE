import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { GraduationCap, Briefcase, Key, Mail, Lock, UserCheck, Shield, Sparkles, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, verifyOtp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [role, setRole] = useState<UserRole>('student');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
          navigate('/dashboard');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message || 'Login failed. Try quick demo role login below.');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brass-soft)] border border-[var(--brass)] flex items-center justify-center text-[var(--brass)] font-bold text-2xl mx-auto shadow-lg">
            PC
          </div>
          <h1 className="text-3xl font-display font-bold">Placement Connect</h1>
          <p className="text-xs text-[var(--ink-muted)]">Unified Campus Recruitment & Training Portal</p>
        </div>

        {/* Auth Card */}
        <div className="card-aureate p-6 space-y-5 bg-[var(--surface)]">
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
