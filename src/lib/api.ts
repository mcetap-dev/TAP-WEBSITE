import { supabase } from './supabase';
import type { Drive, Application, Profile, Company, AuditLog, AppNotification } from '../types';

export const api = {
  // ── DRIVES ─────────────────────────────────────────────────────────────
  async getDrives(): Promise<Drive[]> {
    try {
      const { data, error } = await supabase
        .from('drives')
        .select('*, company:companies(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching live drives from Supabase:', error.message);
        return [];
      }

      // Normalize drive fields for schema variations (role vs role_title, ctc_or_stipend vs package_lpa)
      return (data || []).map((d: any) => ({
        ...d,
        role_title: d.role_title || d.role || 'Job Position',
        ctc_or_stipend: d.ctc_or_stipend || (d.package_lpa ? `${d.package_lpa} LPA` : 'Competitive'),
        cgpa_cutoff: d.cgpa_cutoff ?? d.eligibility_cgpa ?? 0,
        job_description: d.job_description || d.description || ''
      })) as Drive[];
    } catch (e) {
      console.warn('Query drives exception:', e);
      return [];
    }
  },

  async createDrive(driveData: Partial<Drive>): Promise<{ data: any; error: any }> {
    const payload = {
      company_id: driveData.company_id,
      role_title: driveData.role_title,
      ctc_or_stipend: driveData.ctc_or_stipend,
      job_description: driveData.job_description,
      cgpa_cutoff: driveData.cgpa_cutoff,
      backlog_limit: driveData.backlog_limit || 0,
      eligibility_branches: driveData.eligibility_branches || [],
      rounds_count: driveData.rounds_count || 1,
      status: driveData.status || 'open'
    };

    const { data, error } = await supabase
      .from('drives')
      .insert(payload)
      .select()
      .single();
    return { data, error };
  },

  // ── APPLICATIONS ───────────────────────────────────────────────────────
  async getApplicationsForStudent(studentId: string): Promise<Application[]> {
    if (!studentId) return [];
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, drive:drives(*, company:companies(*))')
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.warn('Error fetching live applications:', error.message);
        return [];
      }

      return (data || []).map((app: any) => ({
        ...app,
        drive: app.drive
          ? {
              ...app.drive,
              role_title: app.drive.role_title || app.drive.role || 'Job Position',
              ctc_or_stipend: app.drive.ctc_or_stipend || (app.drive.package_lpa ? `${app.drive.package_lpa} LPA` : 'Competitive')
            }
          : undefined
      })) as Application[];
    } catch (e) {
      console.warn('Failed to query applications:', e);
      return [];
    }
  },

  async submitApplication(driveId: string, studentId: string, whyThisRole?: string): Promise<{ error: any }> {
    if (!studentId || !driveId) return { error: new Error('Invalid student or drive ID') };
    const { error } = await supabase.from('applications').insert({
      drive_id: driveId,
      student_id: studentId,
      why_this_role: whyThisRole || 'Excited for this career opportunity.'
    });
    return { error };
  },

  // ── FACULTY VERIFICATION QUEUE ─────────────────────────────────────────
  async getPendingStudentApprovals(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending student approvals:', error.message);
        return [];
      }
      return (data || []) as Profile[];
    } catch (e) {
      console.warn('Pending approvals exception:', e);
      return [];
    }
  },

  async updateStudentApprovalStatus(
    studentId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from('profiles')
      .update({
        approval_status: status,
        rejection_reason: rejectionReason || null,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', studentId);
    return { error };
  },

  // ── COMPANIES ──────────────────────────────────────────────────────────
  async getCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Error fetching companies:', error.message);
        return [];
      }
      return (data || []) as Company[];
    } catch (e) {
      console.warn('Companies exception:', e);
      return [];
    }
  },

  async createCompany(companyData: Partial<Company>): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();
    return { data, error };
  },

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles!audit_logs_actor_id_fkey(email, name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Fallback simple query if join alias differs
        const res = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        return (res.data || []) as AuditLog[];
      }
      return (data || []).map((l: any) => ({
        ...l,
        actor_email: l.actor?.email || l.actor_id
      })) as AuditLog[];
    } catch (e) {
      console.warn('Audit logs exception:', e);
      return [];
    }
  },

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching notifications:', error.message);
        return [];
      }
      return (data || []) as AppNotification[];
    } catch (e) {
      console.warn('Notifications exception:', e);
      return [];
    }
  }
};
