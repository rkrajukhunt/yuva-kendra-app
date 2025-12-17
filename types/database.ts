/**
 * Database response types for Supabase queries
 */

export interface SupabaseReport {
  id: string;
  kendra_id: string;
  week_start_date: string;
  week_end_date: string;
  pushp_no: number;
  yuva_kendra_attendance: number;
  bhavferni_attendance: number;
  pravachan_attendance: number;
  description?: string;
  created_by: string;
  created_at: string;
  kendra?: {
    id: string;
    kendra_name: string;
    kendra_type: 'Yuvan' | 'Yuvti';
    created_at: string;
    city?: {
      id: string;
      city_name: string;
      pin_code: string;
      created_at: string;
    };
  };
}

export interface SupabaseCreator {
  id: string;
  name: string;
  email: string;
}

