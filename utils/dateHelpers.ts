// Reference date: July 12th
const REFERENCE_DATE = new Date('2024-07-12');

export function getPushpNumber(weekStartDate: string): number {
  const date = new Date(weekStartDate);
  const diffTime = date.getTime() - REFERENCE_DATE.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks + 1;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export function getPreviousWeekStartDate(): string {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  return getWeekStartDate(lastWeek);
}

export function isValidReportDate(date: string): boolean {
  const reportDate = new Date(date);
  const today = new Date();
  const currentWeekStart = new Date(getWeekStartDate());
  const previousWeekStart = new Date(getPreviousWeekStartDate());

  // Reset time for comparison
  reportDate.setHours(0, 0, 0, 0);
  currentWeekStart.setHours(0, 0, 0, 0);
  previousWeekStart.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Can only report for current week or previous week
  return (
    reportDate.getTime() === currentWeekStart.getTime() ||
    reportDate.getTime() === previousWeekStart.getTime()
  );
}

export function getCurrentYearStart(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const july12 = new Date(currentYear, 6, 12); // Month is 0-indexed, so 6 = July

  if (today < july12) {
    // If before July 12, use previous year's July 12
    return new Date(currentYear - 1, 6, 12).toISOString().split('T')[0];
  }
  return july12.toISOString().split('T')[0];
}

export function getLastYearStart(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const july12 = new Date(currentYear - 1, 6, 12);
  return july12.toISOString().split('T')[0];
}

export function getCurrentYearEnd(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const july12 = new Date(currentYear, 6, 12);

  if (today < july12) {
    // If before July 12, end date is current year's July 11
    return new Date(currentYear, 6, 11).toISOString().split('T')[0];
  }
  // Otherwise, end date is next year's July 11
  return new Date(currentYear + 1, 6, 11).toISOString().split('T')[0];
}

export function getLastYearEnd(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const july12 = new Date(currentYear, 6, 12);

  if (today < july12) {
    // If before July 12, last year ended on previous year's July 11
    return new Date(currentYear - 1, 6, 11).toISOString().split('T')[0];
  }
  // Otherwise, last year ended on current year's July 11
  return new Date(currentYear, 6, 11).toISOString().split('T')[0];
}

