// Returns true if a date is in the past
export const isExpired = (date: Date): boolean => new Date(date) < new Date();

// Returns true if date expires within N days
export const isExpiringSoon = (date: Date, withinDays = 30): boolean => {
  const now = new Date();
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return new Date(date) <= threshold && !isExpired(date);
};

// Start and end of a given month: "2025-06" → { start, end }
export const getMonthBounds = (yearMonth: string): { start: Date; end: Date } => {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = new Date(year!, month! - 1, 1);
  const end = new Date(year!, month!, 0, 23, 59, 59, 999);
  return { start, end };
};