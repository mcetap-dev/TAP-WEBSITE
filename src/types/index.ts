export type UserRole = 'admin' | 'tpo' | 'faculty_coordinator' | 'faculty' | 'student';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DriveStatus = 'upcoming' | 'active' | 'completed' | 'draft' | 'open' | 'closed';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'selected';
export type ConsentStatus = 'not_set' | 'opted_in' | 'opted_out';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  usn?: string;
  department?: string;
  batch?: string;
  semester?: number | string;
  section?: string;
  admission_year?: number | string;
  graduation_year?: number | string;
  dob?: string;
  gender?: string;
  cgpa?: number;
  tenth_percent?: number;
  twelfth_or_diploma_percent?: number;
  cgpa_semesterwise?: Record<string, number> | number[];
  active_backlogs?: number;
  resume_url?: string;
  photo_url?: string;
  id_proof_url?: string;
  skills?: string[];
  certifications?: Array<{ name: string; issuer?: string; date?: string }>;
  projects?: Array<{ title: string; description?: string; link?: string }>;
  achievements?: string[];
  consent_status?: ConsentStatus;
  consent_reason?: string;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  designation?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  industry?: string;
  hr_contact_name?: string;
  hr_contact_email?: string;
  hr_contact_phone?: string;
  created_at: string;
}

export interface Drive {
  id: string;
  company_id: string;
  academic_cycle_id?: string;
  role_title: string;
  ctc_or_stipend?: string;
  job_description?: string;
  eligibility_branches?: string[];
  cgpa_cutoff?: number;
  backlog_limit?: number;
  rounds_count: number;
  application_deadline?: string;
  status: DriveStatus;
  created_at: string;
  company?: Company;
}

export interface DriveRound {
  id: string;
  drive_id: string;
  round_number: number;
  round_name: string;
  round_date?: string;
  round_time?: string;
  venue_or_link?: string;
}

export interface Application {
  id: string;
  drive_id: string;
  student_id: string;
  status: ApplicationStatus;
  current_round: number;
  resume_version_url?: string;
  why_this_role?: string;
  applied_at: string;
  drive?: Drive;
  student?: Profile;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: 'drive' | 'application' | 'approval' | 'general';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email?: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface PlacementAnalytics {
  totalStudents: number;
  placedStudents: number;
  totalDrives: number;
  activeDrives: number;
  avgPackage: string;
  topPackage: string;
  departmentWisePlaced: Record<string, number>;
}
