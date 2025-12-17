export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

export function validatePinCode(pinCode: string): boolean {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pinCode);
}

export function validateReportData(data: {
  kendra_id?: string;
  week_start_date?: string;
  yuva_kendra_attendance?: number;
  bhavferni_attendance?: number;
  pravachan_attendance?: number;
  pushp_no?: number;
}): { valid: boolean; message?: string } {
  if (!data.kendra_id) {
    return { valid: false, message: 'Kendra is required' };
  }
  if (!data.week_start_date) {
    return { valid: false, message: 'Week start date is required' };
  }
  if (data.yuva_kendra_attendance === undefined || data.yuva_kendra_attendance < 0) {
    return { valid: false, message: 'Valid Yuva Kendra attendance is required' };
  }
  if (data.bhavferni_attendance === undefined || data.bhavferni_attendance < 0) {
    return { valid: false, message: 'Valid Bhavferni attendance is required' };
  }
  if (data.pravachan_attendance === undefined || data.pravachan_attendance < 0) {
    return { valid: false, message: 'Valid Pravachan attendance is required' };
  }
  if (!data.pushp_no || data.pushp_no < 1) {
    return { valid: false, message: 'Pushp number must be at least 1' };
  }
  return { valid: true };
}

export function validateCityData(data: {
  city_name?: string;
  pin_code?: string;
}): { valid: boolean; message?: string } {
  if (!data.city_name || data.city_name.trim().length === 0) {
    return { valid: false, message: 'City name is required' };
  }
  if (!data.pin_code || !validatePinCode(data.pin_code)) {
    return { valid: false, message: 'Valid 6-digit PIN code is required' };
  }
  return { valid: true };
}

export function validateKendraData(data: {
  kendra_name?: string;
  city_id?: string;
  kendra_type?: 'Yuvan' | 'Yuvti';
}): { valid: boolean; message?: string } {
  if (!data.kendra_name || data.kendra_name.trim().length === 0) {
    return { valid: false, message: 'Kendra name is required' };
  }
  if (!data.city_id) {
    return { valid: false, message: 'City is required' };
  }
  if (!data.kendra_type || (data.kendra_type !== 'Yuvan' && data.kendra_type !== 'Yuvti')) {
    return { valid: false, message: 'Kendra type (Yuvan/Yuvti) is required' };
  }
  return { valid: true };
}

export function validateUserData(data: {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'member';
  kendra_id?: string;
  isEdit?: boolean;
}): { valid: boolean; message?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, message: 'Name is required' };
  }
  if (!data.email || !validateEmail(data.email)) {
    return { valid: false, message: 'Valid email is required' };
  }
  if (!data.isEdit) {
    const passwordValidation = validatePassword(data.password || '');
    if (!passwordValidation.valid) {
      return passwordValidation;
    }
  }
  if (!data.role || (data.role !== 'admin' && data.role !== 'member')) {
    return { valid: false, message: 'Role is required' };
  }
  if (data.role === 'member' && !data.kendra_id) {
    return { valid: false, message: 'Kendra assignment is required for members' };
  }
  return { valid: true };
}

