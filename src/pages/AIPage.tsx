import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Sparkles, ArrowLeft, FileText, Target, BrainCircuit, Home } from 'lucide-react';

export const AIPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--brass)] bg-[var(--surface-alt)] border border-[var(--border)] px-3 py-1.5 rounded-full transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[var(--brass)]" />
            <span>Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] px-2 py-1 transition-all">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
        <span className="font-display text-base sm:text-lg font-medium text-[var(--ink)]">AI Placement Hub</span>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brass-soft)] text-[var(--brass)] flex items-center justify-center mb-6">
          <Sparkles className="w-7 h-7" />
        </div>

        <span className="badge-aureate badge-brass mb-4">
          Reserved Navigation Slot
        </span>

        <h1 className="font-display text-3xl md:text-5xl font-medium text-[var(--ink)] mb-4">
          AI Intelligence Features <span className="text-[var(--brass)]">Coming Soon</span>
        </h1>

        <p className="text-[var(--ink-muted)] max-w-xl text-sm mb-12">
          We are currently crafting advanced AI-assisted placement tools to empower students and campus recruiters during upcoming placement drives.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-12">
          <div className="card-aureate p-6">
            <FileText className="w-6 h-6 text-[var(--brass)] mb-3" />
            <h3 className="font-display text-lg font-medium text-[var(--ink)] mb-1">AI Resume Optimizer</h3>
            <p className="text-xs text-[var(--ink-muted)]">Automated ATS score analysis and tailored keyword recommendations for drive cutoffs.</p>
          </div>

          <div className="card-aureate p-6">
            <Target className="w-6 h-6 text-[var(--brass)] mb-3" />
            <h3 className="font-display text-lg font-medium text-[var(--ink)] mb-1">Predictive Drive Match</h3>
            <p className="text-xs text-[var(--ink-muted)]">Machine learning algorithms matching student profiles with historical drive success rates.</p>
          </div>

          <div className="card-aureate p-6">
            <BrainCircuit className="w-6 h-6 text-[var(--brass)] mb-3" />
            <h3 className="font-display text-lg font-medium text-[var(--ink)] mb-1">Interview Prep Bot</h3>
            <p className="text-xs text-[var(--ink-muted)]">Company-specific technical and HR mock interview simulations with feedback.</p>
          </div>
        </div>

        {user ? (
          <Link to="/dashboard" className="btn-aureate-primary text-xs py-2.5 px-6">
            Go to Portal Dashboard
          </Link>
        ) : (
          <Link to="/login" state={{ from: location.pathname }} className="btn-aureate-primary text-xs py-2.5 px-6">
            Sign In to Portal
          </Link>
        )}
      </main>
    </div>
  );
};

export default AIPage;

