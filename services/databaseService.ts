import { supabase } from './supabase';
import { WeeklyReport, City, Kendra, User, DashboardStats, ReportFilters } from '../types';
import { getPushpNumber } from '../utils/dateHelpers';

// Helper function to calculate week_end_date (7 days after week_start_date)
function getWeekEndDate(weekStartDate: string): string {
  const date = new Date(weekStartDate);
  date.setDate(date.getDate() + 6); // Add 6 days to get end of week (Monday + 6 = Sunday)
  return date.toISOString().split('T')[0];
}

// Reports
export async function getReports(
  filters?: ReportFilters, 
  userId?: string, 
  userRole?: string,
  limit?: number,
  userKendraId?: string
): Promise<WeeklyReport[]> {
  // Query reports with kendra and city relationships
  // Note: creator info is fetched separately if needed since foreign key may not exist
  let query = supabase
    .from('weekly_reports')
    .select(`
      *,
      kendra:kendras (
        id,
        kendra_name,
        kendra_type,
        city:cities (
          id,
          city_name,
          pin_code
        )
      )
    `)
    .order('week_start_date', { ascending: false });

  // Add limit to prevent loading too many records at once
  if (limit) {
    query = query.limit(limit);
  } else {
    // Default limit of 100 reports
    query = query.limit(100);
  }

  // Role-based filtering
  if (userRole === 'member') {
    // Use kendra_id from user object if provided (faster)
    if (userKendraId) {
      query = query.eq('kendra_id', userKendraId);
    } else if (userId) {
      // Fallback: query if kendra_id not provided
      const { data: profile } = await supabase
        .from('profiles')
        .select('kendra_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.kendra_id) {
        query = query.eq('kendra_id', profile.kendra_id);
      } else {
        return []; // Member without kendra assignment
      }
    } else {
      return []; // Member without user info
    }
  }

  // Apply kendra type filter at database level if possible
  if (filters?.kendraId) {
    query = query.eq('kendra_id', filters.kendraId);
  }

  // Apply date filters at database level
  if (filters) {
    if (filters.dateFrom) {
      query = query.gte('week_start_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('week_start_date', filters.dateTo);
    }
    if (filters.currentYear) {
      const { getCurrentYearStart, getCurrentYearEnd } = await import('../utils/dateHelpers');
      query = query.gte('week_start_date', getCurrentYearStart())
        .lte('week_start_date', getCurrentYearEnd());
    }
    if (filters.lastYear) {
      const { getLastYearStart, getLastYearEnd } = await import('../utils/dateHelpers');
      query = query.gte('week_start_date', getLastYearStart())
        .lte('week_start_date', getLastYearEnd());
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase query error:', error);
    throw error;
  }

  console.log('Raw reports data:', data?.length || 0, 'reports');

  if (!data || data.length === 0) {
    console.log('No reports found in database');
    return [];
  }

  // Filter by city and type in memory (after join) - optimized
  let filteredData = data;
  if (filters) {
    if (filters.cityId) {
      filteredData = filteredData.filter((report: any) => 
        report.kendra?.city?.id === filters.cityId
      );
    }
    if (filters.type) {
      filteredData = filteredData.filter((report: any) => 
        report.kendra?.kendra_type === filters.type
      );
    }
  }

  // Fetch all unique creator IDs and batch fetch their info
  const creatorIds = [...new Set(filteredData.map((r: any) => r.created_by).filter(Boolean))];
  const creatorsMap = new Map();
  
  if (creatorIds.length > 0) {
    try {
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', creatorIds);
      
      if (creatorsData) {
        creatorsData.forEach((creator: any) => {
          creatorsMap.set(creator.id, creator);
        });
      }
    } catch (error) {
      console.warn('Could not fetch creator info:', error);
    }
  }

  // Optimize mapping - only transform what we need
  return filteredData.map((report: any) => {
    const kendra = report.kendra;
    const city = kendra?.city;
    
    return {
      id: report.id,
      kendra_id: report.kendra_id,
      week_start_date: report.week_start_date,
      week_end_date: report.week_end_date,
      pushp_no: report.pushp_no,
      yuva_kendra_attendance: report.yuva_kendra_attendance,
      bhavferni_attendance: report.bhavferni_attendance,
      pravachan_attendance: report.pravachan_attendance,
      description: report.description,
      created_by: report.created_by,
      created_at: report.created_at,
      kendra: kendra ? {
        id: kendra.id,
        kendra_name: kendra.kendra_name,
        kendra_type: kendra.kendra_type,
        city_id: city?.id || '',
        created_at: kendra.created_at || '',
        city: city ? {
          id: city.id,
          city_name: city.city_name,
          pin_code: city.pin_code,
          created_at: city.created_at || '',
        } : undefined,
      } : undefined,
      creator: report.created_by ? creatorsMap.get(report.created_by) || null : null,
    };
  });
}

export async function getReportById(id: string): Promise<WeeklyReport | null> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select(`
      *,
      kendra:kendras (
        id,
        kendra_name,
        kendra_type,
        city:cities (
          id,
          city_name,
          pin_code
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Fetch creator info separately if created_by exists
  let creator = null;
  if (data.created_by) {
    try {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', data.created_by)
        .single();
      creator = creatorData;
    } catch (error) {
      console.warn('Could not fetch creator info:', error);
    }
  }

  return {
    id: data.id,
    kendra_id: data.kendra_id,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    pushp_no: data.pushp_no,
    yuva_kendra_attendance: data.yuva_kendra_attendance,
    bhavferni_attendance: data.bhavferni_attendance,
    pravachan_attendance: data.pravachan_attendance,
    description: data.description,
    created_by: data.created_by,
    created_at: data.created_at,
    kendra: data.kendra ? {
      id: data.kendra.id,
      kendra_name: data.kendra.kendra_name,
      kendra_type: data.kendra.kendra_type,
      city_id: data.kendra.city?.id || '',
      created_at: data.kendra.created_at || '',
      city: data.kendra.city ? {
        id: data.kendra.city.id,
        city_name: data.kendra.city.city_name,
        pin_code: data.kendra.city.pin_code,
        created_at: data.kendra.city.created_at || '',
      } : undefined,
    } : undefined,
    creator: creator,
  };
}

export async function createReport(report: Omit<WeeklyReport, 'id' | 'created_at' | 'kendra' | 'creator'>): Promise<WeeklyReport> {
  const pushpNo = getPushpNumber(report.week_start_date);
  const weekEndDate = report.week_end_date || getWeekEndDate(report.week_start_date);
  
  const { data, error } = await supabase
    .from('weekly_reports')
    .insert({
      kendra_id: report.kendra_id,
      week_start_date: report.week_start_date,
      week_end_date: weekEndDate,
      pushp_no: pushpNo,
      yuva_kendra_attendance: report.yuva_kendra_attendance,
      bhavferni_attendance: report.bhavferni_attendance,
      pravachan_attendance: report.pravachan_attendance,
      description: report.description,
      created_by: report.created_by,
    })
    .select(`
      *,
      kendra:kendras (
        id,
        kendra_name,
        kendra_type,
        city:cities (
          id,
          city_name,
          pin_code
        )
      )
    `)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create report');

  // Fetch creator info separately if created_by exists
  let creator = null;
  if (data.created_by) {
    try {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', data.created_by)
        .single();
      creator = creatorData;
    } catch (error) {
      console.warn('Could not fetch creator info:', error);
    }
  }

  // Map to WeeklyReport format
  const kendra = data.kendra;
  const city = kendra?.city;
  
  return {
    id: data.id,
    kendra_id: data.kendra_id,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    pushp_no: data.pushp_no,
    yuva_kendra_attendance: data.yuva_kendra_attendance,
    bhavferni_attendance: data.bhavferni_attendance,
    pravachan_attendance: data.pravachan_attendance,
    description: data.description,
    created_by: data.created_by,
    created_at: data.created_at,
    kendra: kendra ? {
      id: kendra.id,
      kendra_name: kendra.kendra_name,
      kendra_type: kendra.kendra_type,
      city_id: city?.id || '',
      created_at: kendra.created_at || '',
      city: city ? {
        id: city.id,
        city_name: city.city_name,
        pin_code: city.pin_code,
        created_at: city.created_at || '',
      } : undefined,
    } : undefined,
    creator: creator,
  };
}

export async function updateReport(id: string, updates: Partial<WeeklyReport>): Promise<WeeklyReport> {
  // Map updates to database column names
  const dbUpdates: any = {};
  if (updates.yuva_kendra_attendance !== undefined) dbUpdates.yuva_kendra_attendance = updates.yuva_kendra_attendance;
  if (updates.bhavferni_attendance !== undefined) dbUpdates.bhavferni_attendance = updates.bhavferni_attendance;
  if (updates.pravachan_attendance !== undefined) dbUpdates.pravachan_attendance = updates.pravachan_attendance;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.week_start_date !== undefined) {
    dbUpdates.week_start_date = updates.week_start_date;
    dbUpdates.week_end_date = updates.week_end_date || getWeekEndDate(updates.week_start_date);
    dbUpdates.pushp_no = getPushpNumber(updates.week_start_date);
  }

  const { data, error } = await supabase
    .from('weekly_reports')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Cities
export async function getCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('city_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCity(city: Omit<City, 'id' | 'created_at'>): Promise<City> {
  const { data, error } = await supabase
    .from('cities')
    .insert({
      city_name: city.city_name,
      pin_code: city.pin_code,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCity(id: string, updates: Partial<City>): Promise<City> {
  const dbUpdates: any = {};
  if (updates.city_name !== undefined) dbUpdates.city_name = updates.city_name;
  if (updates.pin_code !== undefined) dbUpdates.pin_code = updates.pin_code;

  const { data, error } = await supabase
    .from('cities')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCity(id: string): Promise<void> {
  const { error } = await supabase
    .from('cities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Kendras
export async function getKendras(cityId?: string): Promise<Kendra[]> {
  let query = supabase
    .from('kendras')
    .select(`
      *,
      city:cities (
        id,
        city_name,
        pin_code
      )
    `)
    .order('kendra_name', { ascending: true });

  if (cityId) {
    query = query.eq('city_id', cityId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((kendra: any) => ({
    id: kendra.id,
    kendra_name: kendra.kendra_name,
    city_id: kendra.city_id,
    kendra_type: kendra.kendra_type,
    created_at: kendra.created_at,
    city: kendra.city ? {
      id: kendra.city.id,
      city_name: kendra.city.city_name,
      pin_code: kendra.city.pin_code,
      created_at: kendra.city.created_at || '',
    } : undefined,
  }));
}

export async function createKendra(kendra: Omit<Kendra, 'id' | 'created_at' | 'city'>): Promise<Kendra> {
  const { data, error } = await supabase
    .from('kendras')
    .insert({
      kendra_name: kendra.kendra_name,
      city_id: kendra.city_id,
      kendra_type: kendra.kendra_type,
    })
    .select(`
      *,
      city:cities (
        id,
        city_name,
        pin_code
      )
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    kendra_name: data.kendra_name,
    city_id: data.city_id,
    kendra_type: data.kendra_type,
    created_at: data.created_at,
    city: data.city ? {
      id: data.city.id,
      city_name: data.city.city_name,
      pin_code: data.city.pin_code,
      created_at: data.city.created_at || '',
    } : undefined,
  };
}

export async function updateKendra(id: string, updates: Partial<Kendra>): Promise<Kendra> {
  const dbUpdates: any = {};
  if (updates.kendra_name !== undefined) dbUpdates.kendra_name = updates.kendra_name;
  if (updates.city_id !== undefined) dbUpdates.city_id = updates.city_id;
  if (updates.kendra_type !== undefined) dbUpdates.kendra_type = updates.kendra_type;

  const { data, error } = await supabase
    .from('kendras')
    .update(dbUpdates)
    .eq('id', id)
    .select(`
      *,
      city:cities (
        id,
        city_name,
        pin_code
      )
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    kendra_name: data.kendra_name,
    city_id: data.city_id,
    kendra_type: data.kendra_type,
    created_at: data.created_at,
    city: data.city ? {
      id: data.city.id,
      city_name: data.city.city_name,
      pin_code: data.city.pin_code,
      created_at: data.city.created_at || '',
    } : undefined,
  };
}

export async function deleteKendra(id: string): Promise<void> {
  const { error } = await supabase
    .from('kendras')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Users
export async function getUsers(filters?: { cityId?: string; kendraId?: string }): Promise<User[]> {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      kendra:kendras (
        id,
        kendra_name,
        kendra_type,
        city:cities (
          id,
          city_name
        )
      )
    `)
    .order('name', { ascending: true });

  if (filters?.kendraId) {
    query = query.eq('kendra_id', filters.kendraId);
  }

  const { data, error } = await query;

  if (error) throw error;

  let users = (data || []).map((user: any) => ({
    id: user.id,
    email: user.email || '',
    name: user.name || '',
    role: user.role || 'member',
    kendra_id: user.kendra_id,
    created_at: user.created_at,
  }));

  // Filter by city in memory
  if (filters?.cityId) {
    users = users.filter((user: any) => {
      const userData = data?.find((u: any) => u.id === user.id);
      return userData?.kendra?.city?.id === filters.cityId;
    });
  }

  return users;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  kendra_id?: string;
}): Promise<User> {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
        role: userData.role,
        kendra_id: userData.kendra_id,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Profile is created automatically via trigger, but update it
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      name: userData.name,
      role: userData.role,
      kendra_id: userData.kendra_id,
    })
    .eq('id', authData.user.id)
    .select()
    .single();

  if (profileError) throw profileError;

  return {
    id: profile.id,
    email: profile.email || userData.email,
    name: profile.name || userData.name,
    role: profile.role || userData.role,
    kendra_id: profile.kendra_id,
    created_at: profile.created_at,
  };
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email || '',
    name: data.name || '',
    role: data.role || 'member',
    kendra_id: data.kendra_id,
    created_at: data.created_at,
  };
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Dashboard Stats
export async function getDashboardStats(userId?: string, userRole?: string, kendraId?: string): Promise<DashboardStats> {
  let reportsQuery = supabase
    .from('weekly_reports')
    .select('yuva_kendra_attendance, bhavferni_attendance, pravachan_attendance, week_start_date, kendra_id');

  if (userRole === 'member' && kendraId) {
    reportsQuery = reportsQuery.eq('kendra_id', kendraId);
  }

  const { data: reports, error: reportsError } = await reportsQuery;

  if (reportsError) throw reportsError;

  const reportsData = reports || [];
  const totalReports = reportsData.length;

  // Calculate averages
  const totalYuva = reportsData.reduce((sum, r) => sum + (r.yuva_kendra_attendance || 0), 0);
  const totalBhavferni = reportsData.reduce((sum, r) => sum + (r.bhavferni_attendance || 0), 0);
  const totalPravachan = reportsData.reduce((sum, r) => sum + (r.pravachan_attendance || 0), 0);

  const avgYuvaAttendance = totalReports > 0 ? totalYuva / totalReports : 0;
  const avgBhavferniAttendance = totalReports > 0 ? totalBhavferni / totalReports : 0;
  const avgPravachanAttendance = totalReports > 0 ? totalPravachan / totalReports : 0;

  const stats: DashboardStats = {
    totalReports,
    avgYuvaAttendance: Math.round(avgYuvaAttendance * 100) / 100,
    avgBhavferniAttendance: Math.round(avgBhavferniAttendance * 100) / 100,
    avgPravachanAttendance: Math.round(avgPravachanAttendance * 100) / 100,
  };

  if (userRole === 'admin') {
    // Get active Kendras (Kendras with at least one report)
    const { data: kendrasData } = await supabase
      .from('kendras')
      .select('id');

    const { data: reportsWithKendras } = await supabase
      .from('weekly_reports')
      .select('kendra_id');

    const uniqueKendras = new Set((reportsWithKendras || []).map((r: any) => r.kendra_id));
    stats.activeKendras = uniqueKendras.size;
  } else if (userRole === 'member' && kendraId) {
    // Get last week's total attendance for member
    const { getPreviousWeekStartDate } = await import('../utils/dateHelpers');
    const lastWeekStart = getPreviousWeekStartDate();

    const { data: lastWeekReport } = await supabase
      .from('weekly_reports')
      .select('yuva_kendra_attendance, bhavferni_attendance, pravachan_attendance')
      .eq('kendra_id', kendraId)
      .eq('week_start_date', lastWeekStart)
      .single();

    if (lastWeekReport) {
      stats.lastWeekTotal = 
        (lastWeekReport.yuva_kendra_attendance || 0) +
        (lastWeekReport.bhavferni_attendance || 0) +
        (lastWeekReport.pravachan_attendance || 0);
    } else {
      stats.lastWeekTotal = 0;
    }
  }

  return stats;
}

export async function getAttendanceTrends(userId?: string, userRole?: string, kendraId?: string, weeks: number = 5): Promise<Array<{ week: string; yuva: number; bhavferni: number; pravachan: number }>> {
  let query = supabase
    .from('weekly_reports')
    .select('week_start_date, yuva_kendra_attendance, bhavferni_attendance, pravachan_attendance')
    .order('week_start_date', { ascending: false })
    .limit(weeks * 10); // Get more to account for gaps and multiple reports per week

  if (userRole === 'member' && kendraId) {
    query = query.eq('kendra_id', kendraId);
  }

  const { data, error } = await query;

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  // Group by week and aggregate data
  const weekMap = new Map<string, { yuva: number; bhavferni: number; pravachan: number; count: number }>();

  (data || []).forEach((report: any) => {
    const week = report.week_start_date;
    if (!weekMap.has(week)) {
      weekMap.set(week, { yuva: 0, bhavferni: 0, pravachan: 0, count: 0 });
    }
    const weekData = weekMap.get(week)!;
    weekData.yuva += report.yuva_kendra_attendance || 0;
    weekData.bhavferni += report.bhavferni_attendance || 0;
    weekData.pravachan += report.pravachan_attendance || 0;
    weekData.count += 1;
  });

  // Convert to array, sort by date (ascending), and take last N weeks
  const allTrends = Array.from(weekMap.entries())
    .map(([week, data]) => ({ 
      week, 
      yuva: data.yuva,
      bhavferni: data.bhavferni,
      pravachan: data.pravachan,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Get the last N weeks
  const trends = allTrends.slice(-weeks);

  // If we have fewer than requested weeks, return what we have
  return trends;
}
