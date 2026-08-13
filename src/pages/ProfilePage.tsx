import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Profile } from '../types';
import {
  User,
  GraduationCap,
  BookOpen,
  FileText,
  Edit3,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Clock
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile: authProfile, role, refreshProfile } = useAuth();
  const isStaffRole = role === 'faculty_coordinator' || role === 'faculty' || role === 'tpo' || role === 'admin';

  // Helper to derive unique per-user local storage key
  const getUserStorageKey = useCallback((): string => {
    if (user?.id) return `pc_profile_${user.id}`;
    if (user?.email) return `pc_profile_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (authProfile?.email) return `pc_profile_${authProfile.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `pc_profile_guest_${role || 'student'}`;
  }, [user?.id, user?.email, authProfile?.email, role]);

  // Helper to load profile with local persistence priority & strict user isolation
  const getInitialProfile = (): Partial<Profile> => {
    const activeRole = role || (authProfile as any)?.role || 'student';
    const isStaff = activeRole === 'faculty_coordinator' || activeRole === 'faculty' || activeRole === 'tpo' || activeRole === 'admin';

    let savedLocal: Partial<Profile> = {};
    try {
      const storageKey = getUserStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        savedLocal = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    if (isStaff) {
      const defaultName = activeRole === 'tpo' ? 'Dr. Pradeep Kumar' : activeRole === 'admin' ? 'System Administrator' : 'Dr. Ramesh H N';
      const defaultEmail = activeRole === 'tpo' ? 'tpo@mcehassan.ac.in' : activeRole === 'admin' ? 'admin@mcehassan.ac.in' : 'faculty.ise@mcehassan.ac.in';
      const defaultDesig = activeRole === 'tpo' ? 'Head of Training & Placement' : activeRole === 'admin' ? 'Chief System Administrator' : 'Associate Professor & Department Placement Coordinator';
      const defaultEmpId = activeRole === 'tpo' ? 'MCE-TPO-001' : activeRole === 'admin' ? 'MCE-ADM-001' : 'MCE-FAC-104';

      return {
        name: savedLocal.name || authProfile?.name || defaultName,
        email: savedLocal.email || authProfile?.email || user?.email || defaultEmail,
        phone: savedLocal.phone || authProfile?.phone || '',
        dob: savedLocal.dob || authProfile?.dob || '',
        gender: savedLocal.gender || authProfile?.gender || '',
        department: savedLocal.department || authProfile?.department || 'Information Science Engineering',
        role: activeRole,
        designation: (savedLocal as any).designation || defaultDesig,
        employee_id: (savedLocal as any).employee_id || defaultEmpId,
        approval_status: 'approved',
        photo_url: savedLocal.photo_url || authProfile?.photo_url || ''
      };
    }

    // Student profile: strictly unique to user, no mock fallbacks for phone/dob!
    return {
      name: savedLocal.name || authProfile?.name || authProfile?.full_name || (user?.email ? user.email.split('@')[0] : 'Student'),
      email: savedLocal.email || authProfile?.email || user?.email || '',
      phone: savedLocal.phone || authProfile?.phone || '',
      dob: savedLocal.dob || authProfile?.dob || '',
      gender: savedLocal.gender || authProfile?.gender || '',
      usn: savedLocal.usn || authProfile?.usn || '',
      department: savedLocal.department || authProfile?.department || 'Information Science Engineering',
      semester: savedLocal.semester ?? authProfile?.semester ?? 7,
      section: savedLocal.section || authProfile?.section || 'A',
      admission_year: savedLocal.admission_year ?? authProfile?.admission_year ?? 2023,
      graduation_year: savedLocal.graduation_year ?? authProfile?.graduation_year ?? 2027,
      cgpa: savedLocal.cgpa ?? authProfile?.cgpa ?? undefined,
      active_backlogs: savedLocal.active_backlogs ?? authProfile?.active_backlogs ?? 0,
      tenth_percent: savedLocal.tenth_percent ?? authProfile?.tenth_percent ?? undefined,
      twelfth_or_diploma_percent: savedLocal.twelfth_or_diploma_percent ?? authProfile?.twelfth_or_diploma_percent ?? undefined,
      approval_status: savedLocal.approval_status || authProfile?.approval_status || 'pending',
      resume_url: savedLocal.resume_url || authProfile?.resume_url || '',
      skills: savedLocal.skills || authProfile?.skills || [],
      photo_url: savedLocal.photo_url || authProfile?.photo_url || ''
    };
  };

  const [profileData, setProfileData] = useState<Partial<Profile>>(getInitialProfile);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'education' | 'resume'>('personal');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  // Keyboard navigation: Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  useEffect(() => {
    let savedLocal: Partial<Profile> = {};
    try {
      const key = getUserStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        savedLocal = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    if (authProfile || Object.keys(savedLocal).length > 0) {
      setProfileData((prev) => {
        const merged = { ...prev, ...authProfile, ...savedLocal };
        Object.keys(savedLocal).forEach((k) => {
          const val = (savedLocal as any)[k];
          if (val !== undefined && val !== null && val !== '') {
            (merged as any)[k] = val;
          }
        });
        return merged;
      });
    }
  }, [authProfile, getUserStorageKey]);

  const handleOpenEdit = (tab: 'personal' | 'academic' | 'education' | 'resume' = 'personal') => {
    setActiveTab(tab);
    setFormData({ ...profileData });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (field: keyof Profile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const updated = {
      ...profileData,
      ...formData
    };

    setProfileData(updated);

    try {
      const key = getUserStorageKey();
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    if (user?.id) {
      await api.updateProfile(user.id, updated);
      await refreshProfile();
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditModalOpen(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Top Header & Avatar Profile Card */}
        <div className="card-aureate relative p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-[var(--surface-alt)] border-2 border-[var(--brass)] flex items-center justify-center text-3xl font-bold text-[var(--brass)] shadow-xl overflow-hidden">
              {profileData.photo_url ? (
                <img
                  src={profileData.photo_url}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[var(--surface-high)] flex items-center justify-center font-display">
                  {profileData.name ? profileData.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'YS'}
                </div>
              )}
            </div>
            <button
              onClick={() => handleOpenEdit('personal')}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--brass)] text-[#0A0A0B] hover:scale-110 transition shadow-lg"
              title="Change Photo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Identity Info */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
                {profileData.name}
              </h1>
              {profileData.approval_status === 'approved' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-[var(--brass)]">
              {isStaffRole ? ((profileData as any).designation || 'Faculty Coordinator') : profileData.usn}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">{profileData.department}</p>
            {!isStaffRole && (
              <p className="text-xs text-[var(--ink-muted)]">
                Semester {profileData.semester ?? '7'} • Section {profileData.section || 'B'}
              </p>
            )}

            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-lg bg-[var(--brass-soft)] border border-[var(--brass)] text-xs font-bold text-[var(--brass)]">
                {isStaffRole ? `ID: ${(profileData as any).employee_id || 'MCE-FAC-104'}` : `CGPA ${profileData.cgpa ? Number(profileData.cgpa).toFixed(2) : 'N/A'}`}
              </span>
            </div>
          </div>

          {/* Edit Profile Primary Action Button */}
          <div className="w-full md:w-auto">
            <button
              onClick={() => handleOpenEdit('personal')}
              className="btn-aureate w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile Details
            </button>
          </div>
        </div>

        {/* QUICK STATS Grid */}
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-3 px-1">
            Quick Stats
          </h2>
          {isStaffRole ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Role</span>
                <span className="font-display text-sm font-bold text-[var(--brass)] capitalize">
                  {role?.replace('_', ' ') || 'Faculty Coordinator'}
                </span>
              </div>
              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Department</span>
                <span className="font-display text-sm font-bold text-[var(--ink)]">
                  ISE
                </span>
              </div>
              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Status</span>
                <span className="font-display text-sm font-bold text-emerald-400">
                  Authorized Verifier
                </span>
              </div>
              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Employee ID</span>
                <span className="font-display text-sm font-bold text-[var(--ink)]">
                  {(profileData as any).employee_id || 'MCE-FAC-104'}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">CGPA</span>
                <span className="font-display text-2xl font-bold text-[var(--brass)]">
                  {profileData.cgpa ? Number(profileData.cgpa).toFixed(2) : '8.70'}
                </span>
              </div>

              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Backlogs</span>
                <span className="font-display text-2xl font-bold text-[var(--ink)]">
                  {profileData.active_backlogs ?? 0}
                </span>
              </div>

              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Semester</span>
                <span className="font-display text-2xl font-bold text-[var(--ink)]">
                  {profileData.semester ?? 7}
                </span>
              </div>

              <div className="card-aureate p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)] block mb-1">Graduation</span>
                <span className="font-display text-2xl font-bold text-[var(--ink)]">
                  {profileData.graduation_year ?? 2031}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Personal Information Card */}
        <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2 text-[var(--brass)] font-semibold text-sm">
              <User className="w-4 h-4" />
              <span>Personal Information</span>
            </div>
            <button
              onClick={() => handleOpenEdit('personal')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--brass)] hover:bg-[var(--brass-soft)] transition font-medium"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Name</span>
              <span className="font-medium text-[var(--ink)]">{profileData.name}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">College Email</span>
              <span className="font-medium text-[var(--ink)]">{profileData.email}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Phone</span>
              <span className="font-medium text-[var(--ink)]">{profileData.phone || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Date of Birth</span>
              <span className="font-medium text-[var(--ink)]">{profileData.dob || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Gender</span>
              <span className="font-medium text-[var(--ink)]">{profileData.gender || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Academic / Staff Credentials Card */}
        {isStaffRole ? (
          <div className="card-aureate p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 text-[var(--brass)] font-semibold text-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Faculty & Staff Credentials</span>
              </div>
              <button
                onClick={() => handleOpenEdit('personal')}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--brass)] hover:bg-[var(--brass-soft)] transition font-medium"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Employee / Faculty ID</span>
                <span className="font-mono font-medium text-[var(--ink)]">{(profileData as any).employee_id || 'MCE-FAC-104'}</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Designation</span>
                <span className="font-medium text-[var(--ink)]">{(profileData as any).designation || 'Associate Professor'}</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Department</span>
                <span className="font-medium text-[var(--ink)]">{profileData.department || 'Information Science Engineering'}</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)] block text-[11px]">Access Scope</span>
                <span className="font-medium text-emerald-400 capitalize">{role?.replace('_', ' ') || 'Faculty Coordinator'}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2 text-[var(--brass)] font-semibold text-sm">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Information</span>
            </div>
            <button
              onClick={() => handleOpenEdit('academic')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--brass)] hover:bg-[var(--brass-soft)] transition font-medium"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">USN</span>
              <span className="font-mono font-medium text-[var(--ink)]">{profileData.usn}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Department</span>
              <span className="font-medium text-[var(--ink)]">{profileData.department}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Semester</span>
              <span className="font-medium text-[var(--ink)]">{profileData.semester ?? 'N/A'}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Section</span>
              <span className="font-medium text-[var(--ink)]">{profileData.section || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Admission Year</span>
              <span className="font-medium text-[var(--ink)]">{profileData.admission_year ?? 'N/A'}</span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Graduation Year</span>
              <span className="font-medium text-[var(--ink)]">{profileData.graduation_year ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Education Card */}
        <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2 text-[var(--brass)] font-semibold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Education</span>
            </div>
            <button
              onClick={() => handleOpenEdit('education')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--brass)] hover:bg-[var(--brass-soft)] transition font-medium"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">SSLC Percentage</span>
              <span className="font-medium text-[var(--ink)]">
                {profileData.tenth_percent ? `${profileData.tenth_percent}%` : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">PUC / Diploma</span>
              <span className="font-medium text-[var(--ink)]">
                {profileData.twelfth_or_diploma_percent ? `${profileData.twelfth_or_diploma_percent}%` : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">CGPA</span>
              <span className="font-medium text-[var(--ink)]">
                {profileData.cgpa ? Number(profileData.cgpa).toFixed(2) : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px]">Active Backlogs</span>
              <span className="font-medium text-[var(--ink)]">{profileData.active_backlogs ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Resume & Skills Section */}
        <div className="card-aureate p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2 text-[var(--brass)] font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>Resume & Technical Skills</span>
            </div>
            <button
              onClick={() => handleOpenEdit('resume')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--brass)] hover:bg-[var(--brass-soft)] transition font-medium"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[var(--ink-muted)] block text-[11px] mb-1">Resume Link</span>
              {profileData.resume_url ? (
                <a
                  href={profileData.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--brass)] hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Uploaded Resume
                </a>
              ) : (
                <span className="text-[var(--ink-muted)]">No resume uploaded yet</span>
              )}
            </div>

            <div>
              <span className="text-[var(--ink-muted)] block text-[11px] mb-2">Technical Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {(profileData.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[var(--surface-alt)] border border-[var(--border)] text-[11px] font-medium text-[var(--ink)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* FULL EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] border border-[var(--brass)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-alt)]">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--ink)]">Edit Profile Details</h3>
                <p className="text-xs text-[var(--ink-muted)]">Update your placement portal credentials & profile info</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex border-b border-[var(--border)] bg-[var(--surface-high)] overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'personal'
                    ? 'border-[var(--brass)] text-[var(--brass)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('academic')}
                className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'academic'
                    ? 'border-[var(--brass)] text-[var(--brass)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Academic Info
              </button>
              <button
                onClick={() => setActiveTab('education')}
                className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'education'
                    ? 'border-[var(--brass)] text-[var(--brass)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Education Marks
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'resume'
                    ? 'border-[var(--brass)] text-[var(--brass)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Resume & Skills
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </div>
              )}

              {/* TAB 1: PERSONAL INFORMATION */}
              {activeTab === 'personal' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">College Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Date of Birth</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={formData.dob || ''}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">Gender</label>
                    <select
                      value={formData.gender || 'Male'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">Avatar / Photo URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.photo_url || ''}
                      onChange={(e) => handleInputChange('photo_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMIC INFORMATION */}
              {activeTab === 'academic' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">USN</label>
                      <input
                        type="text"
                        value={formData.usn || ''}
                        onChange={(e) => handleInputChange('usn', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)] uppercase font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Current Semester</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formData.semester ?? 7}
                        onChange={(e) => handleInputChange('semester', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1 font-semibold">Section</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={['A', 'B', 'C', 'D', 'E', 'F'].includes(formData.section || '') ? formData.section : 'B'}
                          onChange={(e) => handleInputChange('section', e.target.value)}
                          className="bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--brass)] font-bold cursor-pointer"
                        >
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                          <option value="E">Section E</option>
                          <option value="F">Section F</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Or enter custom section (e.g. B, C, A)"
                          value={formData.section || ''}
                          onChange={(e) => handleInputChange('section', e.target.value)}
                          className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Admission Year</label>
                      <input
                        type="number"
                        value={formData.admission_year ?? 2023}
                        onChange={(e) => handleInputChange('admission_year', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Graduation Year</label>
                      <input
                        type="number"
                        value={formData.graduation_year ?? 2027}
                        onChange={(e) => handleInputChange('graduation_year', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EDUCATION MARKS */}
              {activeTab === 'education' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">SSLC (10th) Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tenth_percent ?? 95.8}
                        onChange={(e) => handleInputChange('tenth_percent', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">PUC / Diploma Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.twelfth_or_diploma_percent ?? 92.0}
                        onChange={(e) => handleInputChange('twelfth_or_diploma_percent', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Cumulative CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formData.cgpa ?? 8.70}
                        onChange={(e) => handleInputChange('cgpa', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)] font-bold text-[var(--brass)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ink-muted)] mb-1">Active Backlogs Count</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.active_backlogs ?? 0}
                        onChange={(e) => handleInputChange('active_backlogs', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RESUME & SKILLS */}
              {activeTab === 'resume' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">Resume File URL / Link</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formData.resume_url || ''}
                      onChange={(e) => handleInputChange('resume_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--ink-muted)] mb-1">
                      Technical Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="React, TypeScript, Node.js, Python"
                      value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'skills',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-aureate flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
