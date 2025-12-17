export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  kendra_id?: string;
  created_at: string;
}

export interface City {
  id: string;
  city_name: string;
  pin_code: string;
  created_at: string;
}

export interface Kendra {
  id: string;
  kendra_name: string;
  city_id: string;
  kendra_type: 'Yuvan' | 'Yuvti';
  created_at: string;
  city?: City;
}

export interface WeeklyReport {
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
  kendra?: Kendra;
  creator?: User;
}

export interface DashboardStats {
  totalReports: number;
  avgYuvaAttendance: number;
  avgBhavferniAttendance: number;
  avgPravachanAttendance: number;
  activeKendras?: number;
  lastWeekTotal?: number;
}

export interface ReportFilters {
  cityId?: string;
  kendraId?: string;
  type?: 'Yuvan' | 'Yuvti';
  dateFrom?: string;
  dateTo?: string;
  currentYear?: boolean;
  lastYear?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

