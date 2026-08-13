import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://twtnxdpvqkirdiqnyusi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dG54ZHB2cWtpcmRpcW55dXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTQyOTksImV4cCI6MjEwMDg3MDI5OX0.I_qJ-14TVWMNS-G_On4eWKivsqtM_E7a1mOck8JCN_I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
